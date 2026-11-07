import type { PlaitBoard } from '@plait/core';
import type { MindForAIBoard, MindForAIPointerType } from '../hooks/use-mindforai';

export const syncBoardPointerToToolState = (
  board: PlaitBoard,
  syncToolStatePointer: (pointer: MindForAIPointerType) => void
) => {
  const toolState = (board as MindForAIBoard).appState?.toolState;

  if (!toolState || toolState.pointer === board.pointer) {
    return;
  }

  syncToolStatePointer(board.pointer as MindForAIPointerType);
};

export const buildToolStateSyncPlugin = (
  syncToolStatePointer: (pointer: MindForAIPointerType) => void
) => {
  const withToolStateSync = (board: PlaitBoard) => {
    const { pointerUp, globalPointerUp } = board;

    board.pointerUp = (event: PointerEvent) => {
      pointerUp(event);
      syncBoardPointerToToolState(board, syncToolStatePointer);
    };

    board.globalPointerUp = (event: PointerEvent) => {
      globalPointerUp(event);
      syncBoardPointerToToolState(board, syncToolStatePointer);
    };

    return board;
  };

  return withToolStateSync;
};
