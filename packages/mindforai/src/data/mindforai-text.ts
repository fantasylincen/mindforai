// 提供 .mindforai 文本树的序列化与解析能力，叶子节点独占一行且节点文本默认不带引号
import { DOCUMENT_MANIFEST_FIELD } from '../constants';
import { DocumentExportedType, MindForAIExportedData, MindForAINode } from './types';
import type { DocumentValidationErrorCode, DocumentValidationIssue } from './document-issues';
import { createDocumentIssue } from './document-issues';

const INDENT_UNIT = '  ';

const escapeMindForAIText = (text: string): string => {
  let escaped = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '\\') {
      escaped += '\\\\';
    } else if (character === '\n') {
      escaped += '\\n';
    } else if (character === '\r') {
      escaped += '\\r';
    } else if (character === '\t') {
      escaped += '\\t';
    } else {
      escaped += character;
    }
  }
  if (escaped.startsWith('"')) {
    escaped = `\\${escaped}`;
  }
  if (escaped.endsWith('"') && !escaped.endsWith('\\"')) {
    escaped = `${escaped.slice(0, -1)}\\"`;
  }
  return escaped;
};

const unescapeMindForAIText = (text: string): string => {
  let result = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character !== '\\') {
      result += character;
      continue;
    }
    const nextCharacter = text[index + 1];
    if (nextCharacter === 'n') {
      result += '\n';
      index++;
    } else if (nextCharacter === 'r') {
      result += '\r';
      index++;
    } else if (nextCharacter === 't') {
      result += '\t';
      index++;
    } else if (nextCharacter === '"') {
      result += '"';
      index++;
    } else if (nextCharacter === '\\') {
      result += '\\';
      index++;
    } else if (nextCharacter === 'u') {
      const code = text.slice(index + 2, index + 6);
      if (/^[0-9a-fA-F]{4}$/.test(code)) {
        result += String.fromCharCode(parseInt(code, 16));
        index += 5;
      } else {
        result += character;
      }
    } else {
      result += character;
    }
  }
  return result;
};

const decodeMindForAITextValue = (rawValue: string): string => {
  if (rawValue.length >= 2 && rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return unescapeMindForAIText(rawValue.slice(1, -1));
  }
  return unescapeMindForAIText(rawValue);
};

const countIndent = (line: string): number => {
  const match = /^ */.exec(line);
  return match ? match[0].length : 0;
};

const findNextContentLine = (lines: string[], startIndex: number): number => {
  for (let index = startIndex; index < lines.length; index++) {
    if (lines[index].trim()) {
      return index;
    }
  }
  return -1;
};

const writeMindForAINodeLines = (node: MindForAINode, depth: number, lines: string[]): void => {
  const indent = INDENT_UNIT.repeat(depth);
  if (typeof node === 'string') {
    const escapedText = escapeMindForAIText(node);
    lines.push(
      escapedText.startsWith('text:')
        ? `${indent}- text: ${escapedText}`
        : `${indent}- ${escapedText}`
    );
    return;
  }
  const text = typeof node.text === 'string' ? node.text : '';
  const escapedText = escapeMindForAIText(text);
  lines.push(escapedText ? `${indent}- text: ${escapedText}` : `${indent}- text:`);
  const children = Array.isArray(node.children) ? node.children : [];
  if (!children.length) {
    return;
  }
  lines.push(`${indent}${INDENT_UNIT}children[${children.length}]:`);
  for (const child of children) {
    writeMindForAINodeLines(child, depth + 2, lines);
  }
};

const appendManifestFieldLine = (data: MindForAIExportedData, lines: string[]): void => {
  if (typeof data.manifest === 'string' && data.manifest.trim()) {
    lines.push(`${DOCUMENT_MANIFEST_FIELD}: ${data.manifest.trim()}`);
  }
};

export const serializeMindForAIText = (data: MindForAIExportedData): string => {
  const content = Array.isArray(data.content) ? data.content : [];
  const lines = [`type: ${DocumentExportedType.mindforai}`, `version: ${data.version}`];
  if (!content.length) {
    lines.push('content: []');
    appendManifestFieldLine(data, lines);
    return lines.join('\n');
  }
  lines.push(`content[${content.length}]:`);
  for (const node of content) {
    writeMindForAINodeLines(node, 1, lines);
  }
  appendManifestFieldLine(data, lines);
  return lines.join('\n');
};

