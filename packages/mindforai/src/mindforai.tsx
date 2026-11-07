import { Board, BoardChangeData, Wrapper } from '@plait-board/react-board';
import type { MindForAIFileHandle } from './data/json';
import {
  PlaitBoard,
  PlaitBoardOptions,
  PlaitElement,
  PlaitPlugin,
  PlaitPointerType,
  PlaitTheme,
  BoardTransforms,
  Selection,
  ThemeColorMode,
  Viewport,
} from '@plait/core';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BoardCreationMode, setCreationMode, withGroup } from '@plait/common';
import { withDraw } from '@plait/draw';
import { MindThemeColors, withMind } from '@plait/mind';
import MobileDetect from 'mobile-detect';
import { withMindExtend } from './plugins/with-mind-extend';
import { withCtrlMultiSelect } from './plugins/with-ctrl-multi-select';
import { withCommonPlugin } from './plugins/with-common';
import { CreationToolbar } from './components/toolbar/creation-toolbar';
import { ZoomToolbar } from './components/toolbar/zoom-toolbar';
import { PopupToolbar } from './components/toolbar/popup-toolbar/popup-toolbar';
import { AppToolbar } from './components/toolbar/app-toolbar/app-toolbar';
import classNames from 'classnames';
import './styles/index.scss';
import { buildMindForAIHotkeyPlugin } from './plugins/with-hotkey';
import { buildToolStateSyncPlugin } from './plugins/with-tool-state-sync';
import { ThemeToolbar } from './components/toolbar/theme-toolbar';
import {
  MindForAIBoard,
  MindForAIContext,
  MindForAIToolState,
  mergeToolState,
  type MindForAIState,
} from './hooks/use-mindforai';
import { CleanConfirm } from './components/clean-confirm/clean-confirm';
import { buildTextLinkPlugin } from './plugins/with-text-link';
import { LinkPopup } from './components/popup/link-popup/link-popup';
import { I18nProvider, setBoardLanguage, useI18n } from './i18n';
import type { Language } from './i18n/types';
import { Tutorial } from './components/tutorial';
import { Toast, useToast } from './components/toast/toast';
import { NodeContextMenu } from './components/node-context-menu';
import { DocumentStatusBar } from './components/document-status-bar';
import { DocumentDropLayer } from './components/document-drop-layer';
import { Welcome } from './components/welcome';
import { DocumentNodeClipboard } from './components/document-node-clipboard';
import { TextEditorDialog } from './components/text-editor/text-editor-dialog';
import { DocumentSessionSync } from './components/document-session-sync';
import { NodeMoreHint } from './components/node-more/node-more-hint';
import { SearchPanel } from './components/search/search-panel';
import { HelpDialog } from './components/help/help-dialog';

