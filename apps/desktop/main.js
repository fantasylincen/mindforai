// DESK-01 Electron 主进程：管理窗口、顶部系统菜单（文件 / 编辑 / 标签页 / 视图 / 语言 / 帮助）与自动保存开关、原生文件读写、单实例文件关联与退出前保存确认
const { app, BrowserWindow, dialog, ipcMain, Menu, protocol, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

const APPLICATION_NAME = 'MindForAI';
const APP_USER_MODEL_ID = 'com.mindforai.desktop';
const PROJECT_URL = 'https://github.com/fantasylincen/mindforai';
const OPENABLE_EXTENSIONS = ['toon', 'json', 'md', 'mindforai', 'drawnixlite'];
const DOCUMENT_FILTERS = [
  { name: 'MindForAI 文档', extensions: OPENABLE_EXTENSIONS },
  { name: '全部文件', extensions: ['*'] },
];
const RENDERER_ENTRY_CANDIDATES = ['renderer/index.html', '../../dist/apps/desktop-web/index.html'];
const APP_SCHEME = 'app';
const APP_HOST = 'mindforai';
const APP_ENTRY_URL = `${APP_SCHEME}://${APP_HOST}/index.html`;
const MIME_TYPES_BY_EXTENSION = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.map': 'application/json',
};
const PRELOAD_FILE = path.join(__dirname, 'preload.js');
const MENU_CHANNEL = 'desktop:menu';
const OPEN_PATHS_CHANNEL = 'desktop:open-paths';
const COLLECT_DIRTY_CHANNEL = 'desktop:collect-dirty';
const DIRTY_RESPONSE_CHANNEL = 'desktop:dirty-response';
const MENU_STATE_CHANNEL = 'desktop:menu-state';
const AUTO_SAVE_MENU_ITEM_ID = 'menu-auto-save';
const EXPORT_TRANSPARENT_MENU_ITEM_ID = 'menu-export-transparent';
const MENU_LANGUAGE_ITEMS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'vi', label: 'Tiếng Việt' },
];
const SAVE_AS_FORMAT_ITEMS = [
  { label: '另存为 .toon', format: 'mindforai' },
  { label: '另存为 .json', format: 'drawnixlite' },
  { label: '另存为 .md', format: 'markdown' },
];
const DEFAULT_MENU_STATE = { autoSave: false, exportTransparent: false, language: 'zh' };

const windows = new Set();
let mainWindow = null;
let allowQuit = false;
let quitInProgress = false;
let menuState = { ...DEFAULT_MENU_STATE };

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const resolveRendererEntry = () => {
  for (const candidate of RENDERER_ENTRY_CANDIDATES) {
    const fullPath = path.join(__dirname, candidate);
    if (fsSync.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return '';
};

const isOpenableDocumentPath = (filePath) => {
  if (!filePath || filePath.startsWith('-')) {
    return false;
  }
  const extension = path.extname(filePath).replace('.', '').toLowerCase();
  return OPENABLE_EXTENSIONS.includes(extension);
};

const readDocumentFile = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8');
  return { name: path.basename(filePath), path: filePath, text };
};

const buildWindowTitle = () => APPLICATION_NAME;

const sendMenuCommand = (command, value) => {
  const target = BrowserWindow.getFocusedWindow() || mainWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send(MENU_CHANNEL, { command, value });
  }
};

const broadcastMenuCommand = (command, value) => {
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(MENU_CHANNEL, { command, value });
    }
  }
};

const setMenuItemChecked = (menuItemId, isChecked) => {
  const menuItem = Menu.getApplicationMenu()?.getMenuItemById(menuItemId);
  if (menuItem) {
    menuItem.checked = !!isChecked;
  }
};

// 渲染进程上报的菜单状态用于刷新系统菜单的勾选状态（自动保存 / 透明背景 / 界面语言）
const applyMenuState = (state) => {
  if (!state || typeof state !== 'object') {
    return;
  }
  if (typeof state.autoSave === 'boolean') {
    menuState.autoSave = state.autoSave;
  }
  if (typeof state.exportTransparent === 'boolean') {
    menuState.exportTransparent = state.exportTransparent;
  }
  if (typeof state.language === 'string') {
    menuState.language = state.language;
  }
  setMenuItemChecked(AUTO_SAVE_MENU_ITEM_ID, menuState.autoSave);
  setMenuItemChecked(EXPORT_TRANSPARENT_MENU_ITEM_ID, menuState.exportTransparent);
  MENU_LANGUAGE_ITEMS.forEach((item) => {
    setMenuItemChecked(`menu-language-${item.code}`, menuState.language === item.code);
  });
};

