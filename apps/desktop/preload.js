// DESK-02 preload 在隔离环境下向渲染进程暴露受控的桌面能力，不开放任何 Node 接口（含顶部系统菜单状态同步）
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const MENU_CHANNEL = 'desktop:menu';
const OPEN_PATHS_CHANNEL = 'desktop:open-paths';
const COLLECT_DIRTY_CHANNEL = 'desktop:collect-dirty';
const DIRTY_RESPONSE_CHANNEL = 'desktop:dirty-response';
const MENU_STATE_CHANNEL = 'desktop:menu-state';

const subscribe = (channel, handler) => {
  const listener = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
};

contextBridge.exposeInMainWorld('mindforaiDesktop', {
  openDocumentFiles: (options) => ipcRenderer.invoke('desktop:open-files', options),
  readDocumentFiles: (paths) => ipcRenderer.invoke('desktop:read-files', paths),
  saveDocument: (payload) => ipcRenderer.invoke('desktop:save-document', payload),
  confirmCloseTab: (payload) => ipcRenderer.invoke('desktop:confirm-close', payload),
  openNewWindow: () => ipcRenderer.invoke('desktop:open-new-window'),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },
  onMenuCommand: (handler) => subscribe(MENU_CHANNEL, handler),
  onOpenPaths: (handler) => subscribe(OPEN_PATHS_CHANNEL, handler),
  onCollectDirty: (handler) => subscribe(COLLECT_DIRTY_CHANNEL, handler),
  syncMenuState: (state) => ipcRenderer.send(MENU_STATE_CHANNEL, state),
  notifyRendererReady: () => ipcRenderer.send('desktop:renderer-ready'),
  sendDirtyTabs: (tabs) => ipcRenderer.send(DIRTY_RESPONSE_CHANNEL, tabs),
});
