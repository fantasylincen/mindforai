// DESK-12 桌面版渲染进程单元测试：校验宿主文件通道的打开、关闭取消与保存回写
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  desktopFileSystemHandlers,
  setDesktopDirtyCollector,
  setDesktopMenuCommandHandler,
  setDesktopOpenFilesListener,
  setDesktopSavedListener,
  startDesktopBridge,
  type DesktopApi,
} from './bridge';
import {
  createBlankTab,
  createTabFromFile,
  getTabBaseName,
  getTabFormat,
  getTabInitialValue,
  getTabTitle,
} from './tab-model';

const hostFile = {
  name: 'project.toon',
  path: 'C:\\docs\\project.toon',
  text: 'type: mindforai\nversion: 1\ncontent[1]:\n  - text: 项目\n',
};

const installDesktopApi = (overrides: Partial<DesktopApi> = {}) => {
  const openDocumentFiles = vi.fn(async () => ({ cancelled: false, files: [hostFile] }));
  const saveDocument = vi.fn(async () => ({
    cancelled: false,
    path: 'C:\\docs\\saved.toon',
    name: 'saved.toon',
  }));
  const confirmCloseTab = vi.fn(async () => 'discard' as const);
  const api: DesktopApi = {
    openDocumentFiles,
    readDocumentFiles: vi.fn(async () => ({ files: [hostFile] })),
    saveDocument,
    confirmCloseTab,
    openNewWindow: vi.fn(async () => {}),
    getPathForFile: () => 'C:\\docs\\dropped.toon',
    onMenuCommand: () => () => {},
    onOpenPaths: () => () => {},
    onCollectDirty: () => () => {},
    syncMenuState: vi.fn(),
    sendDirtyTabs: vi.fn(),
    notifyRendererReady: vi.fn(),
    ...overrides,
  };
  (window as unknown as { mindforaiDesktop?: DesktopApi }).mindforaiDesktop = api;
  return { api, openDocumentFiles, saveDocument, confirmCloseTab };
};