interface MindForAIListParseResult {
  nodes: MindForAINode[];
  nextIndex: number;
}

export interface MindForAITextDiagnosticsResult {
  data: MindForAIExportedData | null;
  issues: DocumentValidationIssue[];
}

const pushMindForAITextIssue = (
  issues: DocumentValidationIssue[],
  lineIndex: number,
  code: DocumentValidationErrorCode,
  detail?: string,
  column = 1
) => {
  issues.push(createDocumentIssue(code, lineIndex + 1, column, detail));
};

const parseMindForAINodeList = (
  lines: string[],
  startIndex: number,
  listIndent: number,
  issues: DocumentValidationIssue[]
): MindForAIListParseResult => {
  const nodes: MindForAINode[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    const indent = countIndent(line);
    if (indent < listIndent) {
      break;
    }
    if (indent > listIndent) {
      pushMindForAITextIssue(issues, index, 'invalidIndent', `${listIndent}`, indent + 1);
      index++;
      continue;
    }
    const itemText = line.slice(indent);
    if (!itemText.startsWith('- ') && itemText !== '-') {
      pushMindForAITextIssue(issues, index, 'invalidListItem', undefined, indent + 1);
      index++;
      continue;
    }
    const body = itemText === '-' ? '' : itemText.slice(2);
    const nextContentIndex = findNextContentLine(lines, index + 1);
    const nextIndent = nextContentIndex >= 0 ? countIndent(lines[nextContentIndex]) : -1;
    if (!(nextContentIndex >= 0 && nextIndent > indent)) {
      const rawText = body === 'text:' ? '' : body.startsWith('text: ') ? body.slice(6) : body;
      nodes.push(decodeMindForAITextValue(rawText));
      index++;
      continue;
    }
    if (!(body === 'text:' || body.startsWith('text: '))) {
      pushMindForAITextIssue(issues, nextContentIndex, 'unexpectedChildLine');
      nodes.push(decodeMindForAITextValue(body));
      index++;
      continue;
    }
    const rawText = body === 'text:' ? '' : body.slice(6);
    const childHeaderLine = lines[nextContentIndex].trim();
    const childHeaderMatch = /^children(?:\[(\d+)\])?:\s*(.*)$/.exec(childHeaderLine);
    if (!childHeaderMatch || childHeaderMatch[2]) {
      pushMindForAITextIssue(
        issues,
        nextContentIndex,
        childHeaderMatch ? 'inlineChildrenContent' : 'invalidChildrenHeader'
      );
      nodes.push(decodeMindForAITextValue(rawText));
      index = nextContentIndex;
      continue;
    }
    const expectedChildCount = childHeaderMatch[1] ? Number(childHeaderMatch[1]) : null;
    const childrenHeaderIndent = nextIndent;
    const firstChildIndex = findNextContentLine(lines, nextContentIndex + 1);
    let children: MindForAINode[] = [];
    let nextIndex = nextContentIndex + 1;
    if (firstChildIndex >= 0 && countIndent(lines[firstChildIndex]) > childrenHeaderIndent) {
      const childList = parseMindForAINodeList(
        lines,
        firstChildIndex,
        countIndent(lines[firstChildIndex]),
        issues
      );
      children = childList.nodes;
      nextIndex = childList.nextIndex;
    }
    if (expectedChildCount !== null && children.length !== expectedChildCount) {
      pushMindForAITextIssue(
        issues,
        nextContentIndex,
        'childrenCountMismatch',
        `${expectedChildCount}/${children.length}`
      );
    }
    nodes.push({ text: decodeMindForAITextValue(rawText), children });
    index = nextIndex;
  }
  return { nodes, nextIndex: index };
};

