// 定义文档解析错误码与定位信息，并提供行列换算工具
import type { Translations } from '../i18n/types';

export type DocumentValidationErrorCode =
  | 'unknownFormat'
  | 'missingType'
  | 'invalidType'
  | 'invalidVersion'
  | 'missingContent'
  | 'invalidContentLine'
  | 'unexpectedLine'
  | 'invalidIndent'
  | 'invalidListItem'
  | 'invalidChildrenHeader'
  | 'inlineChildrenContent'
  | 'childrenCountMismatch'
  | 'contentCountMismatch'
  | 'unexpectedChildLine'
  | 'jsonSyntax'
  | 'missingCompactContent'
  | 'invalidCompactNode'
  | 'invalidDocumentStructure';

export interface DocumentValidationIssue {
  code: DocumentValidationErrorCode;
  line: number;
  column: number;
  detail?: string;
}

export const createDocumentIssue = (
  code: DocumentValidationErrorCode,
  line = 1,
  column = 1,
  detail?: string
): DocumentValidationIssue => ({
  code,
  line: Math.max(1, line),
  column: Math.max(1, column),
  ...(detail ? { detail } : {}),
});

export const getLineColumnAtPosition = (contents: string, position: number) => {
  const safePosition = Math.max(0, Math.min(position, contents.length));
  let line = 1;
  let lineStart = 0;
  for (let index = 0; index < safePosition; index++) {
    if (contents[index] === '\n') {
      line += 1;
      lineStart = index + 1;
    }
  }
  return { line, column: safePosition - lineStart + 1 };
};

export const findJsonKeyLocation = (contents: string, key: string) => {
  const index = contents.indexOf(`"${key}"`);
  if (index < 0) {
    return { line: 1, column: 1 };
  }
  return getLineColumnAtPosition(contents, index);
};

export const getJsonSyntaxIssue = (contents: string, error: unknown): DocumentValidationIssue => {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = /position\s+(\d+)/i.exec(message);
  if (positionMatch) {
    const location = getLineColumnAtPosition(contents, Number(positionMatch[1]));
    return createDocumentIssue('jsonSyntax', location.line, location.column, message);
  }
  const lineMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
  if (lineMatch) {
    return createDocumentIssue('jsonSyntax', Number(lineMatch[1]), Number(lineMatch[2]), message);
  }
  const lines = contents.split('\n');
  const lastLine = lines[lines.length - 1] || '';
  return createDocumentIssue('jsonSyntax', lines.length, lastLine.length + 1, message);
};

export const getErrorMessage = (
  issue: DocumentValidationIssue,
  translate: (key: keyof Translations) => string
) => {
  const message = translate(`documentError.${issue.code}`);
  return issue.detail ? `${message} (${issue.detail})` : message;
};
