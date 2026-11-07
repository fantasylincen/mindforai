// DATA-06 统一处理当前文档的保存、另存为以及保存结果提示
import { PlaitBoard } from '@plait/core';
import { MindForAIBoard, MindForAIState } from '../hooks/use-mindforai';
import { i18nInsidePlaitHook } from '../i18n';
import {
  SaveableDocumentFormat,
  MindForAIFileHandle,
  saveDocumentToFormat,
  saveDocumentToPath,
} from './json';
import { collectDocumentManifestBase64 } from './document-manifest';

const isAbortError = (error: unknown) => {
  return !!error && typeof error === 'object' && (error as Error).name === 'AbortError';
};

export const isFileHandleWritable = async (fileHandle: MindForAIFileHandle): Promise<boolean> => {
  const handle = fileHandle as any;
  if (!handle) {
    return false;
  }
  if (typeof handle.queryPermission !== 'function') {
    return true;
  }
  const permissionOptions = { mode: 'readwrite' };
  try {
    if ((await handle.queryPermission(permissionOptions)) === 'granted') {
      return true;
    }
    if (typeof handle.requestPermission !== 'function') {
      return false;
    }
    return (await handle.requestPermission(permissionOptions)) === 'granted';
  } catch {
    return false;
  }
};

const applySavedDocumentState = (
  board: PlaitBoard,
  savedDocument: { filePath: string; fileHandle: MindForAIFileHandle }
) => {
  const mindForAIBoard = board as MindForAIBoard;
  mindForAIBoard.setMindForAIAppState?.((currentAppState: MindForAIState) => ({
    ...currentAppState,
    filePath: savedDocument.filePath,
    fileHandle: savedDocument.fileHandle,
    isDirty: false,
  }));
};

const showSaveResult = (board: PlaitBoard, isSuccess: boolean, silent = false) => {
  if (isSuccess && silent) {
    return;
  }
  const { t } = i18nInsidePlaitHook(board);
  (board as MindForAIBoard).showToast?.({
    message: isSuccess ? t('toast.saveSuccess') : t('toast.saveFailed'),
    type: isSuccess ? 'success' : 'error',
  });
};

export const saveDocumentToCurrentFile = async (
  board: PlaitBoard,
  options: { silent?: boolean } = {}
): Promise<boolean> => {
  const { filePath, fileHandle } = (board as MindForAIBoard).appState;
  if (fileHandle && !(await isFileHandleWritable(fileHandle))) {
    showSaveResult(board, false, options.silent);
    return false;
  }
  try {
    const manifestBase64 = collectDocumentManifestBase64(board, filePath || '');
    const savedDocument = await saveDocumentToPath(board, filePath, fileHandle, manifestBase64);
    applySavedDocumentState(board, savedDocument);
    showSaveResult(board, true, options.silent);
    return true;
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }
    showSaveResult(board, false, options.silent);
    return false;
  }
};

export const saveDocumentAsFormat = async (
  board: PlaitBoard,
  format: SaveableDocumentFormat
): Promise<boolean> => {
  const { filePath } = (board as MindForAIBoard).appState;
  try {
    const manifestBase64 = collectDocumentManifestBase64(board, filePath || '');
    const savedDocument = await saveDocumentToFormat(board, filePath, format, manifestBase64);
    applySavedDocumentState(board, savedDocument);
    showSaveResult(board, true);
    return true;
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }
    showSaveResult(board, false);
    return false;
  }
};
