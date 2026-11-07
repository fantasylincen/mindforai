// 为支持的文件格式提供轻量级逐行语法着色
import type { DocumentFormat } from '../../data/types';

export type DocumentTokenType =
  | 'plain'
  | 'key'
  | 'value'
  | 'number'
  | 'boolean'
  | 'string'
  | 'punctuation'
  | 'marker';

export type DocumentToken = {
  text: string;
  type: DocumentTokenType;
};

const pushPlain = (tokens: DocumentToken[], text: string) => {
  if (text) {
    tokens.push({ text, type: 'plain' });
  }
};

const tokenizeJsonLine = (line: string): DocumentToken[] => {
  const tokens: DocumentToken[] = [];
  const pattern =
    /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}[\],:]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    pushPlain(tokens, line.slice(lastIndex, match.index));
    const value = match[0];
    if (value.startsWith('"')) {
      const nextMatch = /^\s*:/.exec(line.slice(match.index + value.length));
      tokens.push({ text: value, type: nextMatch ? 'key' : 'string' });
    } else if (value === 'true' || value === 'false' || value === 'null') {
      tokens.push({ text: value, type: 'boolean' });
    } else if (/^-?\d/.test(value)) {
      tokens.push({ text: value, type: 'number' });
    } else {
      tokens.push({ text: value, type: 'punctuation' });
    }
    lastIndex = match.index + value.length;
  }
  pushPlain(tokens, line.slice(lastIndex));
  return tokens;
};

const tokenizeMindForAITextLine = (line: string): DocumentToken[] => {
  const headerMatch = /^(\s*)(type:|version:|content(?:\[\d+\])?:|children(?:\[\d+\])?:)(.*)$/.exec(
    line
  );
  if (headerMatch) {
    return [
      { text: headerMatch[1], type: 'plain' },
      { text: headerMatch[2], type: 'key' },
      { text: headerMatch[3], type: 'value' },
    ];
  }
  const textItemMatch = /^(\s*)(- )(text:)(.*)$/.exec(line);
  if (textItemMatch) {
    return [
      { text: textItemMatch[1], type: 'plain' },
      { text: textItemMatch[2], type: 'marker' },
      { text: textItemMatch[3], type: 'key' },
      { text: textItemMatch[4], type: 'value' },
    ];
  }
  const itemMatch = /^(\s*)(- )(.*)$/.exec(line);
  if (itemMatch) {
    return [
      { text: itemMatch[1], type: 'plain' },
      { text: itemMatch[2], type: 'marker' },
      { text: itemMatch[3], type: 'value' },
    ];
  }
  return [{ text: line, type: 'plain' }];
};

export const tokenizeDocumentLine = (
  line: string,
  format: DocumentFormat | null
): DocumentToken[] => {
  const tokens = format === 'drawnixlite' ? tokenizeJsonLine(line) : tokenizeMindForAITextLine(line);
  return tokens.filter((token) => token.text.length > 0);
};
