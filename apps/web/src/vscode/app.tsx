// WEB-14 VS Code 扩展 Webview 应用，把白板嵌入 IDE 并在宿主与画板之间转发文档变更
import { useEffect, useMemo, useRef, useState } from 'react';
import { MindForAI } from '@mindforai/mindforai';
import type { PlaitBoard } from '@plait/core';
import {
  documentTextToInitialValue,
  resolveSaveableDocumentFormatByPath,
  serializeBoardDocumentText,
} from '@mindforai/mindforai';
import { notifyHost, subscribeHostDocument, type HostDocumentMessage } from './bridge';
import './styles.scss';

type WebviewDocument = {
  fileName: string;
  fileUri?: string;
  text: string;
  revision: number;
};

const EDIT_DEBOUNCE_MS = 250;

export function WebviewApp() {
  const [webviewDocument, setWebviewDocument] = useState<WebviewDocument | null>(null);
  const boardRef = useRef<PlaitBoard | null>(null);
  const lastSentTextRef = useRef('');
  const editTimerRef = useRef<number | null>(null);
  const activeDocumentRef = useRef<WebviewDocument | null>(null);

  activeDocumentRef.current = webviewDocument;

  useEffect(() => {
    const handleDocument = (message: HostDocumentMessage) => {
      const text = typeof message.text === 'string' ? message.text : '';
      const activeDocument = activeDocumentRef.current;
      if (
        activeDocument &&
        activeDocument.text === text &&
        activeDocument.fileName === message.fileName
      ) {
        return;
      }
      const nextDocument: WebviewDocument = {
        fileName: message.fileName || 'untitled.mindforai',
        fileUri: message.fileUri,
        text,
        revision: Date.now(),
      };
      boardRef.current = null;
      lastSentTextRef.current = text;
      activeDocumentRef.current = nextDocument;
      setWebviewDocument(nextDocument);
    };
    return subscribeHostDocument(handleDocument);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModKey = event.ctrlKey || event.metaKey;
      if (isModKey && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        event.stopPropagation();
        notifyHost({ type: 'newDocument' });
      }
    };
    const handleFlush = () => flushDocumentSync();
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleFlush);
    document.addEventListener('visibilitychange', handleFlush);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleFlush);
      document.removeEventListener('visibilitychange', handleFlush);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (editTimerRef.current !== null) {
        window.clearTimeout(editTimerRef.current);
      }
    };
  }, []);

  const initialValue = useMemo(() => {
    if (!webviewDocument) {
      return null;
    }
    if (!webviewDocument.text.trim()) {
      return { elements: [], viewport: undefined, theme: undefined, language: undefined };
    }
    return documentTextToInitialValue(webviewDocument.fileName, webviewDocument.text);
  }, [webviewDocument]);

  const flushDocumentSync = () => {
    if (editTimerRef.current !== null) {
      window.clearTimeout(editTimerRef.current);
      editTimerRef.current = null;
    }
    const board = boardRef.current;
    const currentDocument = activeDocumentRef.current;
    if (!board || !currentDocument) {
      return;
    }
    const format = resolveSaveableDocumentFormatByPath(currentDocument.fileName);
    const text = serializeBoardDocumentText(board, format, currentDocument.fileName);
    if (!text || text === lastSentTextRef.current) {
      return;
    }
    lastSentTextRef.current = text;
    notifyHost({ type: 'edit', text });
  };

  const scheduleDocumentSync = () => {
    if (editTimerRef.current !== null) {
      window.clearTimeout(editTimerRef.current);
    }
    editTimerRef.current = window.setTimeout(flushDocumentSync, EDIT_DEBOUNCE_MS);
  };

  if (!webviewDocument) {
    return (
      <div className="vscode-editor-placeholder">
        <span className="vscode-editor-placeholder__text">正在加载 MindForAI…</span>
      </div>
    );
  }

  if (!initialValue) {
    return (
      <div className="vscode-editor-placeholder">
        <span className="vscode-editor-placeholder__text">
          无法解析该文档，请改用文本编辑器修正格式后再打开。
        </span>
        <button
          type="button"
          className="vscode-editor-placeholder__button"
          onClick={() => {
            notifyHost({ type: 'showTextEditor' });
          }}
        >
          用文本编辑器打开
        </button>
      </div>
    );
  }

  return (
    <MindForAI
      key={webviewDocument.revision}
      value={initialValue.elements}
      viewport={initialValue.viewport}
      theme={initialValue.theme ? { themeColorMode: initialValue.theme } : undefined}
      initialLanguage={initialValue.language || 'zh'}
      initialFilePath={webviewDocument.fileName}
      initialFileHandle={
        webviewDocument.fileUri
          ? { kind: 'file', name: webviewDocument.fileName, uri: webviewDocument.fileUri }
          : null
      }
      tutorial={initialValue.elements.length === 0}
      enableSessionRestore={false}
      afterInit={(board) => {
        boardRef.current = board;
      }}
      onValueChange={() => {
        scheduleDocumentSync();
      }}
      onOpenNewWindow={() => {
        notifyHost({ type: 'newDocument' });
      }}
    />
  );
}

export default WebviewApp;
