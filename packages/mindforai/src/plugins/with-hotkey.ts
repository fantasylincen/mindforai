// 画板快捷键插件，统一处理保存、撤销重做与指针切换等键盘操作
import { BoardTransforms, getSelectedElements, PlaitBoard, PlaitPointerType } from '@plait/core';
import { isHotkey } from 'is-hotkey';
import { saveAsSvg } from '../utils/image';
import { collapseOrExpandAllDescendants } from '../components/toolbar/popup-toolbar/expand-collapse';
import { saveDocumentAsFormat, saveDocumentToCurrentFile } from '../data/document-save';
import {
  MindForAIBoard,
  MindForAIPointerType,
  MindForAIState,
  MindForAIToolState,
} from '../hooks/use-mindforai';
import { BoardCreationMode, setCreationMode } from '@plait/common';
import { editTopic, insertMindElement, MindElement, MindPointerType } from '@plait/mind';
import type { PlaitMindBoard } from '@plait/mind';
import { resetBoardToInitialState } from '../data/document-reset';

// 对当前选中的单个思维导图节点执行全部展开或全部折叠
const handleExpandCollapseAllDescendants = (board: PlaitBoard, isCollapsed: boolean): boolean => {
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length !== 1) {
    return false;
  }
  const element = selectedElements[0];
  if (!MindElement.isMindElement(board, element) || !element.children?.length) {
    return false;
  }
  collapseOrExpandAllDescendants(board, element, isCollapsed);
  return true;
};

interface MindForAIHotkeyEvent extends KeyboardEvent {
  mindForAIHistoryHandled?: boolean;
}

const hasHandledHistoryHotkey = (event: KeyboardEvent) => {
  return !!(event as MindForAIHotkeyEvent).mindForAIHistoryHandled;
};

const handleUndoRedoHotkey = (board: PlaitBoard, event: KeyboardEvent): boolean => {
  if (hasHandledHistoryHotkey(event)) {
    return true;
  }
  const isUndo = isHotkey(['mod+z'], { byKey: true })(event);
  const isRedo =
    isHotkey(['mod+shift+z'], { byKey: true })(event) ||
    isHotkey(['mod+y'], { byKey: true })(event);
  if (!isUndo && !isRedo) {
    return false;
  }
  (event as MindForAIHotkeyEvent).mindForAIHistoryHandled = true;
  if (isRedo) {
    board.redo();
  } else {
    board.undo();
  }
  event.preventDefault();
  return true;
};

const isModKey = (event: KeyboardEvent) => event.ctrlKey || event.metaKey;

const handleMindEditShortcuts = (board: PlaitBoard, event: KeyboardEvent): boolean => {
  if (PlaitBoard.hasBeenTextEditing(board)) {
    return false;
  }
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return false;
  }
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length !== 1) {
    return false;
  }
  const element = selectedElements[0];
  if (!MindElement.isMindElement(board, element)) {
    return false;
  }
  const isRoot = element.type === 'mind';
  if (event.key === 'F2' || event.code === 'Space') {
    event.preventDefault();
    editTopic(element);
    return true;
  }
  if (event.key === 'Enter' && event.shiftKey && !isRoot) {
    event.preventDefault();
    const path = PlaitBoard.findPath(board, element);
    insertMindElement(board as PlaitMindBoard, element, path);
    return true;
  }
  return false;
};

const handleGlobalFunctionShortcuts = (
  board: PlaitBoard,
  event: KeyboardEvent,
  updateAppState: (appState: Partial<MindForAIState>) => void
): boolean => {
  if (!isModKey(event)) {
    return false;
  }
  if (event.key === 'F5') {
    event.preventDefault();
    BoardTransforms.fitViewport(board);
    return true;
  }
  if (event.key === 'F3') {
    event.preventDefault();
    for (const element of board.children) {
      if (MindElement.isMindElement(board, element) && element.children?.length) {
        collapseOrExpandAllDescendants(board, element, true);
      }
    }
    BoardTransforms.fitViewport(board);
    return true;
  }
  if (event.key.toLowerCase() === 'n' && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    resetBoardToInitialState(board);
    updateAppState({
      filePath: null,
      fileHandle: null,
      isDirty: false,
      editingDocument: false,
      invalidDocument: null,
      linkState: null,
      openCleanConfirm: false,
    });
    return true;
  }
  return false;
};