const showAboutDialog = (window) => {
  dialog.showMessageBox(window, {
    type: 'info',
    title: `关于 ${APPLICATION_NAME}`,
    message: `${APPLICATION_NAME} 桌面版`,
    detail: [
      `版本：${app.getVersion()}`,
      '用思维导图生成喂给 AI 的项目文档。',
      '文档格式：.toon / .json / .md',
    ].join('\n'),
    buttons: ['确定'],
    noLink: true,
  });
};

const buildApplicationMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '新建标签页', accelerator: 'Control+N', click: () => sendMenuCommand('new-tab') },
        { label: '新建窗口', accelerator: 'Control+Shift+N', click: () => createWindow() },
        { type: 'separator' },
        { label: '打开…', accelerator: 'Control+O', click: () => sendMenuCommand('open') },
        { label: '保存', accelerator: 'Control+S', click: () => sendMenuCommand('save') },
        {
          label: '另存为…',
          accelerator: 'Control+Shift+S',
          click: () => sendMenuCommand('save-as'),
        },
        {
          label: '另存为格式',
          submenu: SAVE_AS_FORMAT_ITEMS.map((item) => ({
            label: item.label,
            click: () => sendMenuCommand('save-as-format', item.format),
          })),
        },
        { type: 'separator' },
        {
          label: '导出图片',
          submenu: [
            {
              label: '导出为 SVG…',
              accelerator: 'Control+Shift+E',
              registerAccelerator: false,
              click: () => sendMenuCommand('export-svg'),
            },
            { label: '导出为 PNG…', click: () => sendMenuCommand('export-png') },
            { type: 'separator' },
            {
              id: EXPORT_TRANSPARENT_MENU_ITEM_ID,
              label: '透明背景',
              type: 'checkbox',
              checked: menuState.exportTransparent,
              click: (menuItem) =>
                broadcastMenuCommand('set-export-transparent', !!menuItem.checked),
            },
          ],
        },
        { type: 'separator' },
        {
          id: AUTO_SAVE_MENU_ITEM_ID,
          label: '自动保存',
          type: 'checkbox',
          checked: menuState.autoSave,
          click: (menuItem) => broadcastMenuCommand('set-auto-save', !!menuItem.checked),
        },
        { type: 'separator' },
        {
          label: '关闭标签页',
          accelerator: 'Control+W',
          click: () => sendMenuCommand('close-tab'),
        },
        { label: '关闭窗口', accelerator: 'Control+Shift+W', role: 'close' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'Control+Z',
          registerAccelerator: false,
          click: () => sendMenuCommand('undo'),
        },
        {
          label: '重做',
          accelerator: 'Control+Shift+Z',
          registerAccelerator: false,
          click: () => sendMenuCommand('redo'),
        },
        { type: 'separator' },
        {
          label: '剪切',
          accelerator: 'Control+X',
          registerAccelerator: false,
          click: () => sendMenuCommand('cut'),
        },
        {
          label: '复制',
          accelerator: 'Control+C',
          registerAccelerator: false,
          click: () => sendMenuCommand('copy'),
        },
        {
          label: '粘贴',
          accelerator: 'Control+V',
          registerAccelerator: false,
          click: () => sendMenuCommand('paste'),
        },
        {
          label: '全选',
          accelerator: 'Control+A',
          registerAccelerator: false,
          click: () => sendMenuCommand('select-all'),
        },
        { type: 'separator' },
        {
          label: '搜索节点',
          accelerator: 'Control+F',
          registerAccelerator: false,
          click: () => sendMenuCommand('search-nodes'),
        },
        {
          label: '清空画板',
          accelerator: 'Control+Backspace',
          registerAccelerator: false,
          click: () => sendMenuCommand('clean-board'),
        },
      ],
    },
    {
      label: '标签页',
      submenu: [
        {
          label: '下一个标签页',
          accelerator: 'Control+Tab',
          click: () => sendMenuCommand('next-tab'),
        },
        {
          label: '上一个标签页',
          accelerator: 'Control+Shift+Tab',
          click: () => sendMenuCommand('previous-tab'),
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'Control+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'Control+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'Control+Shift+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'Control+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'Control+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'Control+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: '语言',
      submenu: MENU_LANGUAGE_ITEMS.map((item) => ({
        id: `menu-language-${item.code}`,
        label: item.label,
        type: 'radio',
        checked: menuState.language === item.code,
        click: () => broadcastMenuCommand('set-language', item.code),
      })),
    },
    {
      label: '帮助',
      submenu: [
        { label: '使用帮助', accelerator: 'F1', click: () => sendMenuCommand('help') },
        { label: 'GitHub 项目主页', click: () => shell.openExternal(PROJECT_URL) },
        { type: 'separator' },
        {
          label: `关于 ${APPLICATION_NAME}`,
          click: () => showAboutDialog(BrowserWindow.getFocusedWindow() || mainWindow),
        },
      ],
    },
  ];
  return template;
};

