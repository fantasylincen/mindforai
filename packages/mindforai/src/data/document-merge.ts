// DATA-22 将同时拖入的多个文档合并成一张按文件名分配分支的思维导图
import { PlaitElement, Viewport } from '@plait/core';
import { MindLayoutType } from '@plait/layouts';
import type { LoadedDocumentFile } from './document-load';
import { compactDocumentToDocumentData, convertToCompactDocument } from './compact-document';
import { VERSIONS } from '../constants';
import { DocumentExportedType } from './types';
import type { CompactDocumentNode, DocumentExportedData } from './types';

type LoadedDocumentSuccess = Extract<LoadedDocumentFile, { ok: true }>;

const MERGED_ROOT_TEXT = 'MindForAI';

const getFileStem = (filePath: string) => {
  const fileName = (filePath || '').split(/[\\/]/).pop() || filePath || MERGED_ROOT_TEXT;
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
};

const buildFileBranch = (loaded: LoadedDocumentSuccess): CompactDocumentNode | null => {
  const compact = convertToCompactDocument(loaded.data);
  const content = compact.content || [];
  if (!content.length) {
    return null;
  }
  return { text: getFileStem(loaded.filePath), children: content };
};

const mergeIntoSingleMindMap = (branches: CompactDocumentNode[]): DocumentExportedData => {
  const merged = compactDocumentToDocumentData({
    type: DocumentExportedType.drawnixlite,
    version: VERSIONS.drawnixlite,
    content: [{ text: MERGED_ROOT_TEXT, children: branches }],
  });
  const root = merged.elements[0] as Record<string, unknown> | undefined;
  if (root) {
    root.layout = MindLayoutType.right;
  }
  return {
    elements: merged.elements as PlaitElement[],
    viewport: { zoom: 1 } as Viewport,
  };
};

export const mergeLoadedDocumentsIntoMindMap = (
  loadedFiles: LoadedDocumentFile[]
): DocumentExportedData | null => {
  const successfulFiles = (loadedFiles || []).filter(
    (loaded): loaded is LoadedDocumentSuccess => !!loaded && loaded.ok
  );
  if (successfulFiles.length === 0) {
    return null;
  }
  if (successfulFiles.length === 1) {
    return successfulFiles[0].data;
  }
  const branches: CompactDocumentNode[] = [];
  for (const loaded of successfulFiles) {
    const branch = buildFileBranch(loaded);
    if (branch) {
      branches.push(branch);
    }
  }
  if (branches.length === 0) {
    return null;
  }
  return mergeIntoSingleMindMap(branches);
};