export const parseMindForAITextWithDiagnostics = (
  contents: string
): MindForAITextDiagnosticsResult => {
  const rawLines = contents.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const manifestPrefix = `${DOCUMENT_MANIFEST_FIELD}:`;
  let manifest: string | undefined;
  const lines = rawLines.filter((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(manifestPrefix)) {
      manifest = trimmedLine.slice(manifestPrefix.length).trim() || undefined;
      return false;
    }
    return true;
  });
  const issues: DocumentValidationIssue[] = [];
  let isMindForAIDocument = false;
  let hasTypeDeclaration = false;
  let version = 1;
  let contentIndex = -1;
  let contentIndent = 0;
  let expectedContentCount: number | null = null;
  const buildMindForAIData = (content: MindForAINode[]): MindForAIExportedData => {
    const data: MindForAIExportedData = { type: DocumentExportedType.mindforai, version, content };
    if (manifest) {
      data.manifest = manifest;
    }
    return data;
  };
  for (let index = 0; index < lines.length; index++) {
    const trimmedLine = lines[index].trim();
    if (!trimmedLine) {
      continue;
    }
    if (trimmedLine.startsWith('type:')) {
      hasTypeDeclaration = true;
      if (trimmedLine === `type: ${DocumentExportedType.mindforai}`) {
        isMindForAIDocument = true;
      } else {
        pushMindForAITextIssue(issues, index, 'invalidType', DocumentExportedType.mindforai);
      }
      continue;
    }
    if (trimmedLine.startsWith('version:')) {
      const parsedVersion = Number(trimmedLine.slice('version:'.length).trim());
      if (Number.isFinite(parsedVersion) && parsedVersion > 0) {
        version = parsedVersion;
      } else {
        pushMindForAITextIssue(issues, index, 'invalidVersion');
      }
      continue;
    }
    const contentMatch = /^content(?:\[(\d+)\])?:\s*(.*)$/.exec(trimmedLine);
    if (contentMatch) {
      contentIndex = index;
      contentIndent = countIndent(lines[index]);
      expectedContentCount = contentMatch[1] ? Number(contentMatch[1]) : null;
      if (contentMatch[2] === '[]') {
        if (isMindForAIDocument && !issues.length) {
          return { data: buildMindForAIData([]), issues: [] };
        }
        return { data: null, issues };
      }
      if (contentMatch[2]) {
        pushMindForAITextIssue(issues, index, 'invalidContentLine');
        return { data: null, issues };
      }
      break;
    }
    pushMindForAITextIssue(issues, index, 'unexpectedLine');
  }
  if (!hasTypeDeclaration) {
    pushMindForAITextIssue(issues, 0, 'missingType');
  }
  if (contentIndex < 0) {
    pushMindForAITextIssue(issues, Math.max(0, lines.length - 1), 'missingContent');
    return { data: null, issues };
  }
  const firstContentIndex = findNextContentLine(lines, contentIndex + 1);
  if (firstContentIndex < 0) {
    if (expectedContentCount !== null && expectedContentCount !== 0) {
      pushMindForAITextIssue(
        issues,
        contentIndex,
        'contentCountMismatch',
        `${expectedContentCount}/0`
      );
    }
    if (!issues.length && isMindForAIDocument) {
      return { data: buildMindForAIData([]), issues: [] };
    }
    return { data: null, issues };
  }
  if (countIndent(lines[firstContentIndex]) <= contentIndent) {
    pushMindForAITextIssue(issues, firstContentIndex, 'invalidIndent');
    return { data: null, issues };
  }
  const parsedList = parseMindForAINodeList(
    lines,
    firstContentIndex,
    countIndent(lines[firstContentIndex]),
    issues
  );
  if (expectedContentCount !== null && parsedList.nodes.length !== expectedContentCount) {
    pushMindForAITextIssue(
      issues,
      contentIndex,
      'contentCountMismatch',
      `${expectedContentCount}/${parsedList.nodes.length}`
    );
  }
  const trailingIndex = findNextContentLine(lines, parsedList.nextIndex);
  if (trailingIndex >= 0) {
    pushMindForAITextIssue(issues, trailingIndex, 'unexpectedLine');
  }
  if (issues.length || !isMindForAIDocument) {
    return { data: null, issues };
  }
  return { data: buildMindForAIData(parsedList.nodes), issues: [] };
};

export const parseMindForAIText = (contents: string): MindForAIExportedData | null => {
  return parseMindForAITextWithDiagnostics(contents).data;
};
