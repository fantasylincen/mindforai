// 将 Markdown 文档解析为 mindforai 树结构，支持标题层级、列表、引用、表格与代码块
import {
  DocumentExportedType,
  MindForAIBranchNode,
  MindForAIExportedData,
  MindForAINode,
} from './types';

export const MARKDOWN_FILE_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mdx'] as const;

const MARKDOWN_EXTENSION_SET = new Set<string>(MARKDOWN_FILE_EXTENSIONS);

type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; items: MarkdownListItem[] }
  | { kind: 'paragraph'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'table'; text: string };

interface MarkdownListItem {
  depth: number;
  text: string;
  children: MarkdownListItem[];
}

interface HeadingFrame {
  level: number;
  node: MindForAIBranchNode;
}

const HEADING_MATCH = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const FENCE_MATCH = /^([ \t]*)(```+|~~~+)(.*)$/;
const LIST_MATCH = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
const QUOTE_MATCH = /^[ \t]*>[ \t]?(.*)$/;
const TABLE_MATCH = /^[ \t]*\|.*\|[ \t]*$/;
const TABLE_DIVIDER_MATCH = /^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/;
const THEMATIC_BREAK_MATCH = /^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/;

export const isMarkdownFileName = (fileName: string): boolean => {
  const match = /\.([^.\\/]+)$/.exec(fileName || '');
  if (!match) {
    return false;
  }
  return MARKDOWN_EXTENSION_SET.has(match[1].toLowerCase());
};

const countIndentWidth = (value: string): number => {
  let width = 0;
  for (const character of value) {
    if (character === '\t') {
      width += 4;
    } else {
      width += 1;
    }
  }
  return width;
};

const cleanInlineMarkdown = (value: string): string => {
  let text = value.trim();
  if (!text) {
    return '';
  }
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_all, alt: string) => (alt ? `[图片] ${alt}` : '[图片]'));
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  text = text.replace(/<([a-zA-Z/][^>]*)>/g, '');
  text = text.replace(/`([^`]*)`/g, '$1');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/(^|[^*\w])\*([^*]+)\*(?!\*)/g, '$1$2');
  text = text.replace(/(^|[^_\w])_([^_]+)_(?!_)/g, '$1$2');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, '$1');
  text = text.replace(/[ \t]+/g, ' ');
  return text.trim();
};

const normalizeLooseLine = (line: string): string => {
  return line.replace(/\r$/, '').replace(/\t/g, '    ');
};

const parseListItems = (rawLines: string[]): MarkdownListItem[] => {
  const root: MarkdownListItem[] = [];
  const stack: MarkdownListItem[] = [];
  for (const rawLine of rawLines) {
    const line = normalizeLooseLine(rawLine);
    if (!line.trim() || THEMATIC_BREAK_MATCH.test(line)) {
      continue;
    }
    const match = LIST_MATCH.exec(line);
    if (match) {
      const depth = Math.floor(countIndentWidth(match[1]) / 2);
      const text = cleanInlineMarkdown(match[3]);
      const item: MarkdownListItem = { depth, text, children: [] };
      while (stack.length && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      if (stack.length) {
        stack[stack.length - 1].children.push(item);
      } else {
        root.push(item);
      }
      stack.push(item);
      continue;
    }
    if (!stack.length) {
      const text = cleanInlineMarkdown(line);
      if (text) {
        root.push({ depth: 0, text, children: [] });
      }
      continue;
    }
    const continuation = cleanInlineMarkdown(line);
    if (continuation) {
      const current = stack[stack.length - 1];
      current.text = current.text ? `${current.text} ${continuation}` : continuation;
    }
  }
  return root;
};

const parseMarkdownBlocks = (contents: string): MarkdownBlock[] => {
  const lines = contents.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    const fence = FENCE_MATCH.exec(line);
    if (fence) {
      const marker = fence[2][0];
      const codeLines: string[] = [];
      index++;
      while (index < lines.length) {
        const closing = lines[index].trim();
        if (closing.startsWith(marker.repeat(3))) {
          index++;
          break;
        }
        codeLines.push(lines[index]);
        index++;
      }
      const text = codeLines.join('\n').trim();
      if (text) {
        blocks.push({ kind: 'code', text });
      }
      continue;
    }
    const heading = HEADING_MATCH.exec(line);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: heading[1].length,
        text: cleanInlineMarkdown(heading[2]),
      });
      index++;
      continue;
    }
    if (THEMATIC_BREAK_MATCH.test(line)) {
      index++;
      continue;
    }
    const quote = QUOTE_MATCH.exec(line);
    if (quote) {
      const quoteLines: string[] = [];
      while (index < lines.length) {
        const matched = QUOTE_MATCH.exec(lines[index]);
        if (!matched) {
          break;
        }
        quoteLines.push(cleanInlineMarkdown(matched[1]));
        index++;
      }
      const text = quoteLines.filter((item) => item).join(' ');
      if (text) {
        blocks.push({ kind: 'quote', text });
      }
      continue;
    }
    if (TABLE_MATCH.test(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && TABLE_MATCH.test(lines[index])) {
        tableLines.push(lines[index]);
        index++;
      }
      blocks.push({ kind: 'table', text: tableLines.join('\n') });
      continue;
    }
    if (LIST_MATCH.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length) {
        const current = lines[index];
        if (
          !current.trim() ||
          (!LIST_MATCH.test(current) && !/^[ \t]{2,}\S/.test(current))
        ) {
          break;
        }
        listLines.push(current);
        index++;
      }
      const items = parseListItems(listLines);
      if (items.length) {
        blocks.push({ kind: 'list', items });
      }
      continue;
    }
    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index];
      if (!current.trim()) {
        break;
      }
      if (
        HEADING_MATCH.test(current) ||
        FENCE_MATCH.test(current) ||
        QUOTE_MATCH.test(current) ||
        TABLE_MATCH.test(current) ||
        LIST_MATCH.test(current) ||
        THEMATIC_BREAK_MATCH.test(current)
      ) {
        break;
      }
      paragraphLines.push(current.trim());
      index++;
    }
    const text = cleanInlineMarkdown(paragraphLines.join(' '));
    if (text) {
      blocks.push({ kind: 'paragraph', text });
    }
  }
  return blocks;
};