export type MindForAIProps = {
  value: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
  initialToolState?: Partial<MindForAIToolState>;
  initialFilePath?: string | null;
  initialFileHandle?: MindForAIFileHandle;
  initialPreference?: {
    exportTransparent?: boolean;
  };
  initialLanguage?: Language;
  onChange?: (value: BoardChangeData) => void;
  onSelectionChange?: (selection: Selection | null) => void;
  onValueChange?: (value: PlaitElement[]) => void;
  onViewportChange?: (value: Viewport) => void;
  onThemeChange?: (value: ThemeColorMode) => void;
  onToolStateChange?: (toolState: MindForAIToolState) => void;
  onPreferenceChange?: (preference: { exportTransparent: boolean }) => void;
  onLanguageChange?: (language: Language) => void;
  onDocumentFileChange?: (file: {
    filePath: string | null;
    fileHandle: MindForAIFileHandle;
  }) => void;
  /**
   * Opens a brand new blank window (browser tab) for editing another document.
   * When omitted, a new tab pointing at the current location is opened.
   */
  onOpenNewWindow?: () => void;
  afterInit?: (board: PlaitBoard) => void;
  tutorial?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onSelect'>;

export type { MindForAIToolState } from './hooks/use-mindforai';

const DocumentLanguageSync: React.FC<{ language: Language | null | undefined }> = ({
  language,
}) => {
  const { language: currentLanguage, setLanguage } = useI18n();
  useEffect(() => {
    if (language && language !== currentLanguage) {
      setLanguage(language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  return null;
};

const applyToolStateToBoard = (board: PlaitBoard, toolState: MindForAIToolState) => {
  BoardTransforms.updatePointerType(board, toolState.pointer);
  if (
    toolState.pointer !== PlaitPointerType.hand &&
    toolState.pointer !== PlaitPointerType.selection
  ) {
    setCreationMode(board, BoardCreationMode.drawing);
  }
};

export const MindForAI: React.FC<MindForAIProps> = ({
  value,
  viewport,
  theme,
  initialToolState,
  initialFilePath,
  initialFileHandle,
  initialPreference,
  initialLanguage,
  onChange,
  onSelectionChange,
  onViewportChange,
  onThemeChange,
  onValueChange,
  onToolStateChange,
  onPreferenceChange,
  onLanguageChange,
  onDocumentFileChange,
  onOpenNewWindow,
  afterInit,
  tutorial = false,
}) => {
  const options: PlaitBoardOptions = {
    readonly: false,
    hideScrollbar: true,
    disabledScrollOnNonFocus: false,
    themeColors: MindThemeColors,
  };

  const [appState, setAppState] = useState<MindForAIState>(() => {
    const md = new MobileDetect(window.navigator.userAgent);
    return {
      toolState: mergeToolState(initialToolState),
      isMobile: md.mobile() !== null,
      fileHandle: initialFileHandle ?? null,
      filePath: initialFilePath ?? null,
      isDirty: false,
      openCleanConfirm: false,
      invalidDocument: null,
      exportTransparent: initialPreference?.exportTransparent ?? false,
      autoSave: false,
      editingDocument: false,
      openSearch: false,
      openHelp: false,
    };
  });

  const [board, setBoard] = useState<MindForAIBoard | null>(null);
  const onDocumentFileChangeRef = useRef(onDocumentFileChange);
  onDocumentFileChangeRef.current = onDocumentFileChange;

  useEffect(() => {
    onDocumentFileChangeRef.current?.({
      filePath: appState.filePath,
      fileHandle: appState.fileHandle,
    });
  }, [appState.filePath, appState.fileHandle]);

  const [themeColorMode, setThemeColorMode] = useState<ThemeColorMode>(
    theme?.themeColorMode || ThemeColorMode.dark
  );
  const { toast, showToast } = useToast();
  const lastKnownLanguageRef = useRef<Language>(initialLanguage ?? 'zh');

  // 画板主题始终以暗夜为默认值，避免首次进入时出现白色画布
  const resolvedTheme = useMemo<PlaitTheme>(() => ({ themeColorMode }), [themeColorMode]);
  const themeColorModeRef = useRef<ThemeColorMode>(themeColorMode);
  themeColorModeRef.current = themeColorMode;

  if (board) {
    board.appState = appState;
    board.showToast = showToast;
    board.setMindForAIAppState = setAppState;
  }

  useEffect(() => {
    if (!board) {
      return;
    }
    setBoardLanguage(board, lastKnownLanguageRef.current);
  }, [board]);

  const hasMountedToolStateRef = useRef(false);
  const onToolStateChangeRef = useRef(onToolStateChange);
  onToolStateChangeRef.current = onToolStateChange;

  useEffect(() => {
    if (!hasMountedToolStateRef.current) {
      hasMountedToolStateRef.current = true;
      return;
    }
    onToolStateChangeRef.current?.(appState.toolState);
  }, [appState.toolState]);

  const hasMountedPreferenceRef = useRef(false);
  const onPreferenceChangeRef = useRef(onPreferenceChange);
  onPreferenceChangeRef.current = onPreferenceChange;

  useEffect(() => {
    if (!hasMountedPreferenceRef.current) {
      hasMountedPreferenceRef.current = true;
      return;
    }
    onPreferenceChangeRef.current?.({
      exportTransparent: appState.exportTransparent,
    });
  }, [appState.exportTransparent]);

  useEffect(() => {
    if (theme?.themeColorMode) {
      setThemeColorMode(theme.themeColorMode);
    }
  }, [theme?.themeColorMode]);

  const updateAppState = (newAppState: Partial<MindForAIState>) => {
    setAppState((currentAppState) => ({
      ...currentAppState,
      ...newAppState,
    }));
  };

  const syncBoardPointerToToolState = (pointer: MindForAIToolState['pointer']) => {
    setAppState((currentAppState) => {
      if (currentAppState.toolState.pointer === pointer) {
        return currentAppState;
      }
      return {
        ...currentAppState,
        toolState: {
          ...currentAppState.toolState,
          pointer,
        },
      };
    });
  };

  const plugins: PlaitPlugin[] = [
    withDraw,
    withGroup,
    withMind,
    withMindExtend,
    withCtrlMultiSelect,
    withCommonPlugin,
    buildMindForAIHotkeyPlugin(updateAppState),
    buildTextLinkPlugin(updateAppState),
    buildToolStateSyncPlugin(syncBoardPointerToToolState),
  ];

  const containerRef = useRef<HTMLDivElement>(null);

  const openNewWindow = useCallback(() => {
    if (onOpenNewWindow) {
      onOpenNewWindow();
      return;
    }
    window.open(window.location.href, '_blank');
  }, [onOpenNewWindow]);

  // 网页标题跟随当前文件名
  const initialDocumentTitleRef = useRef(
    typeof document === 'undefined' ? 'MindForAI' : document.title
  );
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.title = appState.filePath
      ? `${appState.filePath} - MindForAI`
      : initialDocumentTitleRef.current;
  }, [appState.filePath]);

  return (
    <I18nProvider
      initialLanguage={initialLanguage}
      onLanguageChange={(language) => {
        lastKnownLanguageRef.current = language;
        if (board) {
          setBoardLanguage(board, language);
        }
        onLanguageChange?.(language);
      }}
    >
      <MindForAIContext.Provider value={{ appState, setAppState, showToast, openNewWindow }}>
        <DocumentLanguageSync language={appState.language} />
        <div
          className={classNames('mindforai', {
            'mindforai--mobile': appState.isMobile,
            [`theme--${themeColorMode}`]: themeColorMode,
          })}
          ref={containerRef}
        >
          <Wrapper
            value={value}
            viewport={viewport}
            theme={resolvedTheme}
            options={options}
            plugins={plugins}
            onChange={(data: BoardChangeData) => {
              // 画板主题可能被外部（如打开带主题的文件）直接改写，这里同步回本地状态
              if (
                data.theme?.themeColorMode &&
                data.theme.themeColorMode !== themeColorModeRef.current
              ) {
                themeColorModeRef.current = data.theme.themeColorMode;
                setThemeColorMode(data.theme.themeColorMode);
              }
              onChange?.(data);
            }}
            onSelectionChange={onSelectionChange}
            onViewportChange={onViewportChange}
            onThemeChange={(value) => {
              setThemeColorMode(value);
              onThemeChange?.(value);
            }}
            onValueChange={(nextValue) => {
              setAppState((currentAppState) =>
                currentAppState.isDirty ? currentAppState : { ...currentAppState, isDirty: true }
              );
              onValueChange?.(nextValue);
            }}
          >
            <Board
              afterInit={(board) => {
                const mindForAIBoard = board as MindForAIBoard;
                applyToolStateToBoard(mindForAIBoard, appState.toolState);
                setBoard(mindForAIBoard);
                afterInit?.(board);
              }}
            >
              {tutorial && board && <Tutorial>{board && <Welcome />}</Tutorial>}
              {board && <DocumentSessionSync />}
            </Board>
            {!tutorial && board && <Welcome />}
            <AppToolbar></AppToolbar>
            <CreationToolbar></CreationToolbar>
            <ZoomToolbar></ZoomToolbar>
            <ThemeToolbar></ThemeToolbar>
            <PopupToolbar></PopupToolbar>
            <LinkPopup></LinkPopup>
            <NodeContextMenu container={containerRef.current}></NodeContextMenu>
            <NodeMoreHint />
            <SearchPanel />
            <DocumentNodeClipboard></DocumentNodeClipboard>
            <DocumentDropLayer></DocumentDropLayer>
            <TextEditorDialog container={containerRef.current}></TextEditorDialog>
            <HelpDialog container={containerRef.current}></HelpDialog>
            <DocumentStatusBar></DocumentStatusBar>
            <CleanConfirm container={containerRef.current}></CleanConfirm>
            <Toast toast={toast} container={containerRef.current}></Toast>
          </Wrapper>
        </div>
      </MindForAIContext.Provider>
    </I18nProvider>
  );
};
