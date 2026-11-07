// DATA-24 统一“读取多个文件 → 合并为一张思维导图 → 应用到画板”的打开流程
import { PlaitBoard, PlaitElement, ListRender, Viewport } from '@plait/core';
import type { MindForAIBoard } from '../hooks/use-mindforai';
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
import { applyDefaultVisibleLevels } from './document-expansion';

export interface ReadFilesResult {
  data: DocumentExportedData | null;
  invalid: Extract<LoadedDocumentFile, { ok: false }> | null;
  isMultiFile: boolean;
  fileCount: number;
}

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
