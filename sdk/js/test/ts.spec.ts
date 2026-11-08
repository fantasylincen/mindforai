// 校验 TypeScript 版本的文档库行为
import { Node, MindForAI } from '../src/index';
import { parseOrRaise, serializeDocument } from '../src/parser';

const TEMPLATE = process.cwd() + '/../../templates/Templets.mindforai';

describe('mindforai sdk typescript', () => {
  it('loads and round trips a real document', () => {
    const doc = new MindForAI();
    doc.load(TEMPLATE);
    expect(doc.root.childCount).toBe(4);
    const text = doc.root.mindForAIText();
    expect(new MindForAI().loadText(text).mindForAIText()).toBe(text);
  });

  it('supports node editing', () => {
    const root = new Node('root', true);
    const child = root.add(new Node('child'));
    root.insert('first', 0);
    expect(root.children.map((item) => item.text)).toEqual(['first', 'child']);
    expect(root.remove(child)).toBe(child);
    expect(root.childCount).toBe(1);
    expect(child.parent).toBeNull();
  });

  it('keeps special characters round trippable', () => {
    const text = serializeDocument([{ text: 'a\nb', children: ['x: y', '  spaced', '"q"'] }]);
    expect(serializeDocument(parseOrRaise(text).content)).toBe(text);
  });
});
