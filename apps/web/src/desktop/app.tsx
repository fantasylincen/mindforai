// DESK-05 桌面版主应用：多标签管理、宿主文档打开与保存、顶部系统菜单命令分发与菜单状态同步
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MindForAI,
  clearBoardElements,
  openBoardHelpDialog,
  openBoardSearchPanel,
  saveAsPng,
  saveAsSvg,
  saveDocumentAsFormat,
  saveDocumentToCurrentFile,
  setBoardExportTransparent,
  setBoardAutoSave,
  setBoardInterfaceLanguage,
  type InitialDocumentValue,
  type Language,
} from '@mindforai/mindforai';
import type { PlaitBoard } from '@plait/core';
import {
  confirmDesktopCloseTab,
  openDesktopNewWindow,
  pickDesktopDocuments,
  readDesktopDocuments,
  setDesktopDirtyCollector,
  setDesktopMenuCommandHandler,
  setDesktopOpenFilesListener,
  setDesktopSavedListener,
  startDesktopBridge,
  subscribeDesktopOpenPaths,
  syncDesktopMenuState,
  type DesktopMenuCommand,
  type DesktopMenuState,
} from './bridge';
import { TabBar } from './tab-bar';
import { setDesktopDropHandler } from './file-drop';
import { saveTabTextToPath } from './tab-save';
import {
  createBlankTab,
  createTabFromFile,
  getTabFormat,
  getTabInitialValue,
  getTabTitle,
  serializeTabBoard,
  type DesktopTab,
} from './tab-model';
import './styles.scss';

const TEXT_SYNC_DEBOUNCE_MS = 400;
type SaveableDocumentFormat = 'mindforai' | 'drawnixlite' | 'markdown';
const DEFAULT_LANGUAGE: Language = 'zh';
const EDITING_MENU_COMMANDS = ['undo', 'redo', 'cut', 'copy', 'paste', 'select-all'];

const normalizeLanguage = (value: unknown): Language | null => {
  const languages: Language[] = ['zh', 'en', 'ru', 'ar', 'vi'];
  return languages.includes(value as Language) ? (value as Language) : null;
};

