// UI-44 空画布首页拖拽提示面板，提示可拖入的文件类型并在拖拽时高亮反馈
import { useEffect, useState } from 'react';
import { PlaitBoard } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import { isOpenDocumentAbortError, openDocumentFilesViaFileInput } from '../data/document-open';
import { isMindForAIDocumentFile } from '../data/drop-open';
import './welcome.scss';

const hasDraggingFiles = (dataTransfer: DataTransfer | null) => {
  if (!dataTransfer) {
    return false;
  }
  if (Array.from(dataTransfer.types || []).includes('Files')) {
    return true;
  }
  return Array.from(dataTransfer.files || []).some((file) => isMindForAIDocumentFile(file));
};

export const Welcome = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { appState, setAppState, showToast } = useMindForAI();
  const { t } = useI18n();
  const [isBusy, setIsBusy] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const isTouchDevice = !!appState.isMobile;

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      if (hasDraggingFiles(event.dataTransfer)) {
        setIsDraggingFile(true);
      }
    };
    const handleDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) {
        setIsDraggingFile(false);
      }
    };
    const handleDrop = () => {
      setIsDraggingFile(false);
    };
    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('dragleave', handleDragLeave, true);
    window.addEventListener('drop', handleDrop, true);
    return () => {
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
      window.removeEventListener('drop', handleDrop, true);
    };
  }, []);

  if (Array.isArray(board.children) && board.children.length > 0) {
    return null;
  }

  const handleOpenFiles = async () => {
    if (isBusy || PlaitBoard.isReadonly(board)) {
      return;
    }
    setIsBusy(true);
    try {
      await openDocumentFilesViaFileInput(board, listRender, setAppState, showToast, {
        mergedFileNamePrefix: t('toast.mergedFileNamePrefix'),
        mergedFileNameSuffix: t('toast.mergedFileNameSuffix'),
        dropFileLoaded: t('toast.dropFileLoaded'),
        dropFileUnsupported: t('toast.dropFileUnsupported'),
      });
    } catch (error) {
      if (isOpenDocumentAbortError(error)) {
        return;
      }
      showToast({ message: t('toast.dropFileUnsupported'), type: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={`mindforai-welcome__panel${isDraggingFile ? ' mindforai-welcome__panel--dragging' : ''}`}
      data-testid="mindforai-welcome"
    >
      {isDraggingFile ? (
        <span className="mindforai-welcome__drop-active">{t('welcome.dropActive')}</span>
      ) : (
        <>
          <span className="mindforai-welcome__drop-text">
            {isTouchDevice ? t('welcome.touchDropHere') : t('welcome.dropHere')}
          </span>
          <button
            type="button"
            className="mindforai-welcome__button"
            onClick={handleOpenFiles}
            disabled={isBusy}
            data-testid="welcome-open-file"
          >
            {t('welcome.openFile')}
          </button>
          {isTouchDevice && (
            <span className="mindforai-welcome__touch-hint">{t('welcome.touchHint')}</span>
          )}
          <span className="mindforai-welcome__formats">
            {t('welcome.supportedFormats')}
            <span className="mindforai-welcome__format">toon</span>
            <span className="mindforai-welcome__format">markdown</span>
            <span className="mindforai-welcome__format">json</span>
          </span>
        </>
      )}
    </div>
  );
};
