// DATA-24 统一“读取多个文件 → 合并为一张思维导图 → 应用到画板”的打开流程
import { PlaitBoard, PlaitElement, ListRender, Viewport } from '@plait/core';
import type { MindForAIBoard, MindForAIState } from '../hooks/use-mindforai';
import type { LoadedDocumentFile } from './document-load';
import type { DocumentExportedData } from './types';
import { mergeLoadedDocumentsIntoMindMap } from './document-merge';
import {
  applyDocumentManifestLanguage,
  applyDocumentManifestTheme,
  applyDocumentManifestToElements,
  applyDocumentManifestViewport,
  readDocumentManifestBase64,
  type DocumentManifest,
} from './document-manifest';
import { readMindForAIDocumentFile } from './drop-open';
import { fileOpen } from './filesystem';
import { DOCUMENT_OPEN_EXTENSIONS } from '../constants';
import { applyDefaultVisibleLevels } from './document-expansion';

export type ReadFilesResult = {
  data: DocumentExportedData | null;
  invalid: Extract<LoadedDocumentFile, { ok: false }> | null;
  isMultiFile: boolean;
  fileCount: number;
};

export type OpenDocumentFilesText = {
  mergedFileNamePrefix: string;
  mergedFileNameSuffix: string;
  dropFileLoaded: string;
  dropFileUnsupported: string;
};

export const isOpenDocumentAbortError = (error: unknown) => {
  return !!error && typeof error === 'object' && (error as Error).name === 'AbortError';
};

export const pickDocumentFilesForOpen = () => {
  return fileOpen({
    description: 'MindForAI files',
    extensions: [...DOCUMENT_OPEN_EXTENSIONS],
    multiple: true,
  });
};

export const readFilesForOpen = async (files: File[]): Promise<ReadFilesResult> => {
  const loadedFiles: LoadedDocumentFile[] = [];
  for (const file of files) {
    loadedFiles.push(await readMindForAIDocumentFile(file));
  }
  const invalid = loadedFiles.find(
    (loaded): loaded is Extract<LoadedDocumentFile, { ok: false }> => !loaded.ok
  );
  if (invalid) {
    return { data: null, invalid, isMultiFile: files.length > 1, fileCount: files.length };
  }
  return {
    data: mergeLoadedDocumentsIntoMindMap(loadedFiles),
    invalid: null,
    isMultiFile: files.length > 1,
    fileCount: files.length,
  };
};

export const getMergeManifest = (
  data: DocumentExportedData | null,
  isMultiFile: boolean
): DocumentManifest | null => {
  return isMultiFile ? null : readDocumentManifestBase64(data?.manifest);
};

export const resolveElementsWithManifest = (
  elements: PlaitElement[],
  manifest: DocumentManifest | null | undefined
): PlaitElement[] => {
  return manifest
    ? applyDocumentManifestToElements(elements, manifest)
    : applyDefaultVisibleLevels(elements);
};

export const applyDocumentDataToBoard = (
  board: PlaitBoard,
  listRender: ListRender,
  data: DocumentExportedData,
  manifest: DocumentManifest | null
) => {
  const loadedElements = resolveElementsWithManifest(data.elements, manifest);
  board.children = loadedElements;
  board.viewport = data.viewport || ({ zoom: 1 } as Viewport);
  if (data.theme) {
    board.theme = data.theme;
  }
  listRender.update(board.children, {
    board,
    parent: board,
    parentG: PlaitBoard.getElementHost(board),
  });
  if (manifest) {
    applyDocumentManifestViewport(board, manifest);
    applyDocumentManifestTheme(board, manifest);
    const language = applyDocumentManifestLanguage(board, manifest);
    if (language) {
      (board as MindForAIBoard).setMindForAIAppState?.((currentAppState) => ({
        ...currentAppState,
        language,
      }));
    }
  }
};

export const openDocumentFilesViaFileInput = async (
  board: PlaitBoard,
  listRender: ListRender,
  setAppState: (updater: (currentAppState: MindForAIState) => MindForAIState) => void,
  showToast: (options: { message: string; type: 'success' | 'error' }) => void,
  openText: OpenDocumentFilesText
) => {
  if (PlaitBoard.isReadonly(board)) {
    return;
  }
  const pickedFiles = await pickDocumentFilesForOpen();
  const fileList = Array.isArray(pickedFiles) ? pickedFiles : [pickedFiles];
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
    showToast({ message: openText.dropFileUnsupported, type: 'error' });
    return;
  }
  const isMultiFile = result.isMultiFile;
  const documentName = isMultiFile
    ? `${openText.mergedFileNamePrefix}${result.fileCount}${openText.mergedFileNameSuffix}`
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
  showToast({ message: `${openText.dropFileLoaded}${documentName}`, type: 'success' });
};
