// DATA-36 供宿主系统菜单调用的画板命令：节点搜索、帮助对话框、清空画板、自动保存、透明导出与界面语言
import type { PlaitBoard } from '@plait/core';
import type { MindForAIBoard, MindForAIState } from '../hooks/use-mindforai';
import type { Language } from '../i18n/types';

const updateBoardAppState = (board: PlaitBoard, patch: Partial<MindForAIState>) => {
  (board as MindForAIBoard).setMindForAIAppState?.((currentAppState) => ({
    ...currentAppState,
    ...patch,
  }));
};

export const openBoardSearchPanel = (board: PlaitBoard) => {
  updateBoardAppState(board, { openSearch: true });
};

export const openBoardHelpDialog = (board: PlaitBoard) => {
  updateBoardAppState(board, { openHelp: true });
};

export const clearBoardElements = (board: PlaitBoard) => {
  board.deleteFragment(board.children);
};

export const setBoardAutoSave = (board: PlaitBoard, autoSaveEnabled: boolean) => {
  updateBoardAppState(board, { autoSave: autoSaveEnabled });
};

export const setBoardExportTransparent = (board: PlaitBoard, exportTransparent: boolean) => {
  updateBoardAppState(board, { exportTransparent });
};

export const setBoardInterfaceLanguage = (board: PlaitBoard, language: Language) => {
  updateBoardAppState(board, { language });
};
