// UI-44 空画布首页拖拽提示面板，提示可拖入的文件类型并在拖拽时高亮反馈
import { useEffect, useState } from 'react';
import { PlaitBoard } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import { fileOpen } from '../data/filesystem';
import {
  applyDocumentDataToBoard,
  getMergeManifest,
  readFilesForOpen,
} from '../data/document-open';
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
  const { setAppState, showToast } = useMindForAI();
  const { t } = useI18n();
  const [isBusy, setIsBusy] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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
      const files = await fileOpen({
        description: 'MindForAI files',
        extensions: ['mindforai', 'drawnixlite', 'md'],
        multiple: true,
      });
      const fileList = Array.isArray(files) ? files : [files];
      if (!fileList.length) {
        return;
      }
      const result = await readFilesForOpen(fileList);
      if (result.invalid) {
        setAppState((currentAppState) => ({
          ...currentAppState,
          invalidDocument: {
            fileName: result.invalid!.filePath,
            fileHandle: null,
            contents: result.invalid!.contents,
            format: result.invalid!.format,
            issues: result.invalid!.issues,
          },
        }));
        return;
      }
      if (!result.data) {
        showToast({ message: t('toast.dropFileUnsupported'), type: 'error' });
        return;
      }
      const isMultiFile = result.isMultiFile;
      const documentName = isMultiFile
        ? `${t('toast.mergedFileNamePrefix')}${result.fileCount}${t('toast.mergedFileNameSuffix')}`
        : fileList[0].name;
      const manifest = getMergeManifest(result.data, isMultiFile);
      applyDocumentDataToBoard(board, listRender, result.data, manifest);
      setAppState((currentAppState) => ({
        ...currentAppState,
        filePath: documentName,
        fileHandle: isMultiFile ? null : (fileList[0] as File & { handle?: any }).handle || null,
        editingDocument: false,
        isDirty: false,
      }));
      showToast({ message: `${t('toast.dropFileLoaded')}${documentName}`, type: 'success' });
    } catch (error) {
      if (error && typeof error === 'object' && (error as Error).name === 'AbortError') {
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
          <span className="mindforai-welcome__drop-text">{t('welcome.dropHere')}</span>
          <button
            type="button"
            className="mindforai-welcome__button"
            onClick={handleOpenFiles}
            disabled={isBusy}
            data-testid="welcome-open-file"
          >
            {t('welcome.openFile')}
          </button>
          <span className="mindforai-welcome__formats">
            {t('welcome.supportedFormats')}
            <span className="mindforai-welcome__format">mindforai</span>
            <span className="mindforai-welcome__format">markdown</span>
            <span className="mindforai-welcome__format">drawnixlite</span>
          </span>
        </>
      )}
    </div>
  );
};