export const DesktopApp = () => {
  const [tabs, setTabs] = useState<DesktopTab[]>(() => [createBlankTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? '');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const tabsRef = useRef<DesktopTab[]>(tabs);
  const activeTabIdRef = useRef('');
  const boardsRef = useRef(new Map<string, PlaitBoard>());
  const syncTimerRef = useRef<number | null>(null);
  const menuStateRef = useRef<DesktopMenuState>({
    autoSave: false,
    exportTransparent: false,
    language: DEFAULT_LANGUAGE,
  });

  tabsRef.current = tabs;
  activeTabIdRef.current = activeTabId || tabs[0]?.id || '';

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (!activeTabId && tabs.length) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

  const applyTabs = useCallback((updater: (currentTabs: DesktopTab[]) => DesktopTab[]) => {
    setTabs((currentTabs) => {
      const nextTabs = updater(currentTabs);
      tabsRef.current = nextTabs;
      return nextTabs;
    });
  }, []);

  const updateTab = useCallback(
    (tabId: string, updater: (tab: DesktopTab) => DesktopTab) => {
      applyTabs((currentTabs) => currentTabs.map((tab) => (tab.id === tabId ? updater(tab) : tab)));
    },
    [applyTabs]
  );

  const pushMenuState = useCallback((patch: Partial<DesktopMenuState>) => {
    menuStateRef.current = { ...menuStateRef.current, ...patch };
    syncDesktopMenuState(menuStateRef.current);
  }, []);

  const flushActiveTabText = useCallback(() => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    const tabId = activeTabIdRef.current;
    const tab = tabsRef.current.find((item) => item.id === tabId);
    const board = boardsRef.current.get(tabId);
    if (!tab || !board) {
      return;
    }
    const text = serializeTabBoard(tab, board);
    if (text && text !== tab.text) {
      updateTab(tabId, (currentTab) => ({ ...currentTab, text }));
    }
  }, [updateTab]);

  const scheduleTextFlush = useCallback(() => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      flushActiveTabText();
    }, TEXT_SYNC_DEBOUNCE_MS);
  }, [flushActiveTabText]);

  const openFilesAsTabs = useCallback(
    (files: { name: string; path: string; text: string }[]) => {
      if (!files.length) {
        return;
      }
      flushActiveTabText();
      const currentTabs = tabsRef.current;
      const nextTabs: DesktopTab[] = [];
      let firstOpenedTabId = '';
      for (const file of files) {
        const existingTab = currentTabs.find(
          (tab) => tab.path && file.path && tab.path === file.path
        );
        if (existingTab) {
          firstOpenedTabId = firstOpenedTabId || existingTab.id;
          continue;
        }
        const openedTab = createTabFromFile(file);
        nextTabs.push(openedTab);
        firstOpenedTabId = firstOpenedTabId || openedTab.id;
      }
      if (!nextTabs.length) {
        if (firstOpenedTabId) {
          setActiveTabId(firstOpenedTabId);
        }
        return;
      }
      const shouldReplaceBlankTab =
        currentTabs.length === 1 && !currentTabs[0].path && !currentTabs[0].text.trim();
      if (shouldReplaceBlankTab) {
        boardsRef.current.delete(currentTabs[0].id);
        applyTabs(() => nextTabs);
      } else {
        applyTabs((latestTabs) => [...latestTabs, ...nextTabs]);
      }
      setActiveTabId(firstOpenedTabId);
    },
    [applyTabs, flushActiveTabText]
  );

  const addBlankTab = useCallback(() => {
    flushActiveTabText();
    const tab = createBlankTab();
    applyTabs((currentTabs) => [...currentTabs, tab]);
    setActiveTabId(tab.id);
  }, [applyTabs, flushActiveTabText]);

  const selectTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabIdRef.current) {
        return;
      }
      flushActiveTabText();
      boardsRef.current.delete(tabId);
      setActiveTabId(tabId);
    },
    [flushActiveTabText]
  );

  const selectRelativeTab = useCallback(
    (offset: number) => {
      const currentTabs = tabsRef.current;
      if (currentTabs.length < 2) {
        return;
      }
      const currentIndex = currentTabs.findIndex((tab) => tab.id === activeTabIdRef.current);
      const nextIndex = (currentIndex + offset + currentTabs.length) % currentTabs.length;
      selectTab(currentTabs[nextIndex].id);
    },
    [selectTab]
  );

  const saveTab = useCallback(
    async (tabId: string, saveAsNewFile: boolean, format?: SaveableDocumentFormat) => {
      const tab = tabsRef.current.find((item) => item.id === tabId);
      if (!tab) {
        return false;
      }
      const board = boardsRef.current.get(tabId) || null;
      if (!board) {
        return saveTabTextToPath(tab);
      }
      const succeeded = format
        ? await saveDocumentAsFormat(board, format)
        : saveAsNewFile
          ? await saveDocumentAsFormat(board, getTabFormat(tab))
          : await saveDocumentToCurrentFile(board);
      if (!succeeded) {
        return false;
      }
      updateTab(tabId, (currentTab) => ({ ...currentTab, dirty: false }));
      return true;
    },
    [updateTab]
  );

  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = tabsRef.current.find((item) => item.id === tabId);
      if (!tab) {
        return;
      }
      const isActiveTab = tabId === activeTabIdRef.current;
      if (isActiveTab) {
        flushActiveTabText();
      }
      const latestTab = tabsRef.current.find((item) => item.id === tabId) || tab;
      if (latestTab.dirty) {
        const decision = await confirmDesktopCloseTab(latestTab.path || latestTab.name);
        if (decision === 'cancel') {
          return;
        }
        if (decision === 'save' && !(await saveTab(tabId, !latestTab.path))) {
          return;
        }
      }
      boardsRef.current.delete(tabId);
      const remainingTabs = tabsRef.current.filter((item) => item.id !== tabId);
      if (!remainingTabs.length) {
        const blankTab = createBlankTab();
        applyTabs(() => [blankTab]);
        setActiveTabId(blankTab.id);
        return;
      }
      applyTabs(() => remainingTabs);
      if (isActiveTab) {
        setActiveTabId(remainingTabs[remainingTabs.length - 1].id);
      }
    },
    [applyTabs, flushActiveTabText, saveTab]
  );

  const openFilesFromDialog = useCallback(() => {
    void pickDesktopDocuments().then((files) => openFilesAsTabs(files));
  }, [openFilesAsTabs]);

  const runBoardEditingCommand = useCallback((command: string) => {
    const board = boardsRef.current.get(activeTabIdRef.current);
    if (!board) {
      return;
    }
    if (command === 'undo') {
      board.undo();
      return;
    }
    if (command === 'redo') {
      board.redo();
      return;
    }
    const execCommandNames: Record<string, string> = {
      cut: 'cut',
      copy: 'copy',
      paste: 'paste',
      'select-all': 'selectAll',
    };
    const execCommandName = execCommandNames[command];
    if (execCommandName) {
      document.execCommand(execCommandName);
    }
  }, []);

  const runBoardPanelCommand = useCallback((command: string) => {
    const board = boardsRef.current.get(activeTabIdRef.current);
    if (!board) {
      return;
    }
    if (command === 'search-nodes') {
      openBoardSearchPanel(board);
      return;
    }
    if (command === 'help') {
      openBoardHelpDialog(board);
      return;
    }
    if (command === 'clean-board') {
      clearBoardElements(board);
      return;
    }
    if (command === 'export-svg') {
      void saveAsSvg(board);
      return;
    }
    if (command === 'export-png') {
      void saveAsPng(board);
    }
  }, []);

  const applyAutoSave = useCallback(
    (enabled: boolean) => {
      setAutoSaveEnabled(enabled);
      boardsRef.current.forEach((board) => setBoardAutoSave(board, enabled));
      pushMenuState({ autoSave: enabled });
    },
    [pushMenuState]
  );

  const applyExportTransparent = useCallback(
    (enabled: boolean) => {
      setExportTransparent(enabled);
      boardsRef.current.forEach((board) => setBoardExportTransparent(board, enabled));
      pushMenuState({ exportTransparent: enabled });
    },
    [pushMenuState]
  );

  const applyLanguage = useCallback(
    (language: Language) => {
      setInterfaceLanguage(language);
      boardsRef.current.forEach((board) => setBoardInterfaceLanguage(board, language));
      pushMenuState({ language });
    },
    [pushMenuState]
  );

  const runSaveAsFormat = useCallback(
    (format: unknown) => {
      const formats: SaveableDocumentFormat[] = ['mindforai', 'drawnixlite', 'markdown'];
      if (!formats.includes(format as SaveableDocumentFormat)) {
        return;
      }
      void saveTab(activeTabIdRef.current, true, format as SaveableDocumentFormat);
    },
    [saveTab]
  );

  const handleMenuCommand = useCallback(
    (menuCommand: DesktopMenuCommand) => {
      const { command, value } = menuCommand;
      if (EDITING_MENU_COMMANDS.includes(command)) {
        runBoardEditingCommand(command);
        return;
      }
      if (command === 'new-tab') {
        addBlankTab();
        return;
      }
      if (command === 'open') {
        openFilesFromDialog();
        return;
      }
      if (command === 'save') {
        void saveTab(activeTabIdRef.current, false);
        return;
      }
      if (command === 'save-as') {
        void saveTab(activeTabIdRef.current, true);
        return;
      }
      if (command === 'save-as-format') {
        runSaveAsFormat(value);
        return;
      }
      if (command === 'close-tab') {
        void closeTab(activeTabIdRef.current);
        return;
      }
      if (command === 'next-tab') {
        selectRelativeTab(1);
        return;
      }
      if (command === 'previous-tab') {
        selectRelativeTab(-1);
        return;
      }
      if (command === 'set-auto-save') {
        applyAutoSave(value === true);
        return;
      }
      if (command === 'set-export-transparent') {
        applyExportTransparent(value === true);
        return;
      }
      if (command === 'set-language') {
        const language = normalizeLanguage(value);
        if (language) {
          applyLanguage(language);
        }
        return;
      }
      runBoardPanelCommand(command);
    },
    [
      addBlankTab,
      applyAutoSave,
      applyExportTransparent,
      applyLanguage,
      closeTab,
      openFilesFromDialog,
      runBoardEditingCommand,
      runBoardPanelCommand,
      runSaveAsFormat,
      saveTab,
      selectRelativeTab,
    ]
  );

  useEffect(() => {
    setDesktopMenuCommandHandler(handleMenuCommand);
    return () => setDesktopMenuCommandHandler(null);
  }, [handleMenuCommand]);

  useEffect(() => {
    setDesktopDirtyCollector(() => {
      flushActiveTabText();
      return tabsRef.current
        .filter((tab) => tab.dirty)
        .map((tab) => ({ name: tab.name, path: tab.path, text: tab.text }));
    });
    return () => setDesktopDirtyCollector(null);
  }, [flushActiveTabText]);

  useEffect(() => {
    setDesktopOpenFilesListener((files) => openFilesAsTabs(files));
    return () => setDesktopOpenFilesListener(null);
  }, [openFilesAsTabs]);

  useEffect(() => {
    setDesktopSavedListener((filePath) => {
      updateTab(activeTabIdRef.current, (tab) => ({
        ...tab,
        path: filePath,
        name: filePath.split(/[\\/]/).pop() || tab.name,
        dirty: false,
      }));
    });
    return () => setDesktopSavedListener(null);
  }, [updateTab]);

  useEffect(() => startDesktopBridge(), []);

  useEffect(() => {
    const stopOpenPaths = subscribeDesktopOpenPaths((paths) => {
      void readDesktopDocuments(paths).then((files) => openFilesAsTabs(files));
    });
    return () => stopOpenPaths();
  }, [openFilesAsTabs]);

  useEffect(() => {
    setDesktopDropHandler((paths) => {
      void readDesktopDocuments(paths).then((files) => openFilesAsTabs(files));
    });
    return () => setDesktopDropHandler(null);
  }, [openFilesAsTabs]);

  useEffect(() => {
    if (!activeTab) {
      return;
    }
    const title = getTabTitle(activeTab);
    document.title = activeTab.dirty ? `${title} * - MindForAI` : `${title} - MindForAI`;
  }, [activeTab]);

  const initialValueRef = useRef<{ tabId: string; value: InitialDocumentValue | null } | null>(
    null
  );
  if (!initialValueRef.current || initialValueRef.current.tabId !== activeTab?.id) {
    initialValueRef.current = {
      tabId: activeTab?.id || '',
      value: activeTab ? getTabInitialValue(activeTab) : null,
    };
  }
  const initialValue = initialValueRef.current.value;

  if (!activeTab || !initialValue) {
    return null;
  }

  return (
    <div className="desktop-app">
      <TabBar
        tabs={tabs}
        activeTabId={activeTab.id}
        onSelectTab={selectTab}
        onCloseTab={(tabId) => void closeTab(tabId)}
        onNewTab={addBlankTab}
      />
      <div className="desktop-app__board">
        <MindForAI
          key={activeTab.id}
          value={initialValue.elements}
          viewport={initialValue.viewport}
          theme={initialValue.theme ? { themeColorMode: initialValue.theme } : undefined}
          initialLanguage={initialValue.language || interfaceLanguage}
          initialFilePath={activeTab.path || null}
          initialFileHandle={
            activeTab.path ? { kind: 'file', name: activeTab.path, uri: activeTab.path } : null
          }
          initialPreference={{ exportTransparent }}
          systemMenu
          initialAutoSave={autoSaveEnabled}
          tutorial={initialValue.elements.length === 0}
          enableSessionRestore={false}
          afterInit={(board) => {
            boardsRef.current.set(activeTab.id, board);
            setBoardAutoSave(board, autoSaveEnabled);
            setBoardExportTransparent(board, exportTransparent);
          }}
          onValueChange={() => {
            updateTab(activeTab.id, (tab) => (tab.dirty ? tab : { ...tab, dirty: true }));
            scheduleTextFlush();
          }}
          onDocumentSaved={(filePath) => {
            flushActiveTabText();
            updateTab(activeTab.id, (tab) => ({
              ...tab,
              dirty: false,
              path: filePath || tab.path,
              name: filePath ? filePath.split(/[\\/]/).pop() || tab.name : tab.name,
            }));
          }}
          onSystemMenuStateChange={(state) => {
            const language = normalizeLanguage(state.language);
            setAutoSaveEnabled(state.autoSave);
            setExportTransparent(state.exportTransparent);
            if (language) {
              setInterfaceLanguage(language);
            }
            pushMenuState({
              autoSave: state.autoSave,
              exportTransparent: state.exportTransparent,
              ...(language ? { language } : {}),
            });
          }}
          onDocumentFileChange={({ filePath }) => {
            if (!filePath) {
              return;
            }
            updateTab(activeTab.id, (tab) =>
              tab.path === filePath ? tab : { ...tab, path: filePath }
            );
          }}
          onOpenNewWindow={openDesktopNewWindow}
        />
      </div>
    </div>
  );
};

export default DesktopApp;
