// DATA-30 把 mindforai 树序列化为 Markdown 文本，并支持在 Markdown 末尾追加 / 提取内嵌清单字段
import { DOCUMENT_MANIFEST_FIELD } from '../constants';
import { readDocumentManifestBase64 } from './document-manifest';
import type { DocumentManifest } from './document-manifest';
import { parseMarkdownToMindForAI } from './markdown-to-mindforai';
import type { MindForAIExportedData, MindForAINode } from './types';

const INDENT_UNIT = '  ';

const escapeMarkdownInline = (text: string): string => {
  let escaped = '';
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '\n') {
      escaped += ' ';
    } else if (character === '[' || character === ']' || character === '\\') {
      escaped += `\\${character}`;
    } else {
      escaped += character;
    }
  }
  return escaped;
};

const readNodeText = (node: MindForAINode): string => {
  if (typeof node === 'string') {
    return node;
  }
  return typeof node.text === 'string' ? node.text : '';
};

const readNodeChildren = (node: MindForAINode): MindForAINode[] => {
  if (typeof node === 'string') {
    return [];
  }
  return Array.isArray(node.children) ? node.children : [];
};

const isTableRow = (node: MindForAINode): boolean => {
  return !readNodeChildren(node).length && readNodeText(node).includes(' | ');
};

const writeListBranch = (node: MindForAINode, depth: number, lines: string[]): void => {
  const text = readNodeText(node).trim();
  const children = readNodeChildren(node);
  if (!children.length) {
    if (text) {
      lines.push(`${INDENT_UNIT.repeat(depth)}- ${escapeMarkdownInline(text)}`);
    }
    return;
  }
  if (children.every(isTableRow)) {
    if (text) {
      lines.push(`${INDENT_UNIT.repeat(depth)}- ${escapeMarkdownInline(text)}`);
      lines.push('');
    }
    for (const child of children) {
      lines.push(`${INDENT_UNIT.repeat(depth)}- ${escapeMarkdownInline(readNodeText(child))}`);
    }
    return;
  }
  if (text) {
    lines.push(`${INDENT_UNIT.repeat(depth)}- ${escapeMarkdownInline(text)}`);
    depth += 1;
  }
  for (const child of children) {
    writeListBranch(child, depth, lines);
  }
};

const writeBranchNode = (node: MindForAINode, level: number, lines: string[]): void => {
  const text = readNodeText(node).trim();
  const children = readNodeChildren(node);
  if (!children.length) {
    if (text) {
      lines.push(escapeMarkdownInline(text));
    }
    return;
  }
  if (level <= 6) {
    if (lines.length) {
      lines.push('');
    }
    lines.push(text ? `${'#'.repeat(level)} ${escapeMarkdownInline(text)}` : `${'#'.repeat(level)}`);
    if (children.every((child) => !readNodeChildren(child).length)) {
      lines.push('');
      for (const child of children) {
        lines.push(`- ${escapeMarkdownInline(readNodeText(child).trim())}`);
      }
      return;
    }
    for (const child of children) {
      writeBranchNode(child, level + 1, lines);
    }
    return;
  }
  writeListBranch(node, 0, lines);
};

export const serializeMindForAITreeAsMarkdown = (content: MindForAINode[]): string => {
  const lines: string[] = [];
  for (const node of content) {
    const children = readNodeChildren(node);
    if (!children.length) {
      const text = readNodeText(node).trim();
      if (text) {
        lines.push(escapeMarkdownInline(text));
      }
      continue;
    }
    writeBranchNode(node, 1, lines);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
};

export const appendManifestFieldToMarkdown = (markdownText: string, manifestBase64?: string): string => {
  const body = markdownText.replace(/\s+$/, '');
  if (!manifestBase64 || !manifestBase64.trim()) {
    return body;
  }
  const manifestLine = `${DOCUMENT_MANIFEST_FIELD}: ${manifestBase64.trim()}`;
  return body ? `${body}\n\n${manifestLine}` : manifestLine;
};

export const extractMarkdownManifestField = (contents: string): string | undefined => {
  const lines = contents.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const manifestPrefix = `${DOCUMENT_MANIFEST_FIELD}:`;
  for (let index = lines.length - 1; index >= 0; index--) {
    const trimmedLine = lines[index].trim();
    if (!trimmedLine) {
      continue;
    }
    if (!trimmedLine.startsWith(manifestPrefix)) {
      return undefined;
    }
    return trimmedLine.slice(manifestPrefix.length).trim() || undefined;
  }
  return undefined;
};

export const readMarkdownManifest = (contents: string): DocumentManifest | null => {
  return readDocumentManifestBase64(extractMarkdownManifestField(contents));
};

export const parseMarkdownDocumentToMindForAIData = (contents: string): MindForAIExportedData => {
  const data = parseMarkdownToMindForAI(contents);
  const manifest = extractMarkdownManifestField(contents);
  if (manifest) {
    data.manifest = manifest;
  }
  return data;
};
