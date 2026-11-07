// 提供拖拽文件打开画板文档的公共逻辑
import { DOCUMENT_FILE_EXTENSIONS, MIME_TYPES } from '../constants';
import { readDocumentFile, type LoadedDocumentFile } from './document-load';
import { isMarkdownFileName } from './markdown-to-mindforai';

export const isMindForAIDocumentFile = (file: File) => {
  const fileName = (file.name || '').toLowerCase();
  if (fileName.endsWith(`.${DOCUMENT_FILE_EXTENSIONS.mindforai}`)) {
    return true;
  }
  if (fileName.endsWith(`.${DOCUMENT_FILE_EXTENSIONS.drawnixlite}`)) {
    return true;
  }
  if (isMarkdownFileName(fileName)) {
    return true;
  }
  return file.type === MIME_TYPES.drawnixlite || file.type === MIME_TYPES.mindforai;
};

export const readMindForAIDocumentFile = async (file: File): Promise<LoadedDocumentFile> => {
  return readDocumentFile(file);
};

export const getDroppedFileHandle = async (event: DragEvent, droppedFile: File): Promise<any> => {
  const items = Array.from(event.dataTransfer?.items || []);
  for (const item of items) {
    if (item.kind !== 'file' || typeof (item as any).getAsFileSystemHandle !== 'function') {
      continue;
    }
    try {
      const handle = await (item as any).getAsFileSystemHandle();
      if (handle && handle.kind === 'file' && handle.name === droppedFile.name) {
        return handle;
      }
    } catch {
      return null;
    }
  }
  return null;
};

export const getDroppedFileHandles = async (event: DragEvent): Promise<Record<string, any>> => {
  const handles: Record<string, any> = {};
  const items = Array.from(event.dataTransfer?.items || []);
  for (const item of items) {
    if (item.kind !== 'file' || typeof (item as any).getAsFileSystemHandle !== 'function') {
      continue;
    }
    try {
      const handle = await (item as any).getAsFileSystemHandle();
      if (handle && handle.kind === 'file') {
        handles[handle.name] = handle;
      }
    } catch {
      continue;
    }
  }
  return handles;
};
