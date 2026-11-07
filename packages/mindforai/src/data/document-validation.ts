// 对两种文档格式做结构校验，并给出可定位的错误信息与格式化结果
import { decode } from '@toon-format/toon';
import { compactDocumentToDocumentData } from './compact-document';
import { mindForAIToDocumentData, isMindForAIData } from './toon-document';
import { parseMarkdownDocumentToMindForAIData } from './markdown-document';
import { parseMindForAITextWithDiagnostics, serializeMindForAIText } from './mindforai-text';
import {
  createDocumentIssue,
  findJsonKeyLocation,
  getJsonSyntaxIssue,
  type DocumentValidationIssue,
} from './document-issues';
import type {
  CompactDocumentExportedData,
  DocumentExportedData,
  DocumentFormat,
  MindForAIExportedData,
} from './types';

export type { DocumentValidationErrorCode, DocumentValidationIssue } from './document-issues';

export interface DocumentValidationResult {
  ok: boolean;
  format: DocumentFormat | null;
  data: DocumentExportedData | null;
  issues: DocumentValidationIssue[];
}

const validateCompactNodes = (
  nodes: unknown,
  path: string,
  issues: DocumentValidationIssue[],
  getLocation: () => { line: number; column: number }
) => {
  if (!Array.isArray(nodes)) {
    return;
  }
  nodes.forEach((node, index) => {
    const nodePath = `${path}[${index}]`;
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      const location = getLocation();
      issues.push(
        createDocumentIssue('invalidCompactNode', location.line, location.column, nodePath)
      );
      return;
    }
    const record = node as Record<string, unknown>;
    if (record.text !== undefined && typeof record.text !== 'string') {
      const location = getLocation();
      issues.push(
        createDocumentIssue('invalidCompactNode', location.line, location.column, nodePath)
      );
    }
    if (record.children !== undefined) {
      if (!Array.isArray(record.children)) {
        const location = getLocation();
        issues.push(
        createDocumentIssue('invalidCompactNode', location.line, location.column, nodePath)
      );
        return;
      }
      validateCompactNodes(record.children, `${nodePath}.children`, issues, getLocation);
    }
  });
};

const validateCompactData = (
  contents: string,
  data: Record<string, unknown>
): DocumentValidationIssue[] => {
  const issues: DocumentValidationIssue[] = [];
  if (data.type !== 'drawnixlite') {
    const location = findJsonKeyLocation(contents, 'type');
    issues.push(createDocumentIssue('invalidType', location.line, location.column, 'drawnixlite'));
  }
  if (!Array.isArray(data.content)) {
    const location = findJsonKeyLocation(contents, 'content');
    issues.push(createDocumentIssue('missingCompactContent', location.line, location.column));
    return issues;
  }
  validateCompactNodes(data.content, 'content', issues, () =>
    findJsonKeyLocation(contents, 'content')
  );
  return issues;
};

const parseJsonDocument = (contents: string): DocumentValidationResult => {
  const format: DocumentFormat = 'drawnixlite';
  let parsed: unknown;
  const normalizedContents = contents.replace(/^\uFEFF/, '');
  try {
    parsed = JSON.parse(normalizedContents);
  } catch (error) {
    return {
      ok: false,
      format,
      data: null,
      issues: [getJsonSyntaxIssue(normalizedContents, error)],
    };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      format,
      data: null,
      issues: [createDocumentIssue('invalidDocumentStructure')],
    };
  }
  const data = parsed as Record<string, unknown>;
  const issues = validateCompactData(contents, data);
  if (issues.length) {
    return { ok: false, format, data: null, issues };
  }
  return {
    ok: true,
    format,
    data: compactDocumentToDocumentData(data as unknown as CompactDocumentExportedData),
    issues: [],
  };
};

const parseMindForAIDocument = (contents: string): DocumentValidationResult => {
  const textResult = parseMindForAITextWithDiagnostics(contents);
  if (textResult.data) {
    return {
      ok: true,
      format: 'mindforai',
      data: mindForAIToDocumentData(textResult.data),
      issues: [],
    };
  }
  let legacyData: unknown;
  try {
    legacyData = decode(contents);
  } catch {
    legacyData = null;
  }
  if (isMindForAIData(legacyData)) {
    return {
      ok: true,
      format: 'mindforai',
      data: mindForAIToDocumentData(legacyData as unknown as MindForAIExportedData),
      issues: [],
    };
  }
  return {
    ok: false,
    format: 'mindforai',
    data: null,
    issues: textResult.issues.length
      ? textResult.issues
      : [createDocumentIssue('unknownFormat')],
  };
};

const parseMarkdownDocument = (contents: string): DocumentValidationResult => {
  const data = parseMarkdownDocumentToMindForAIData(contents);
  return {
    ok: true,
    format: 'markdown',
    data: mindForAIToDocumentData(data),
    issues: [],
  };
};

export const validateDocumentContents = (
  contents: string,
  format: DocumentFormat | null
): DocumentValidationResult => {
  if (!format) {
    return {
      ok: false,
      format: null,
      data: null,
      issues: [createDocumentIssue('unknownFormat')],
    };
  }
  if (format === 'mindforai') {
    return parseMindForAIDocument(contents);
  }
  if (format === 'markdown') {
    return parseMarkdownDocument(contents);
  }
  return parseJsonDocument(contents);
};

const normalizeMindForAITextIndent = (contents: string): string => {
  const lines = contents.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const indentStack: number[] = [];
  return lines
    .map((line) => {
      const trimmedEnd = line.replace(/\s+$/, '');
      if (!trimmedEnd.trim()) {
        return '';
      }
      const indent = /^ */.exec(trimmedEnd)?.[0].length || 0;
      while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
      }
      if (!indentStack.length) {
        indentStack.push(indent);
      } else if (indent > indentStack[indentStack.length - 1]) {
        indentStack.push(indent);
      } else if (indent !== indentStack[indentStack.length - 1]) {
        if (indentStack.length === 1) {
          indentStack[0] = indent;
        } else {
          indentStack.push(indent);
        }
      }
      const content = trimmedEnd.slice(indent);
      return `${'  '.repeat(indentStack.length - 1)}${content}`;
    })
    .join('\n');
};

export const formatDocumentContents = (
  contents: string,
  format: DocumentFormat | null
): { text: string; issues: DocumentValidationIssue[] } => {
  if (format === 'mindforai') {
    const textResult = parseMindForAITextWithDiagnostics(contents);
    if (textResult.data) {
      return { text: serializeMindForAIText(textResult.data), issues: [] };
    }
    const normalized = normalizeMindForAITextIndent(contents);
    const normalizedResult = parseMindForAITextWithDiagnostics(normalized);
    if (normalizedResult.data) {
      return { text: serializeMindForAIText(normalizedResult.data), issues: [] };
    }
    return { text: normalized, issues: normalizedResult.issues };
  }
  if (format === 'markdown') {
    return { text: contents, issues: [] };
  }
  if (format === 'drawnixlite') {
    const normalizedContents = contents.replace(/^\uFEFF/, '');
    try {
      return { text: JSON.stringify(JSON.parse(normalizedContents), null, 2), issues: [] };
    } catch (error) {
      return {
        text: contents,
        issues: [getJsonSyntaxIssue(normalizedContents, error)],
      };
    }
  }
  return { text: contents, issues: [createDocumentIssue('unknownFormat')] };
};