export const buildMindForAIHotkeyPlugin = (
  updateAppState: (appState: Partial<MindForAIState>) => void
) => {
  const withMindForAIHotkey = (board: PlaitBoard) => {
    const { globalKeyDown, keyDown } = board;
    const updatePointer = (
      pointer: MindForAIPointerType,
      nextToolState: Partial<MindForAIToolState> = {}
    ) => {
      updateAppState({
        toolState: {
          ...(board as MindForAIBoard).appState.toolState,
          pointer,
          ...nextToolState,
        },
      });
    };
    board.globalKeyDown = (event: KeyboardEvent) => {
      const isTypingNormal =
        event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (!isTypingNormal && !PlaitBoard.hasBeenTextEditing(board)) {
        if (handleGlobalFunctionShortcuts(board, event, updateAppState)) {
          return;
        }
      }
      if (
        !isTypingNormal &&
        !PlaitBoard.hasBeenTextEditing(board) &&
        handleUndoRedoHotkey(board, event)
      ) {
        return;
      }
      if (
        !isTypingNormal &&
        (PlaitBoard.getMovingPointInBoard(board) || PlaitBoard.isMovingPointInBoard(board)) &&
        !PlaitBoard.hasBeenTextEditing(board)
      ) {
        if (isHotkey(['mod+shift+e'], { byKey: true })(event)) {
          saveAsSvg(board);
          event.preventDefault();
          return;
        }
        if (isHotkey(['mod+shift+s'], { byKey: true })(event)) {
          saveDocumentAsFormat(board, 'mindforai');
          event.preventDefault();
          return;
        }
        if (isHotkey(['mod+s'], { byKey: true })(event)) {
          saveDocumentToCurrentFile(board);
          event.preventDefault();
          return;
        }
        if (isHotkey(['mod+alt+e'], { byKey: true })(event)) {
          if (handleExpandCollapseAllDescendants(board, false)) {
            event.preventDefault();
            return;
          }
        }
        if (isHotkey(['mod+alt+c'], { byKey: true })(event)) {
          if (handleExpandCollapseAllDescendants(board, true)) {
            event.preventDefault();
            return;
          }
        }
        if (isHotkey(['mod+backspace'])(event) || isHotkey(['mod+delete'])(event)) {
          board.deleteFragment(board.children);
          event.preventDefault();
          return;
        }
        if (!event.altKey && !event.metaKey && !event.ctrlKey) {
          if (event.key === 'h') {
            BoardTransforms.updatePointerType(board, PlaitPointerType.hand);
            updatePointer(PlaitPointerType.hand);
            event.preventDefault();
            return;
          }
          if (event.key === 'v') {
            BoardTransforms.updatePointerType(board, PlaitPointerType.selection);
            updatePointer(PlaitPointerType.selection);
            event.preventDefault();
            return;
          }
          if (event.key === 'm') {
            setCreationMode(board, BoardCreationMode.dnd);
            BoardTransforms.updatePointerType(board, MindPointerType.mind);
            updatePointer(MindPointerType.mind);
            event.preventDefault();
            return;
          }
        }
      }
      globalKeyDown(event);
    };

    board.keyDown = (event: KeyboardEvent) => {
      const isTypingNormal =
        event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (!isTypingNormal && handleMindEditShortcuts(board, event)) {
        return;
      }
      if (
        !isTypingNormal &&
        !PlaitBoard.hasBeenTextEditing(board) &&
        handleUndoRedoHotkey(board, event)
      ) {
        return;
      }
      keyDown(event);
    };

    return board;
  };
  return withMindForAIHotkey;
};
