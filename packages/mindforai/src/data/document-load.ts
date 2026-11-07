// 提供统一的文档读取入口，识别格式并返回内容或可定位的解析错误
import { parseFileContents } from './blob';
import { type FileSystemHandle } from './filesystem';
import { detectDocumentFormat } from './document-format';
import { validateDocumentContents, type DocumentValidationIssue } from './document-validation';
import type { DocumentExportedData, DocumentFormat } from './types';

export type LoadedDocumentFile =
  | { ok: true; data: DocumentExportedData; file: File; filePath: string }
  | {
      ok: false;
      file: File;
      filePath: string;
      format: DocumentFormat | null;
      contents: string;
      issues: DocumentValidationIssue[];
    };

export type InvalidLoadedDocumentFile = Extract<LoadedDocumentFile, { ok: false }>;

export const readDocumentFile = async (file: File): Promise<LoadedDocumentFile> => {
  const contents = await parseFileContents(file);
  const filePath = file.name || '';
  const detection = detectDocumentFormat(file, contents);
  const result = validateDocumentContents(contents, detection.format);
  if (result.ok && result.data) {
    return { ok: true, data: result.data, file, filePath };
  }
  return {
    ok: false,
    file,
    filePath,
    format: result.format,
    contents,
    issues: result.issues,
  };
};

export type InvalidDocumentState = {
  fileName: string;
  fileHandle: FileSystemHandle | null;
  contents: string;
  format: DocumentFormat | null;
  issues: DocumentValidationIssue[];
};
