// 实现 .toon 文本的转义、序列化与解析
import { ParseError } from './errors.js';

export const INDENT_UNIT = '  ';
export const MANIFEST_FIELD = 'manifest';

function escapeText(text) {
  let escaped = '';
  for (const character of text) {
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
}

function unescapeText(text) {
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
}

function decodeValue(rawValue) {
  if (rawValue.length >= 2 && rawValue.startsWith('"') && rawValue.endsWith('"')) {
    return unescapeText(rawValue.slice(1, -1));
  }
  return unescapeText(rawValue);
}

function serializeNodeLines(node, depth, lines) {
  const indent = INDENT_UNIT.repeat(depth);
  if (typeof node === 'string') {
    const escapedText = escapeText(node);
    lines.push(
      escapedText.startsWith('text:') ? `${indent}- text: ${escapedText}` : `${indent}- ${escapedText}`
    );
    return;
  }
  const text = node && typeof node.text === 'string' ? node.text : '';
  const escapedText = escapeText(text);
  lines.push(escapedText ? `${indent}- text: ${escapedText}` : `${indent}- text:`);
  const children = node && Array.isArray(node.children) ? node.children : [];
  if (!children.length) {
    return;
  }
  lines.push(`${indent}${INDENT_UNIT}children[${children.length}]:`);
  for (const child of children) {
    serializeNodeLines(child, depth + 2, lines);
  }
}

export function serializeDocument(content, version = 1, manifest = null) {
  const nodes = Array.isArray(content) ? content : [];
  const lines = ['type: toon', `version: ${version}`];
  if (!nodes.length) {
    lines.push('content: []');
    if (typeof manifest === 'string' && manifest.trim()) {
      lines.push(`${MANIFEST_FIELD}: ${manifest.trim()}`);
    }
    return lines.join('\n');
  }
  lines.push(`content[${nodes.length}]:`);
  for (const node of nodes) {
    serializeNodeLines(node, 1, lines);
  }
  if (typeof manifest === 'string' && manifest.trim()) {
    lines.push(`${MANIFEST_FIELD}: ${manifest.trim()}`);
  }
  return lines.join('\n');
}

function countIndent(line) {
  const match = /^ */.exec(line);
  return match ? match[0].length : 0;
}

function findNextContentLine(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index++) {
    if (lines[index].trim()) {
      return index;
    }
  }
  return -1;
}

function matchChildrenHeader(headerLine) {
  const match = /^children(?:\[(\d+)\])?:\s*(.*)$/.exec(headerLine);
  if (!match) {
    return null;
  }
  return [match[1] ? Number(match[1]) : null, match[2]];
}

function matchContentHeader(headerLine) {
  const match = /^content(?:\[(\d+)\])?:\s*(.*)$/.exec(headerLine);
  if (!match) {
    return null;
  }
  return [match[1] ? Number(match[1]) : null, match[2]];
}

function parseNodeList(lines, startIndex, listIndent, issues) {
  const nodes = [];
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
      issues.push({ line: index + 1, column: indent + 1, code: 'invalidIndent' });
      index++;
      continue;
    }
    const itemText = line.slice(indent);
    if (!itemText.startsWith('- ') && itemText !== '-') {
      issues.push({ line: index + 1, column: indent + 1, code: 'invalidListItem' });
      index++;
      continue;
    }
    const body = itemText === '-' ? '' : itemText.slice(2);
    const nextContentIndex = findNextContentLine(lines, index + 1);
    const nextIndent = nextContentIndex >= 0 ? countIndent(lines[nextContentIndex]) : -1;
    if (!(nextContentIndex >= 0 && nextIndent > indent)) {
      let rawText = body;
      if (body === 'text:') {
        rawText = '';
      } else if (body.startsWith('text: ')) {
        rawText = body.slice(6);
      }
      nodes.push(decodeValue(rawText));
      index++;
      continue;
    }
    if (!(body === 'text:' || body.startsWith('text: '))) {
      issues.push({ line: nextContentIndex + 1, column: 1, code: 'unexpectedChildLine' });
      nodes.push(decodeValue(body));
      index++;
      continue;
    }
    const rawText = body === 'text:' ? '' : body.slice(6);
    const childHeaderLine = lines[nextContentIndex].trim();
    const childHeaderMatch = matchChildrenHeader(childHeaderLine);
    if (!childHeaderMatch || childHeaderMatch[1]) {
      issues.push({
        line: nextContentIndex + 1,
        column: 1,
        code: childHeaderMatch ? 'inlineChildrenContent' : 'invalidChildrenHeader',
      });
      nodes.push(decodeValue(rawText));
      index = nextContentIndex;
      continue;
    }
    const expectedChildCount = childHeaderMatch[0];
    const childrenHeaderIndent = nextIndent;
    const firstChildIndex = findNextContentLine(lines, nextContentIndex + 1);
    let children = [];
    let nextIndex = nextContentIndex + 1;
    if (firstChildIndex >= 0 && countIndent(lines[firstChildIndex]) > childrenHeaderIndent) {
      const childList = parseNodeList(lines, firstChildIndex, countIndent(lines[firstChildIndex]), issues);
      children = childList.nodes;
      nextIndex = childList.nextIndex;
    }
    if (expectedChildCount !== null && children.length !== expectedChildCount) {
      issues.push({ line: nextContentIndex + 1, column: 1, code: 'childrenCountMismatch' });
    }
    nodes.push({ text: decodeValue(rawText), children });
    index = nextIndex;
  }
  return { nodes, nextIndex: index };
}

