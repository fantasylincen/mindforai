// 校验节点复制以 mindforai 文本写入剪贴板并可粘贴为子节点
import { copyNodeAsMindForAIText, pasteNodesAsChildren, readClipboardNodeElements } from './node-clipboard';
import { PlaitBoard } from '@plait/core';

const writeText = (text: string) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (value: string) => (text = value), readText: async () => text },
  });
  return () => text;
};

const mindElement = {
  id: 'root',
  type: 'mind',
  points: [[0, 0]],
  data: { topic: { type: 'paragraph', children: [{ text: 'Root' }] } },
  children: [],
} as any;

describe('node clipboard', () => {
  it('writes mindforai text that can be read back as elements', async () => {
    const getText = writeText('');
    await copyNodeAsMindForAIText([mindElement]);
    const text = getText();
    expect(text.startsWith('type: mindforai')).toBe(true);
    const elements = await readClipboardNodeElements();
    expect(elements).toHaveLength(1);
    expect(elements?.[0].type).toBe('mind');
  });

  it('ignores clipboard text that is not a mindforai document', async () => {
    writeText('plain text');
    expect(await readClipboardNodeElements()).toBeNull();
  });

  it('refuses to paste when the parent is not a mind element', () => {
    const board = {
      children: [{ id: 'shape', type: 'geometry', points: [] }],
    } as unknown as PlaitBoard;
    expect(pasteNodesAsChildren(board, [0], [mindElement])).toBe(false);
  });
});
