// 拖拽本地画板文件到窗口时显示遮罩，支持同时拖入多个文件并合并成一张思维导图
import { useEffect, useState } from 'react';
import { PlaitBoard } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { getDroppedFileHandles, isMindForAIDocumentFile } from '../data/drop-open';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import {
  applyDocumentDataToBoard,
  getMergeManifest,
  readFilesForOpen,
} from '../data/document-open';
import type { MindForAIFileHandle } from '../data/json';
import './document-drop-layer.scss';

const getDocumentFiles = (dataTransfer: DataTransfer | null) => {
  const files = Array.from(dataTransfer?.files || []);
  return files.filter((file) => isMindForAIDocumentFile(file));
};

export const DocumentDropLayer = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { setAppState, showToast } = useMindForAI();
  const { t } = useI18n();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggingCount, setDraggingCount] = useState(0);

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      const documentFiles = getDocumentFiles(event.dataTransfer);
      if (!documentFiles.length) {
        return;
      }
      event.preventDefault();
      setIsDraggingFile(true);
      setDraggingCount(documentFiles.length);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) {
        setIsDraggingFile(false);
        setDraggingCount(0);
      }
    };

    const handleDrop = async (event: DragEvent) => {
      const documentFiles = getDocumentFiles(event.dataTransfer);
      setIsDraggingFile(false);
      setDraggingCount(0);
      if (!documentFiles.length || PlaitBoard.isReadonly(board)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const droppedHandles = await getDroppedFileHandles(event);
      const result = await readFilesForOpen(documentFiles);
      if (result.invalid) {
        const invalidFileHandle = droppedHandles[result.invalid.file.name] || null;
        setAppState((currentAppState) => ({
          ...currentAppState,
          invalidDocument: {
            fileName: result.invalid!.filePath,
            fileHandle: invalidFileHandle,
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
        : documentFiles[0].name;
      let droppedFileHandle: MindForAIFileHandle = null;
      if (!isMultiFile) {
        droppedFileHandle = droppedHandles[documentFiles[0].name] || null;
      }
      const manifest = getMergeManifest(result.data, isMultiFile);
      applyDocumentDataToBoard(board, listRender, result.data, manifest);
      setAppState((currentAppState) => ({
        ...currentAppState,
        filePath: documentName,
        fileHandle: droppedFileHandle,
        editingDocument: false,
        isDirty: false,
      }));
      showToast({ message: `${t('toast.dropFileLoaded')}${documentName}`, type: 'success' });
    };

    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('dragleave', handleDragLeave, true);
    window.addEventListener('drop', handleDrop, true);
    return () => {
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
      window.removeEventListener('drop', handleDrop, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, listRender, setAppState, showToast, t]);

  if (!isDraggingFile) {
    return null;
  }
  const hint =
    draggingCount > 1 ? `${t('toast.dropFileHint')} (${draggingCount})` : t('toast.dropFileHint');
  return (
    <div className="document-drop-layer" data-testid="document-drop-layer">
      <div className="document-drop-layer__hint">{hint}</div>
    </div>
  );
};