function buildData(content, version, manifest) {
  const data = { type: 'toon', version, content };
  if (manifest) {
    data.manifest = manifest;
  }
  return data;
}

export function parseText(contents) {
  const rawLines = contents.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const manifestPrefix = `${MANIFEST_FIELD}:`;
  let manifest = null;
  const lines = [];
  for (const line of rawLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(manifestPrefix)) {
      const value = trimmedLine.slice(manifestPrefix.length).trim();
      manifest = value || null;
      continue;
    }
    lines.push(line);
  }
  const issues = [];
  let isMindForAIDocument = false;
  let hasTypeDeclaration = false;
  let version = 1;
  let contentIndex = -1;
  let contentIndent = 0;
  let expectedContentCount = null;
  for (let index = 0; index < lines.length; index++) {
    const trimmedLine = lines[index].trim();
    if (!trimmedLine) {
      continue;
    }
    if (trimmedLine.startsWith('type:')) {
      hasTypeDeclaration = true;
      if (trimmedLine === 'type: toon' || trimmedLine === 'type: mindforai') {
        isMindForAIDocument = true;
      } else {
        issues.push({ line: index + 1, column: 1, code: 'invalidType' });
      }
      continue;
    }
    if (trimmedLine.startsWith('version:')) {
      const rawVersion = Number(trimmedLine.slice('version:'.length).trim());
      if (Number.isFinite(rawVersion) && rawVersion > 0 && Number.isInteger(rawVersion)) {
        version = rawVersion;
      } else {
        issues.push({ line: index + 1, column: 1, code: 'invalidVersion' });
      }
      continue;
    }
    const contentMatch = matchContentHeader(trimmedLine);
    if (contentMatch) {
      contentIndex = index;
      contentIndent = countIndent(lines[index]);
      expectedContentCount = contentMatch[0];
      if (contentMatch[1] === '[]') {
        if (isMindForAIDocument && !issues.length) {
          return { data: buildData([], version, manifest), issues: [] };
        }
        return { data: null, issues };
      }
      if (contentMatch[1]) {
        issues.push({ line: index + 1, column: 1, code: 'invalidContentLine' });
        return { data: null, issues };
      }
      break;
    }
    issues.push({ line: index + 1, column: 1, code: 'unexpectedLine' });
  }
  if (!hasTypeDeclaration) {
    issues.push({ line: 1, column: 1, code: 'missingType' });
  }
  if (contentIndex < 0) {
    issues.push({ line: Math.max(1, lines.length), column: 1, code: 'missingContent' });
    return { data: null, issues };
  }
  const firstContentIndex = findNextContentLine(lines, contentIndex + 1);
  if (firstContentIndex < 0) {
    if (expectedContentCount !== null && expectedContentCount !== 0) {
      issues.push({ line: contentIndex + 1, column: 1, code: 'contentCountMismatch' });
    }
    if (!issues.length && isMindForAIDocument) {
      return { data: buildData([], version, manifest), issues: [] };
    }
    return { data: null, issues };
  }
  if (countIndent(lines[firstContentIndex]) <= contentIndent) {
    issues.push({ line: firstContentIndex + 1, column: 1, code: 'invalidIndent' });
    return { data: null, issues };
  }
  const parsedList = parseNodeList(lines, firstContentIndex, countIndent(lines[firstContentIndex]), issues);
  if (expectedContentCount !== null && parsedList.nodes.length !== expectedContentCount) {
    issues.push({ line: contentIndex + 1, column: 1, code: 'contentCountMismatch' });
  }
  const trailingIndex = findNextContentLine(lines, parsedList.nextIndex);
  if (trailingIndex >= 0) {
    issues.push({ line: trailingIndex + 1, column: 1, code: 'unexpectedLine' });
  }
  if (issues.length || !isMindForAIDocument) {
    return { data: null, issues };
  }
  return { data: buildData(parsedList.nodes, version, manifest), issues: [] };
}

export function parseOrRaise(contents) {
  const result = parseText(contents);
  if (!result.data) {
    const first = result.issues[0];
    if (first) {
      throw new ParseError(`${first.code} at line ${first.line}, column ${first.column}`);
    }
    throw new ParseError('invalid mindforai document');
  }
  return result.data;
}
