// VSX-01、VSX-02、VSX-03 VS Code 扩展入口：注册 .mindforai / .drawnixlite 白板编辑器、Webview 资源与命令
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const VIEW_TYPE = 'mindforai.editor';
const BOARD_FILE_EXTENSIONS = ['mindforai', 'drawnixlite'];
const OPENABLE_FILE_EXTENSIONS = ['mindforai', 'drawnixlite', 'md'];
const NEW_DOCUMENT_TEXT = 'type: mindforai\nversion: 1\ncontent[1]:\n  - text: MindForAI\n';

const getFileName = (uri) => path.basename(uri.fsPath || uri.path || 'untitled.mindforai');

const getExtensionName = (uri) => {
  const match = /\.([^.\\/]+)$/.exec(uri.fsPath || uri.path || '');
  return match ? match[1].toLowerCase() : 'mindforai';
};

const getWorkspaceFolderUri = () => vscode.workspace.workspaceFolders?.[0]?.uri;

class MindForAIEditorProvider {
  constructor(context) {
    this.context = context;
    this.documentStates = new Map();
  }

  getWebviewRootUri() {
    return vscode.Uri.joinPath(this.context.extensionUri, 'webview');
  }

  buildWebviewHtml(webview) {
    const indexPath = path.join(this.context.extensionUri.fsPath, 'webview', 'index.html');
    if (!fs.existsSync(indexPath)) {
      return this.buildMissingWebviewHtml();
    }
    const rawHtml = fs.readFileSync(indexPath, 'utf8');
    const mediaRoot = webview.asWebviewUri(this.getWebviewRootUri()).toString().replace(/\/$/, '');
    const withAssets = rawHtml.replace(
      /(src|href)="\.\/([^"]+)"/g,
      (_match, attribute, assetPath) => `${attribute}="${mediaRoot}/${assetPath}"`
    );
    const contentSecurityPolicy = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data: blob:`,
      `media-src ${webview.cspSource} data: blob:`,
      `script-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
      `connect-src ${webview.cspSource} data: blob:`,
      `worker-src ${webview.cspSource} blob:`,
    ].join('; ');
    return withAssets.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`
    );
  }

  buildMissingWebviewHtml() {
    return [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head><meta charset="utf-8" /></head>',
      '<body style="font-family: sans-serif; padding: 16px;">',
      '<p>MindForAI Webview 资源缺失，请先在仓库根目录执行 <code>npm run package:vscode</code> 重新构建扩展。</p>',
      '</body>',
      '</html>',
    ].join('\n');
  }

  getDocumentState(document) {
    const uriString = document.uri.toString();
    let state = this.documentStates.get(uriString);
    if (!state) {
      state = {
        uriString,
        document,
        panels: new Set(),
        lastDocumentText: document.getText(),
      };
      this.documentStates.set(uriString, state);
    }
    return state;
  }

  buildDocumentPayload(state) {
    return {
      type: 'document',
      fileName: getFileName(state.document.uri),
      fileUri: state.uriString,
      text: state.document.getText(),
    };
  }

  postDocumentToPanel(state, panel) {
    panel.webview.postMessage(this.buildDocumentPayload(state));
  }

  postDocumentToOtherPanels(state, sourcePanel) {
    const payload = this.buildDocumentPayload(state);
    for (const panel of state.panels) {
      if (panel !== sourcePanel) {
        panel.webview.postMessage(payload);
      }
    }
  }

  async syncTextToDocument(state, text) {
    state.lastDocumentText = text;
    if (state.document.getText() === text) {
      return;
    }
    const documentRange = new vscode.Range(
      state.document.positionAt(0),
      state.document.positionAt(state.document.getText().length)
    );
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(state.document.uri, documentRange, text);
    await vscode.workspace.applyEdit(workspaceEdit);
  }

  async openDocumentsFromHost(message) {
    const requestedExtensions = Array.isArray(message.extensions) ? message.extensions : [];
    const extensions = requestedExtensions
      .map((extension) => String(extension).replace(/^\./, '').toLowerCase())
      .filter((extension) => OPENABLE_FILE_EXTENSIONS.includes(extension));
    const selectedUris = await vscode.window.showOpenDialog({
      canSelectMany: !!message.multiple,
      openLabel: '打开',
      filters: { MindForAI: extensions.length ? extensions : OPENABLE_FILE_EXTENSIONS },
    });
    if (!selectedUris || !selectedUris.length) {
      return { cancelled: true };
    }
    for (const selectedUri of selectedUris) {
      if (BOARD_FILE_EXTENSIONS.includes(getExtensionName(selectedUri))) {
        await vscode.commands.executeCommand('vscode.openWith', selectedUri, VIEW_TYPE);
      } else {
        await vscode.commands.executeCommand('vscode.open', selectedUri);
      }
    }
    return { files: [] };
  }

  async saveDocumentFromHost(state, message) {
    const text = typeof message.text === 'string' ? message.text : '';
    const extensionName = String(message.extension || 'mindforai').toLowerCase();
    const handleUri = typeof message.handleUri === 'string' ? message.handleUri : undefined;
    const currentHandle = {
      kind: 'file',
      name: getFileName(state.document.uri),
      uri: state.uriString,
    };
    if (handleUri && handleUri === state.uriString) {
      if (state.document.getText() !== text) {
        await this.syncTextToDocument(state, text);
      }
      await state.document.save();
      return { handle: currentHandle };
    }
    const suggestedName = `${message.name || 'untitled'}.${extensionName}`;
    const currentFolderUri =
      state.document.uri.scheme === 'file'
        ? vscode.Uri.file(path.dirname(state.document.uri.fsPath))
        : null;
    const defaultUri = currentFolderUri
      ? vscode.Uri.joinPath(currentFolderUri, suggestedName)
      : getWorkspaceFolderUri()
        ? vscode.Uri.joinPath(getWorkspaceFolderUri(), suggestedName)
        : undefined;
    const targetUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { [message.description || 'MindForAI']: [extensionName] },
      saveLabel: '保存',
    });
    if (!targetUri) {
      return { cancelled: true };
    }
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(text, 'utf8'));
    if (BOARD_FILE_EXTENSIONS.includes(extensionName)) {
      await vscode.commands.executeCommand('vscode.openWith', targetUri, VIEW_TYPE);
    } else {
      await vscode.commands.executeCommand('vscode.open', targetUri);
    }
    return { handle: currentHandle };
  }

  async handleWebviewMessage(state, panel, message) {
    if (!message || typeof message !== 'object') {
      return;
    }
    const requestId = message.requestId;
    const respond = (payload) => {
      if (requestId) {
        panel.webview.postMessage({ ...payload, type: 'response', requestId });
      }
    };
    try {
      if (message.type === 'ready' || message.type === 'documentRequest') {
        this.postDocumentToPanel(state, panel);
        return;
      }
      if (message.type === 'edit') {
        await this.syncTextToDocument(state, String(message.text ?? ''));
        this.postDocumentToOtherPanels(state, panel);
        return;
      }
      if (message.type === 'openFiles') {
        respond(await this.openDocumentsFromHost(message));
        return;
      }
      if (message.type === 'saveFile') {
        respond(await this.saveDocumentFromHost(state, message));
        return;
      }
      if (message.type === 'newDocument') {
        await vscode.commands.executeCommand('mindforai.newDocument');
        return;
      }
      if (message.type === 'showTextEditor') {
        await vscode.commands.executeCommand('vscode.openWith', state.document.uri, 'default');
        return;
      }
    } catch (error) {
      respond({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  resolveCustomTextEditor(document, panel) {
    const state = this.getDocumentState(document);
    state.panels.add(panel);
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.getWebviewRootUri()],
    };
    panel.webview.html = this.buildWebviewHtml(panel.webview);
    const messageSubscription = panel.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(state, panel, message);
    });
    const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() !== state.uriString) {
        return;
      }
      const text = event.document.getText();
      if (text === state.lastDocumentText) {
        return;
      }
      state.lastDocumentText = text;
      this.postDocumentToOtherPanels(state, null);
    });
    panel.onDidDispose(() => {
      state.panels.delete(panel);
      messageSubscription.dispose();
      changeSubscription.dispose();
      if (state.panels.size === 0) {
        this.documentStates.delete(state.uriString);
      }
    });
  }
}

const openWithEditor = async (uri) => {
  let targetUri = uri;
  if (!targetUri) {
    const selectedUris = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: '打开',
      filters: { MindForAI: OPENABLE_FILE_EXTENSIONS },
    });
    if (!selectedUris || !selectedUris.length) {
      return;
    }
    targetUri = selectedUris[0];
  }
  await vscode.commands.executeCommand('vscode.openWith', targetUri, VIEW_TYPE);
};

const newDocument = async () => {
  const workspaceFolderUri = getWorkspaceFolderUri();
  const targetUri = await vscode.window.showSaveDialog({
    defaultUri: workspaceFolderUri
      ? vscode.Uri.joinPath(workspaceFolderUri, 'untitled.mindforai')
      : undefined,
    filters: { MindForAI: ['mindforai'] },
    saveLabel: '创建',
  });
  if (!targetUri) {
    return;
  }
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(NEW_DOCUMENT_TEXT, 'utf8'));
  await vscode.commands.executeCommand('vscode.openWith', targetUri, VIEW_TYPE);
};

const activate = (context) => {
  const provider = new MindForAIEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: true,
    }),
    vscode.commands.registerCommand('mindforai.openWithEditor', openWithEditor),
    vscode.commands.registerCommand('mindforai.newDocument', newDocument)
  );
};

const deactivate = () => {};

module.exports = { activate, deactivate };