const requestDirtyTabs = (window) =>
  new Promise((resolve) => {
    if (!window || window.isDestroyed()) {
      resolve([]);
      return;
    }
    const timer = setTimeout(() => {
      ipcMain.removeListener(DIRTY_RESPONSE_CHANNEL, handleResponse);
      resolve([]);
    }, 2500);
    const handleResponse = (event, payload) => {
      if (event.sender !== window.webContents) {
        return;
      }
      clearTimeout(timer);
      ipcMain.removeListener(DIRTY_RESPONSE_CHANNEL, handleResponse);
      resolve(Array.isArray(payload) ? payload : []);
    };
    ipcMain.on(DIRTY_RESPONSE_CHANNEL, handleResponse);
    window.webContents.send(COLLECT_DIRTY_CHANNEL);
  });

const saveDirtyTab = async (window, tab) => {
  const text = typeof tab.text === 'string' ? tab.text : '';
  let targetPath = typeof tab.path === 'string' && tab.path ? tab.path : '';
  if (!targetPath) {
    const suggestedPath = path.join(app.getPath('documents'), tab.name || 'untitled.toon');
    const result = await dialog.showSaveDialog(window, {
      title: '保存 MindForAI 文档',
      defaultPath: suggestedPath,
      filters: DOCUMENT_FILTERS,
    });
    if (result.canceled || !result.filePath) {
      return false;
    }
    targetPath = result.filePath;
  }
  try {
    await fs.writeFile(targetPath, text, 'utf8');
    return true;
  } catch {
    return false;
  }
};

const confirmQuit = async (window) => {
  if (quitInProgress) {
    return;
  }
  quitInProgress = true;
  const dirtyTabs = await requestDirtyTabs(window);
  if (dirtyTabs.length) {
    const documentNames = dirtyTabs.map((tab) => tab.name || tab.path || '未命名').join('\n');
    const result = await dialog.showMessageBox(window, {
      type: 'warning',
      title: '尚未保存的更改',
      message: `有 ${dirtyTabs.length} 个标签页尚未保存`,
      detail: documentNames,
      buttons: ['保存并退出', '不保存退出', '取消'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });
    if (result.response === 2) {
      quitInProgress = false;
      return;
    }
    if (result.response === 0) {
      for (const tab of dirtyTabs) {
        const saved = await saveDirtyTab(window, tab);
        if (!saved) {
          quitInProgress = false;
          return;
        }
      }
    }
  }
  quitInProgress = false;
  allowQuit = true;
  app.quit();
};

const handleWindowClose = (event, window) => {
  if (allowQuit) {
    return;
  }
  event.preventDefault();
  void confirmQuit(window);
};

const pendingOpenPaths = new Map();

const flushPendingOpenPaths = (window) => {
  const queuedPaths = pendingOpenPaths.get(window) || [];
  if (!queuedPaths.length || window.isDestroyed()) {
    return;
  }
  pendingOpenPaths.delete(window);
  window.webContents.send(OPEN_PATHS_CHANNEL, queuedPaths);
};

const openPathsInWindow = (window, paths) => {
  const documentPaths = paths.filter(isOpenableDocumentPath);
  if (!window || window.isDestroyed() || !documentPaths.length) {
    return;
  }
  if (window.__mindforaiRendererReady) {
    window.webContents.send(OPEN_PATHS_CHANNEL, documentPaths);
    return;
  }
  const queuedPaths = pendingOpenPaths.get(window) || [];
  pendingOpenPaths.set(window, [...queuedPaths, ...documentPaths]);
};

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    show: false,
    title: buildWindowTitle(),
    backgroundColor: '#181a1f',
    autoHideMenuBar: false,
    webPreferences: {
      preload: PRELOAD_FILE,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });
  windows.add(window);
  if (!mainWindow) {
    mainWindow = window;
  }
  window.once('ready-to-show', () => window.show());
  window.on('close', (event) => handleWindowClose(event, window));
  window.on('closed', () => {
    windows.delete(window);
    pendingOpenPaths.delete(window);
    if (mainWindow === window) {
      mainWindow = windows.values().next().value || null;
    }
  });
  const rendererEntry = resolveRendererEntry();
  if (rendererEntry) {
    window.loadURL(APP_ENTRY_URL);
  } else {
    window.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<h1>MindForAI 桌面资源缺失</h1><p>请先在仓库根目录执行 npm run build:desktop 重新构建。</p>'
        )
    );
  }
  return window;
};

