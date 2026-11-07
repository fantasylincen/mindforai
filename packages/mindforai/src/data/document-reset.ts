// DATA-28 关闭或清空当前文件时，把画板元素、选择、撤销历史、视口与会话缓存重置到初始欢迎态
import { clearSelectedElement, ListRender, PlaitBoard, Viewport } from '@plait/core';
import { clearDocumentSession } from './document-session';

export const resetBoardToInitialState = (board: PlaitBoard, listRender?: ListRender) => {
  clearSelectedElement(board);
  board.viewport = { zoom: 1 } as Viewport;
  if (Array.isArray(board.children) && board.children.length > 0) {
    board.deleteFragment(board.children);
  }
  board.children = [];
  if (listRender) {
    listRender.update([], {
      board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
  }
  board.history.undos = [];
  board.history.redos = [];
  clearDocumentSession();
};