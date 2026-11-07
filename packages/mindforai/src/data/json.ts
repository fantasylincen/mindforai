// 文档序列化与读写工具，负责保存路径解析、格式推断与打开入口
import { PlaitBoard } from '@plait/core';
import { DOCUMENT_FILE_EXTENSIONS } from '../constants';
import { isMarkdownFileName } from './markdown-to-mindforai';
import { fileOpen, type FileSystemHandle } from './filesystem';
import { DocumentExportedData, type SaveableDocumentFormat } from './types';
import { saveAsCompactDocument } from './compact-document';
import { saveAsMindForAI } from './toon-document';
import { saveAsMarkdown } from './markdown-document-save';
import { readDocumentFile, type InvalidLoadedDocumentFile } from './document-load';

export type MindForAIFileHandle = FileSystemHandle | null;

type FileWithHandle = File & {
  handle?: FileSystemHandle;
};

export type { DocumentFormat, SaveableDocumentFormat } from './types';

type JsonDocumentFormat = Exclude<SaveableDocumentFormat, 'markdown'>;

const DOCUMENT_FORMATS: JsonDocumentFormat[] = ['mindforai', 'drawnixlite'];

export const isMarkdownDocumentPath = (filePath: string | null): boolean => {
  return !!filePath && isMarkdownFileName(filePath);
};

export const getFileExtension = (filePath: string): string => {
  const match = /\.([^.\\/]+)$/.exec(filePath || '');
  return match ? match[1].toLowerCase() : '';
};

export const getDocumentFileExtension = (format: SaveableDocumentFormat): string => {
  return format === 'markdown' ? 'md' : DOCUMENT_FILE_EXTENSIONS[format];
};

export const resolveDocumentFormat = (filePath: string | null): SaveableDocumentFormat => {
  if (isMarkdownDocumentPath(filePath)) {
    return 'markdown';
  }
  const extension = getFileExtension(filePath || '');
  return (
    DOCUMENT_FORMATS.find((format) => DOCUMENT_FILE_EXTENSIONS[format] === extension) || 'mindforai'
  );
};

export const buildDocumentPath = (name: string, format: SaveableDocumentFormat) => {
  return `${name}.${getDocumentFileExtension(format)}`;
};

export const resolveSavedDocumentPath = (
  fileHandle: MindForAIFileHandle,
  fallbackPath: string
): string => {
  const handleName = fileHandle && typeof fileHandle.name === 'string' ? fileHandle.name : '';
  return handleName || fallbackPath;
};

export const getDefaultName = () => {
  const time = new Date().getTime();
  return time.toString();
};

export const getFileNameWithoutExtension = (fileName: string) => {
  const name = fileName.replace(/\.[^./\\]+$/, '');
  return name || fileName;
};

export type OpenDocumentResult =
  | {
      ok: true;
      data: DocumentExportedData;
      fileHandle: MindForAIFileHandle;
      filePath: string;
    }
  | {
      ok: false;
      invalid: InvalidLoadedDocumentFile;
      fileHandle: MindForAIFileHandle;
      filePath: string;
    };

export const loadFromJSON = async (): Promise<OpenDocumentResult> => {
  const file = await fileOpen({
    description: 'MindForAI files',
    extensions: ['mindforai', 'drawnixlite', 'md'],
  });
  const fileHandle = (file as FileWithHandle).handle || null;
  const filePath = file.name || buildDocumentPath(getDefaultName(), 'mindforai');
  const loaded = await readDocumentFile(file);
  if (!loaded.ok) {
    return { ok: false, invalid: loaded, fileHandle, filePath };
  }
  return { ok: true, data: loaded.data, fileHandle, filePath };
};

const saveBoardAsDocumentFormat = async (
  board: PlaitBoard,
  format: SaveableDocumentFormat,
  name: string,
  existingFileHandle: MindForAIFileHandle,
  manifestBase64?: string
) => {
  if (format === 'drawnixlite') {
    return (await saveAsCompactDocument(board, name, existingFileHandle, manifestBase64)).fileHandle;
  }
  if (format === 'markdown') {
    return (await saveAsMarkdown(board, name, existingFileHandle, manifestBase64)).fileHandle;
  }
  return (await saveAsMindForAI(board, name, existingFileHandle, manifestBase64)).fileHandle;
};

export const saveDocumentToPath = async (
  board: PlaitBoard,
  filePath: string | null,
  fileHandle: MindForAIFileHandle,
  manifestBase64?: string
) => {
  const format = resolveDocumentFormat(filePath);
  const name = filePath ? getFileNameWithoutExtension(filePath) : getDefaultName();
  const savedFileHandle = await saveBoardAsDocumentFormat(
    board,
    format,
    name,
    fileHandle,
    manifestBase64
  );
  return {
    filePath: resolveSavedDocumentPath(
      savedFileHandle,
      filePath || buildDocumentPath(name, format)
    ),
    fileHandle: savedFileHandle,
  };
};

export const saveDocumentToFormat = async (
  board: PlaitBoard,
  filePath: string | null,
  format: SaveableDocumentFormat,
  manifestBase64?: string
) => {
  const name = filePath ? getFileNameWithoutExtension(filePath) : getDefaultName();
  const savedFileHandle = await saveBoardAsDocumentFormat(
    board,
    format,
    name,
    null,
    manifestBase64
  );
  return {
    filePath: resolveSavedDocumentPath(savedFileHandle, buildDocumentPath(name, format)),
    fileHandle: savedFileHandle,
  };
};

export const loadFromJSONFile = async (file: File): Promise<DocumentExportedData | null> => {
  const loaded = await readDocumentFile(file);
  return loaded.ok ? loaded.data : null;
};
