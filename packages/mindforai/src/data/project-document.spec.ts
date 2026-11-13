// 校验仓库根目录的设计文档 project.mindforai 与内嵌 manifest 保持一致
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMindForAIText } from './mindforai-text';
import { readDocumentManifestBase64 } from './document-manifest';

const DOCUMENT_PATH = resolve(__dirname, '../../../../project.mindforai');

const readProjectDocument = () => {
  const content = readFileSync(DOCUMENT_PATH, 'utf8');
  const manifestLine = content.split('\n').find((line) => line.startsWith('manifest: '));
  const body = manifestLine
    ? content.slice(0, content.lastIndexOf(manifestLine)).replace(/\n+$/, '')
    : content;
  const manifestBase64 = manifestLine ? manifestLine.slice('manifest: '.length).trim() : '';
  return { body, manifestBase64 };
};

const countNodes = (nodes: unknown[]): number => {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    const children = (node as { children?: unknown[] }).children;
    if (Array.isArray(children)) {
      total += countNodes(children);
    }
  }
  return total;
};

describe('project.mindforai 设计文档', () => {
  it('正文可被解析为 mindforai 文本树', () => {
    const { body } = readProjectDocument();
    const parsed = parseMindForAIText(body);

    expect(parsed).not.toBeNull();
    expect(parsed!.content.length).toBeGreaterThan(0);
  });

  it('内嵌 manifest 可解码且节点数量与正文一致', () => {
    const { body, manifestBase64 } = readProjectDocument();
    const parsed = parseMindForAIText(body);
    const manifest = readDocumentManifestBase64(manifestBase64);

    expect(manifestBase64.length).toBeGreaterThan(0);
    expect(manifest).not.toBeNull();
    expect(manifest!.document).toBe('project.mindforai');
    expect(manifest!.nodes.length).toBe(countNodes(parsed!.content));
  });
});