const registerAppProtocol = () => {
  const rendererRoot = path.dirname(resolveRendererEntry());
  if (!rendererRoot) {
    return;
  }
  const normalizedRoot = path.normalize(rendererRoot);
  protocol.handle(APP_SCHEME, async (request) => {
    const requestUrl = new URL(request.url);
    const relativePath =
      decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
    const targetPath = path.normalize(path.join(normalizedRoot, relativePath));
    if (targetPath !== normalizedRoot && !targetPath.startsWith(normalizedRoot + path.sep)) {
      return new Response('Forbidden', { status: 403 });
    }
    let fileBytes;
    try {
      fileBytes = await fs.readFile(targetPath);
    } catch {
      return new Response('Not Found', { status: 404 });
    }
    const contentType = MIME_TYPES_BY_EXTENSION[path.extname(targetPath).toLowerCase()];
    return new Response(fileBytes, {
      status: 200,
      headers: contentType ? { 'content-type': contentType } : {},
    });
  });
};

const registerDownloadHandler = () => {
  session.defaultSession.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ title: '保存导出文件' });
  });
};

const registerIpcHandlers = () => {
  ipcMain.handle('desktop:open-files', async (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const requestedExtensions =
      Array.isArray(options?.extensions) && options.extensions.length
        ? options.extensions
            .map((extension) => String(extension).replace(/^\./, ''))
            .filter(Boolean)
        : OPENABLE_EXTENSIONS;
    const result = await dialog.showOpenDialog(window, {
      title: '打开 MindForAI 文档',
      properties: options?.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: [{ name: 'MindForAI 文档', extensions: requestedExtensions }, ...DOCUMENT_FILTERS],
    });
    if (result.canceled || !result.filePaths.length) {
      return { cancelled: true, files: [] };
    }
    const files = [];
    for (const filePath of result.filePaths) {
      try {
        files.push(await readDocumentFile(filePath));
      } catch {
        return { error: `无法读取文件：${filePath}` };
      }
    }
    return { cancelled: false, files };
  });

  ipcMain.handle('desktop:read-files', async (_event, paths) => {
    const filePaths = Array.isArray(paths) ? paths.filter(isOpenableDocumentPath) : [];
    const files = [];
    for (const filePath of filePaths) {
      try {
        files.push(await readDocumentFile(filePath));
      } catch {
        continue;
      }
    }
    return { files };
  });

  ipcMain.handle('desktop:save-document', async (event, payload) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const text = typeof payload?.text === 'string' ? payload.text : '';
    const extension = String(payload?.extension || 'toon').toLowerCase();
    const suggestedName = `${payload?.name || 'untitled'}.${extension}`;
    let targetPath = typeof payload?.path === 'string' ? payload.path : '';
    if (!targetPath || payload?.saveAs) {
      const result = await dialog.showSaveDialog(window, {
        title: '保存 MindForAI 文档',
        defaultPath: targetPath || suggestedName,
        filters: [{ name: 'MindForAI 文档', extensions: [extension] }, ...DOCUMENT_FILTERS],
      });
      if (result.canceled || !result.filePath) {
        return { cancelled: true };
      }
      targetPath = result.filePath;
    }
    try {
      await fs.writeFile(targetPath, text, 'utf8');
    } catch {
      return { error: `无法写入文件：${targetPath}` };
    }
    return { cancelled: false, path: targetPath, name: path.basename(targetPath) };
  });

  ipcMain.handle('desktop:confirm-close', async (event, payload) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const documentName = payload?.name || '未命名';
    const result = await dialog.showMessageBox(window, {
      type: 'question',
      title: '关闭标签页',
      message: `是否保存对「${documentName}」的更改？`,
      detail: '如果不保存，本次修改将丢失。',
      buttons: ['保存', '不保存', '取消'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });
    if (result.response === 0) {
      return 'save';
    }
    if (result.response === 1) {
      return 'discard';
    }
    return 'cancel';
  });

  ipcMain.on(MENU_STATE_CHANNEL, (_event, state) => {
    applyMenuState(state);
  });

  ipcMain.on('desktop:renderer-ready', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return;
    }
    window.__mindforaiRendererReady = true;
    flushPendingOpenPaths(window);
  });

  ipcMain.handle('desktop:open-new-window', () => {
    createWindow();
  });
};

const collectLaunchPaths = (argv) => argv.filter(isOpenableDocumentPath);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const target = mainWindow || createWindow();
    if (target.isMinimized()) {
      target.restore();
    }
    target.focus();
    openPathsInWindow(target, collectLaunchPaths(argv));
  });

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    const target = mainWindow || createWindow();
    openPathsInWindow(target, [filePath]);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (!windows.size) {
      createWindow();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_USER_MODEL_ID);
    Menu.setApplicationMenu(Menu.buildFromTemplate(buildApplicationMenu()));
    registerAppProtocol();
    registerDownloadHandler();
    registerIpcHandlers();
    const window = createWindow();
    openPathsInWindow(window, collectLaunchPaths(process.argv));
  });
}
