// UI-39 拦截复制与粘贴事件，把选中节点以 mindforai 文本写入剪贴板，并支持等效的“粘贴为子节点”
import { useEffect } from 'react';
import { getSelectedElements, hasInputOrTextareaTarget, PlaitBoard, PlaitElement } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import { serializeNodesAsMindForAIText, pasteNodesAsChildren } from '../data/node-clipboard';
import { parseMindForAIText } from '../data/mindforai-text';
import { mindForAIToDocumentData } from '../data/toon-document';

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== 'function') {
    return false;
  }
  return !!element.closest('input, textarea, [contenteditable="true"]');
};

const getPasteParentElement = (board: PlaitBoard): PlaitElement | null => {
  const selectedElements = getSelectedElements(board);
  return selectedElements.length ? selectedElements[0] : null;
};

export const DocumentNodeClipboard = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { showToast } = useMindForAI();
  const { t } = useI18n();

  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      if (
        !PlaitBoard.isFocus(board) ||
        PlaitBoard.hasBeenTextEditing(board) ||
        hasInputOrTextareaTarget(event.target) ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      const selectedElements = getSelectedElements(board);
      if (!selectedElements.length) {
        return;
      }
      const text = serializeNodesAsMindForAIText(selectedElements);
      if (!event.clipboardData) {
        return;
      }
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast({ message: t('toast.copySuccess'), type: 'success' });
    };

    const handlePaste = async (event: ClipboardEvent) => {
      if (
        !PlaitBoard.isFocus(board) ||
        PlaitBoard.hasBeenTextEditing(board) ||
        hasInputOrTextareaTarget(event.target) ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      const parentElement = getPasteParentElement(board);
      if (!parentElement) {
        return;
      }
      const clipboardText =
        event.clipboardData?.getData('text/plain') || '';
      const textData = clipboardText ? parseMindForAIText(clipboardText) : null;
      if (!textData) {
        return;
      }
      let parentPath: number[] | null = null;
      try {
        parentPath = PlaitBoard.findPath(board, parentElement);
      } catch {
        parentPath = null;
      }
      if (!parentPath) {
        return;
      }
      const elements = mindForAIToDocumentData(textData).elements;
      const pasted = pasteNodesAsChildren(board, parentPath, elements);
      if (!pasted) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      listRender.update(board.children, {
        board,
        parent: board,
        parentG: PlaitBoard.getElementHost(board),
      });
      showToast({ message: t('toast.pasteSuccess'), type: 'success' });
    };

    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('paste', handlePaste, true);
    return () => {
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('paste', handlePaste, true);
    };
  }, [board, listRender, showToast, t]);

  return null;
};
