// UI-41 同步当前文档到本地会话，刷新页面后可恢复正在编辑的文件
import { useEffect, useRef } from 'react';
import { PlaitBoard, Viewport } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { useMindForAI } from '../hooks/use-mindforai';
import { serializeAsMindForAI, mindForAIToDocumentData } from '../data/toon-document';
import { parseMindForAIText } from '../data/mindforai-text';
import {
  clearDocumentSession,
  isSessionRestorable,
  readDocumentSession,
  writeDocumentSession,
} from '../data/document-session';
import {
  applyDocumentManifestLanguage,
  applyDocumentManifestTheme,
  applyDocumentManifestViewport,
  collectDocumentManifestBase64,
} from '../data/document-manifest';
import { getMergeManifest, resolveElementsWithManifest } from '../data/document-open';

const SESSION_WRITE_DELAY_MS = 800;

export const DocumentSessionSync = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { appState, setAppState } = useMindForAI();
  const hasRestoredRef = useRef(false);
  const lastWrittenChildrenRef = useRef<unknown>(null);

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;
    const session = readDocumentSession();
    if (!isSessionRestorable(session) || !session) {
      return;
    }
    if (Array.isArray(board.children) && board.children.length > 0) {
      return;
    }
    const textData = parseMindForAIText(session.documentText);
    if (!textData) {
      return;
    }
    const data = mindForAIToDocumentData(textData);
    const manifest = getMergeManifest(data, false);
    const restoredElements = resolveElementsWithManifest(data.elements, manifest);
    board.children = restoredElements;
    board.viewport = data.viewport || ({ zoom: 1 } as Viewport);
    listRender.update(board.children, {
      board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    if (manifest) {
      applyDocumentManifestViewport(board, manifest);
      applyDocumentManifestTheme(board, manifest);
    }
    const restoredLanguage = manifest ? applyDocumentManifestLanguage(board, manifest) : null;
    setAppState((currentAppState) => ({
      ...currentAppState,
      filePath: session.fileIdentity?.filePath || currentAppState.filePath,
      isDirty: session.isDirty,
      editingDocument: false,
      ...(restoredLanguage ? { language: restoredLanguage } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  useEffect(() => {
    if (!appState.filePath && !(board.children && board.children.length)) {
      return;
    }
    const timer = window.setInterval(() => {
      if (PlaitBoard.hasBeenTextEditing(board)) {
        return;
      }
      const currentChildren = board.children;
      if (lastWrittenChildrenRef.current === currentChildren) {
        return;
      }
      if (!Array.isArray(currentChildren) || currentChildren.length === 0) {
        lastWrittenChildrenRef.current = currentChildren;
        clearDocumentSession();
        return;
      }
      try {
        const manifestBase64 = collectDocumentManifestBase64(board, appState.filePath || '');
        const documentText = serializeAsMindForAI(board, manifestBase64);
        if (!documentText.trim()) {
          return;
        }
        lastWrittenChildrenRef.current = currentChildren;
        writeDocumentSession({
          type: 'mindforai-session',
          version: 1,
          documentText,
          isDirty: !!appState.isDirty,
          fileIdentity: appState.filePath
            ? {
                fileName: (appState.filePath || '').split(/[\\/]/).pop() || appState.filePath,
                filePath: appState.filePath,
              }
            : null,
        });
      } catch {
        return;
      }
    }, SESSION_WRITE_DELAY_MS * 2);
    return () => {
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, appState.filePath, appState.isDirty]);

  return null;
};
