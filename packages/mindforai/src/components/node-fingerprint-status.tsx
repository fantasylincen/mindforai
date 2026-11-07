// UI-43 左下角状态栏的节点数量与 MD5 指纹显示，仅在文档变化且非编辑状态下重算
import { useRef } from 'react';
import { getSelectedElements, PlaitBoard } from '@plait/core';
import { useBoard } from '@plait-board/react-board';
import { MindElement } from '@plait/mind';
import { useI18n } from '../i18n';
import {
  computeBoardFingerprint,
  computeNodeFingerprint,
  type DocumentFingerprint,
} from '../data/document-fingerprint';

interface FingerprintCache {
  children: unknown;
  selectionKey: string;
  isEditing: boolean;
  fingerprint: DocumentFingerprint;
}

const getSelectedMindElement = (board: PlaitBoard): MindElement | null => {
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length !== 1) {
    return null;
  }
  const element = selectedElements[0];
  return MindElement.isMindElement(board, element) ? element : null;
};

const getSelectionKey = (board: PlaitBoard) => {
  const selectedElement = getSelectedMindElement(board);
  return selectedElement ? selectedElement.id : '__board__';
};

const formatFingerprintMd5 = (md5: string) => {
  if (md5.length <= 8) {
    return md5;
  }
  return `${md5.slice(0, 4)}...${md5.slice(-4)}`;
};

const computeFingerprint = (board: PlaitBoard): DocumentFingerprint => {
  const selectedElement = getSelectedMindElement(board);
  const next = selectedElement
    ? computeNodeFingerprint(selectedElement)
    : computeBoardFingerprint(board);
  return next ? { nodeCount: next.nodeCount, md5: next.md5 } : { nodeCount: 0, md5: '' };
};

export const NodeFingerprintStatus = () => {
  const board = useBoard();
  const { t } = useI18n();
  const cacheRef = useRef<FingerprintCache | null>(null);

  const isEditing = PlaitBoard.hasBeenTextEditing(board);
  let cache = cacheRef.current;
  if (!cache) {
    cache = {
      children: board.children,
      selectionKey: getSelectionKey(board),
      isEditing,
      fingerprint: computeFingerprint(board),
    };
    cacheRef.current = cache;
  } else if (!isEditing && cache.isEditing) {
    cache = {
      children: board.children,
      selectionKey: getSelectionKey(board),
      isEditing: false,
      fingerprint: computeFingerprint(board),
    };
    cacheRef.current = cache;
  } else if (
    !isEditing &&
    (cache.children !== board.children || cache.selectionKey !== getSelectionKey(board))
  ) {
    cache = {
      children: board.children,
      selectionKey: getSelectionKey(board),
      isEditing: false,
      fingerprint: computeFingerprint(board),
    };
    cacheRef.current = cache;
  } else if (isEditing && !cache.isEditing) {
    cache = { ...cache, isEditing: true };
    cacheRef.current = cache;
  }

  const { fingerprint } = cache;

  return (
    <span className="document-status-bar__fingerprint" data-testid="node-fingerprint">
      <span className="document-status-bar__fingerprint-nodes">
        {t('statusBar.nodes')}: {fingerprint.nodeCount}
      </span>
      <span className="document-status-bar__fingerprint-separator">|</span>
      <span
        className="document-status-bar__fingerprint-md5"
        title={`${t('statusBar.md5')}: ${fingerprint.md5}`}
      >
        {t('statusBar.md5')}: {formatFingerprintMd5(fingerprint.md5)}
      </span>
    </span>
  );
};