describe('desktop host bridge', () => {
  beforeEach(() => {
    delete (window as unknown as { mindforaiDesktop?: DesktopApi }).mindforaiDesktop;
  });

  it('打开文档时把文件交给标签页监听者并返回空数组', async () => {
    const { openDocumentFiles } = installDesktopApi();
    const openFilesListener = vi.fn();
    setDesktopOpenFilesListener(openFilesListener);
    const files = await desktopFileSystemHandlers.openDocumentFilesByHost({
      extensions: ['.toon', '.MD'],
      description: 'MindForAI 文档',
      multiple: true,
    });
    expect(openDocumentFiles).toHaveBeenCalledWith({
      extensions: ['toon', 'md'],
      description: 'MindForAI 文档',
      multiple: true,
    });
    expect(openFilesListener).toHaveBeenCalledWith([hostFile]);
    expect(files).toEqual([]);
    setDesktopOpenFilesListener(null);
  });

  it('用户取消打开对话框时返回空数组', async () => {
    installDesktopApi({ openDocumentFiles: vi.fn(async () => ({ cancelled: true, files: [] })) });
    const files = await desktopFileSystemHandlers.openDocumentFilesByHost({
      extensions: ['.toon'],
      description: 'MindForAI 文档',
      multiple: false,
    });
    expect(files).toEqual([]);
  });

  it('保存时写入文本并把新路径回写给标签页', async () => {
    const { saveDocument } = installDesktopApi();
    const savedListener = vi.fn();
    setDesktopSavedListener(savedListener);
    const handle = await desktopFileSystemHandlers.saveDocumentBlobByHost(
      new Blob(['hello toon'], { type: 'text/plain' }),
      {
        name: 'saved',
        extension: 'toon',
        description: 'MindForAI 文档',
        fileHandle: { kind: 'file', name: 'old.toon', uri: 'C:\\docs\\old.toon' },
      }
    );
    expect(saveDocument).toHaveBeenCalledWith({
      text: 'hello toon',
      name: 'saved',
      extension: 'toon',
      path: 'C:\\docs\\old.toon',
      saveAs: false,
    });
    expect(savedListener).toHaveBeenCalledWith('C:\\docs\\saved.toon');
    expect(handle).toEqual({
      kind: 'file',
      name: 'C:\\docs\\saved.toon',
      uri: 'C:\\docs\\saved.toon',
    });
    setDesktopSavedListener(null);
  });

  it('保存对话框被取消时抛出 AbortError', async () => {
    installDesktopApi({ saveDocument: vi.fn(async () => ({ cancelled: true })) });
    await expect(
      desktopFileSystemHandlers.saveDocumentBlobByHost(new Blob(['x']), {
        name: 'untitled',
        extension: 'toon',
        description: 'MindForAI 文档',
        fileHandle: null,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('主进程请求未保存标签页时回传标签文本', () => {
    const collectHandlers: (() => void)[] = [];
    const menuHandlers: ((command: { command: string }) => void)[] = [];
    const sendDirtyTabs = vi.fn();
    installDesktopApi({
      sendDirtyTabs,
      onCollectDirty: (handler) => {
        collectHandlers.push(handler);
        return () => {};
      },
      onMenuCommand: (handler) => {
        menuHandlers.push(handler);
        return () => {};
      },
    });
    setDesktopDirtyCollector(() => [{ name: 'a.toon', path: 'C:\\a.toon', text: 'content' }]);
    const stop = startDesktopBridge();
    collectHandlers[0]();
    expect(sendDirtyTabs).toHaveBeenCalledWith([
      { name: 'a.toon', path: 'C:\\a.toon', text: 'content' },
    ]);
    stop();
    setDesktopDirtyCollector(null);
    expect(menuHandlers).toHaveLength(1);
  });

  it('启动桌面桥时通知主进程渲染进程已就绪', () => {
    const notifyRendererReady = vi.fn();
    installDesktopApi({ notifyRendererReady });
    const stop = startDesktopBridge();
    expect(notifyRendererReady).toHaveBeenCalledTimes(1);
    stop();
  });

  it('主进程菜单命令转发给应用处理器', () => {
    const menuHandlers: ((command: { command: string }) => void)[] = [];
    installDesktopApi({
      onMenuCommand: (handler) => {
        menuHandlers.push(handler);
        return () => {};
      },
    });
    const commandHandler = vi.fn();
    setDesktopMenuCommandHandler(commandHandler);
    startDesktopBridge();
    menuHandlers[0]({ command: 'new-tab' });
    expect(commandHandler).toHaveBeenCalledWith({ command: 'new-tab' });
    setDesktopMenuCommandHandler(null);
  });
});

describe('desktop tab model', () => {
  it('新建空标签页时使用未命名标题且无脏标记', () => {
    const tab = createBlankTab();
    expect(tab.name).toBe('未命名');
    expect(tab.path).toBe('');
    expect(tab.dirty).toBe(false);
  });

  it('从文件创建标签页时使用文件名作为标题并识别格式', () => {
    const tab = createTabFromFile({ name: 'notes.md', path: '/docs/notes.md', text: '# 标题' });
    expect(tab.name).toBe('notes.md');
    expect(getTabFormat(tab)).toBe('markdown');
  });

  it('空文档解析为空画板', () => {
    const initialValue = getTabInitialValue(createBlankTab());
    expect(initialValue.elements).toEqual([]);
  });

  it('读取 .toon 文本为画板节点', () => {
    const tab = createTabFromFile(hostFile);
    const initialValue = getTabInitialValue(tab);
    expect(initialValue.elements.length).toBeGreaterThan(0);
  });

  it('标签页标题优先取完整路径的文件名', () => {
    const tab = createTabFromFile(hostFile);
    expect(getTabTitle(tab)).toBe('project.toon');
    expect(getTabBaseName(tab)).toBe('project');
  });
});