const listItemToNode = (item: MarkdownListItem): MindForAINode | null => {
  const children = item.children
    .map(listItemToNode)
    .filter((child): child is MindForAINode => child !== null);
  if (!item.text) {
    if (!children.length) {
      return null;
    }
    return children.length === 1 ? children[0] : { text: '', children };
  }
  if (!children.length) {
    return item.text;
  }
  return { text: item.text, children };
};

const formatTableRows = (tableText: string): string[] => {
  return tableText
    .split('\n')
    .map((row) => row.trim())
    .filter((row) => row && !TABLE_DIVIDER_MATCH.test(row))
    .map((row) =>
      row
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cleanInlineMarkdown(cell))
        .join(' | ')
    )
    .filter((row) => row);
};

const joinCodeLines = (code: string): string => code.replace(/\n/g, '\u23ce');

const applyBlocksToTree = (blocks: MarkdownBlock[]): MindForAINode[] => {
  const roots: MindForAINode[] = [];
  const headingStack: HeadingFrame[] = [];
  let container = roots;
  for (const block of blocks) {
    if (block.kind === 'heading') {
      while (headingStack.length && headingStack[headingStack.length - 1].level >= block.level) {
        headingStack.pop();
      }
      const node: MindForAIBranchNode = { text: block.text || '', children: [] };
      const parent = headingStack[headingStack.length - 1];
      if (parent) {
        parent.node.children.push(node);
      } else {
        roots.push(node);
      }
      headingStack.push({ level: block.level, node });
      container = node.children;
      continue;
    }
    if (block.kind === 'list') {
      const nodes = block.items
        .map(listItemToNode)
        .filter((item): item is MindForAINode => item !== null);
      if (nodes.length === 1) {
        container.push(nodes[0]);
      } else if (nodes.length > 1) {
        container.push({ text: '', children: nodes });
      }
      continue;
    }
    if (block.kind === 'paragraph') {
      container.push(block.text);
      continue;
    }
    if (block.kind === 'quote') {
      container.push({ text: `引用：${block.text}`, children: [] });
      continue;
    }
    if (block.kind === 'table') {
      const rows = formatTableRows(block.text);
      if (rows.length === 1) {
        container.push(rows[0]);
      } else if (rows.length > 1) {
        container.push({ text: '表格', children: rows });
      }
      continue;
    }
    if (block.kind === 'code') {
      container.push({ text: '代码块', children: [{ text: joinCodeLines(block.text), children: [] }] });
    }
  }
  return roots;
};

export const parseMarkdownToMindForAI = (contents: string): MindForAIExportedData => {
  const blocks = parseMarkdownBlocks(contents || '');
  const content = applyBlocksToTree(blocks);
  return {
    type: DocumentExportedType.mindforai,
    version: 1,
    content,
  };
};
