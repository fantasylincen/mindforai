// DESK-08 桌面版渲染进程与 Electron 主进程之间的文件通道，接管白板的打开、保存与窗口命令
import type { DocumentFileHost } from '@mindforai/mindforai';

export type DesktopHostFile = {
  name: string;
  path: string;
  text: string;
};

export type DesktopDirtyTab = {
  name: string;
  path: string;
  text: string;
};

export type DesktopMenuCommand = {
  command: string;
  value?: unknown;
};

export type DesktopMenuState = {
  autoSave: boolean;
  exportTransparent: boolean;
  language: string;
};

export type DesktopSaveResult = {
  cancelled?: boolean;
  error?: string;
  path?: string;
  name?: string;
};

export type DesktopApi = {
  openDocumentFiles: (options: {
    extensions?: string[];
    description?: string;
    multiple?: boolean;
  }) => Promise<{ cancelled?: boolean; error?: string; files: DesktopHostFile[] }>;
  readDocumentFiles: (paths: string[]) => Promise<{ files: DesktopHostFile[] }>;
  saveDocument: (payload: {
    text: string;
    name: string;
    extension: string;
    path: string;
    saveAs?: boolean;
  }) => Promise<DesktopSaveResult>;
  confirmCloseTab: (payload: { name: string }) => Promise<'save' | 'discard' | 'cancel'>;
  openNewWindow: () => Promise<void>;
  getPathForFile: (file: File) => string;
  onMenuCommand: (handler: (command: DesktopMenuCommand) => void) => () => void;
  onOpenPaths: (handler: (paths: string[]) => void) => () => void;
  onCollectDirty: (handler: () => void) => () => void;
  syncMenuState: (state: DesktopMenuState) => void;
  sendDirtyTabs: (tabs: DesktopDirtyTab[]) => void;
  notifyRendererReady: () => void;
};

declare global {
  interface Window {
    mindforaiDesktop?: DesktopApi;
  }
}

export const getDesktopApi = (): DesktopApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.mindforaiDesktop ?? null;
};

type OpenFilesListener = (files: DesktopHostFile[]) => void;
type SavedListener = (filePath: string) => void;
type DirtyCollector = () => DesktopDirtyTab[];

let openFilesListener: OpenFilesListener | null = null;
let savedListener: SavedListener | null = null;
let dirtyCollector: DirtyCollector | null = null;

export const setDesktopOpenFilesListener = (listener: OpenFilesListener | null) => {
  openFilesListener = listener;
};

export const setDesktopSavedListener = (listener: SavedListener | null) => {
  savedListener = listener;
};

export const setDesktopDirtyCollector = (collector: DirtyCollector | null) => {
  dirtyCollector = collector;
};

const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};

const normalizeExtensions = (extensions: string[] | undefined) =>
  (extensions || []).map((extension) => extension.replace(/^\./, '').toLowerCase()).filter(Boolean);

export const desktopFileSystemHandlers: DocumentFileHost = {
  openDocumentFilesByHost: async (options) => {
    const api = getDesktopApi();
    if (!api) {
      return [];
    }
    const result = await api.openDocumentFiles({
      extensions: normalizeExtensions(options.extensions),
      description: options.description,
      multiple: options.multiple,
    });
    if (result.error) {
      throw new Error(result.error);
    }
    if (result.cancelled || !result.files.length) {
      return [];
    }
    openFilesListener?.(result.files);
    return [];
  },
  saveDocumentBlobByHost: async (blob, options) => {
    const api = getDesktopApi();
    if (!api) {
      return null;
    }
    const text = await blob.text();
    const existingPath =
      options.fileHandle && typeof options.fileHandle === 'object'
        ? ((options.fileHandle as { uri?: string }).uri ?? '')
        : '';
    const result = await api.saveDocument({
      text,
      name: options.name,
      extension: options.extension,
      path: existingPath,
      saveAs: !existingPath,
    });
    if (result.cancelled) {
      throw createAbortError();
    }
    if (result.error || !result.path) {
      throw new Error(result.error || '保存失败');
    }
    savedListener?.(result.path);
    return { kind: 'file', name: result.path, uri: result.path };
  },
};

export const startDesktopBridge = () => {
  const api = getDesktopApi();
  if (!api) {
    return () => {};
  }
  const stopMenu = api.onMenuCommand((command) => {
    menuCommandHandler?.(command);
  });
  const stopCollect = api.onCollectDirty(() => {
    api.sendDirtyTabs(dirtyCollector?.() ?? []);
  });
  api.notifyRendererReady();
  return () => {
    stopMenu();
    stopCollect();
  };
};

type MenuCommandHandler = (command: DesktopMenuCommand) => void;

let menuCommandHandler: MenuCommandHandler | null = null;

export const setDesktopMenuCommandHandler = (handler: MenuCommandHandler | null) => {
  menuCommandHandler = handler;
};

export const syncDesktopMenuState = (state: DesktopMenuState) => {
  getDesktopApi()?.syncMenuState(state);
};

export const subscribeDesktopOpenPaths = (handler: (paths: string[]) => void) => {
  const api = getDesktopApi();
  if (!api) {
    return () => {};
  }
  return api.onOpenPaths(handler);
};

export const readDesktopDocuments = async (paths: string[]): Promise<DesktopHostFile[]> => {
  const api = getDesktopApi();
  if (!api || !paths.length) {
    return [];
  }
  const result = await api.readDocumentFiles(paths);
  return result.files || [];
};

export const pickDesktopDocuments = async (): Promise<DesktopHostFile[]> => {
  const api = getDesktopApi();
  if (!api) {
    return [];
  }
  const result = await api.openDocumentFiles({
    extensions: ['toon', 'json', 'md', 'mindforai', 'drawnixlite'],
    description: 'MindForAI 文档',
    multiple: true,
  });
  if (result.cancelled) {
    return [];
  }
  return result.files || [];
};

export const confirmDesktopCloseTab = async (name: string) => {
  const api = getDesktopApi();
  if (!api) {
    return 'discard' as const;
  }
  return api.confirmCloseTab({ name });
};

export const openDesktopNewWindow = () => {
  void getDesktopApi()?.openNewWindow();
};

export const getDroppedFileSystemPath = (file: File): string => {
  const api = getDesktopApi();
  if (!api) {
    return '';
  }
  return api.getPathForFile(file) || '';
};
