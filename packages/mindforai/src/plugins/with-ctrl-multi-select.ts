// PLUG-21 支持按住 Ctrl 或 Command 点击节点进行多选
import { PlaitBoard, PlaitPointerType } from '@plait/core';

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== 'function') {
    return false;
  }
  return !!element.closest('input, textarea, [contenteditable="true"]');
};

export const withCtrlMultiSelect = (board: PlaitBoard) => {
  const { pointerDown } = board;
  board.pointerDown = (event: PointerEvent) => {
    const isSelectionPointer = PlaitBoard.isPointer(board, PlaitPointerType.selection);
    const isCtrlPressed = (event.ctrlKey || event.metaKey) && !event.shiftKey;
    if (
      !isSelectionPointer ||
      !isCtrlPressed ||
      event.button !== 0 ||
      PlaitBoard.hasBeenTextEditing(board) ||
      isEditableTarget(event.target)
    ) {
      pointerDown(event);
      return;
    }
    const originalShiftKey = event.shiftKey;
    const originalCtrlKey = event.ctrlKey;
    const originalMetaKey = event.metaKey;
    try {
      Object.defineProperty(event, 'shiftKey', { configurable: true, value: true });
      Object.defineProperty(event, 'ctrlKey', { configurable: true, value: false });
      Object.defineProperty(event, 'metaKey', { configurable: true, value: false });
      pointerDown(event);
    } finally {
      try {
        Object.defineProperty(event, 'shiftKey', {
          configurable: true,
          value: originalShiftKey,
        });
        Object.defineProperty(event, 'ctrlKey', {
          configurable: true,
          value: originalCtrlKey,
        });
        Object.defineProperty(event, 'metaKey', {
          configurable: true,
          value: originalMetaKey,
        });
      } catch {}
    }
  };
  return board;
};
