import { describe, expect, it } from 'vitest';
import { MindLayoutType } from '@plait/layouts';
import type { LoadedDocumentFile } from './document-load';
import { mergeLoadedDocumentsIntoMindMap } from './document-merge';
import type { DocumentExportedData } from './types';

const buildMind = (text: string) => ({
  id: `root-${text}`,
  type: 'mind' as const,
  layout: MindLayoutType.right,
  points: [[0, 0]] as [[number, number]],
  data: { topic: { children: [{ text }], type: 'paragraph' } },
  children: [],
});

const buildLoaded = (name: string, rootText: string): LoadedDocumentFile => {
  const data: DocumentExportedData = {
    elements: [buildMind(rootText)] as never,
    viewport: { zoom: 1 },
  };
  return {
    ok: true,
    data,
    file: new File(['{}'], name),
    filePath: name,
  };
};

const readRootText = (element: any): string => element.data.topic.children[0].text;

describe('mergeLoadedDocumentsIntoMindMap', () => {
  it('returns the original data when only one file is provided', () => {
    const loaded = buildLoaded('alpha.mindforai', 'Alpha');
    const merged = mergeLoadedDocumentsIntoMindMap([loaded]);
    expect(merged?.elements).toHaveLength(1);
    expect(readRootText(merged?.elements[0])).toBe('Alpha');
  });

  it('merges multiple files into one root with per-file branches', () => {
    const loaded = [
      buildLoaded('alpha.mindforai', 'Alpha Root'),
      buildLoaded('beta.drawnixlite', 'Beta Root'),
    ];
    const merged = mergeLoadedDocumentsIntoMindMap(loaded);
    expect(merged?.elements).toHaveLength(1);
    const root = merged?.elements[0] as any;
    expect(root.type).toBe('mind');
    expect(root.children).toHaveLength(2);
    expect(readRootText(root.children[0])).toBe('alpha');
    expect(readRootText(root.children[1])).toBe('beta');
    expect(readRootText(root.children[0].children[0])).toBe('Alpha Root');
    expect(readRootText(root.children[1].children[0])).toBe('Beta Root');
  });

  it('ignores failed loads and returns null when nothing is valid', () => {
    const invalid: LoadedDocumentFile = {
      ok: false,
      file: new File(['x'], 'bad.mindforai'),
      filePath: 'bad.mindforai',
      format: 'mindforai',
      contents: 'bad',
      issues: [],
    };
    expect(mergeLoadedDocumentsIntoMindMap([invalid])).toBeNull();
  });
});
