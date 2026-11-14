import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MindForAI, Node, ParseError, parseText, parseOrRaise, serializeDocument } from '../src/index.js';

const TEMPLATE = new URL('../../../templates/Templets.toon', import.meta.url).pathname;

test('loads a real document from file', () => {
  const doc = new MindForAI();
  doc.load(TEMPLATE);
  assert.equal(doc.version, 1);
  assert.equal(doc.root.childCount, 4);
  assert.ok(doc.root.descendants.length > 1000);
});

test('root accessor returns the root node', () => {
  const doc = new MindForAI();
  doc.load(TEMPLATE);
  assert.ok(doc.root instanceof Node);
  assert.ok(doc.root.isBranch);
});

test('serializes and re-parses without loss', () => {
  const doc = new MindForAI();
  doc.load(TEMPLATE);
  const text = doc.root.mindForAIText();
  const again = new MindForAI().loadText(text);
  assert.equal(again.mindForAIText(), text);
});

test('children returns a detached copy', () => {
  const root = new Node('root', true);
  const first = root.add(new Node('first'));
  const children = root.children;
  children.push(new Node('ghost'));
  assert.equal(root.childCount, 1);
  assert.equal(root.get(0), first);
});

test('childCount tracks add and remove', () => {
  const root = new Node('root', true);
  root.add('a');
  root.add('b');
  assert.equal(root.childCount, 2);
  root.remove(0);
  assert.equal(root.childCount, 1);
});

test('descendants lists every level in order', () => {
  const root = new Node('root', true);
  const a = root.add(new Node('a', true));
  a.add('a1');
  a.add('a2');
  root.add('b');
  assert.deepEqual(root.descendants.map((n) => n.text), ['a', 'a1', 'a2', 'b']);
});

test('get reads by index and rejects bad index', () => {
  const root = new Node('root', true);
  root.add('a');
  assert.equal(root.get(0).text, 'a');
  assert.throws(() => root.get(5), RangeError);
});

test('add appends at the end', () => {
  const root = new Node('root', true);
  root.add('a');
  const added = root.add('b');
  assert.equal(root.get(1), added);
});

test('insert places a node at the given index', () => {
  const root = new Node('root', true);
  root.add('a');
  root.add('c');
  root.insert('b', 1);
  assert.deepEqual(root.children.map((n) => n.text), ['a', 'b', 'c']);
});

test('insert clamps out-of-range indexes', () => {
  const root = new Node('root', true);
  root.add('a');
  root.insert('start', -5);
  root.insert('end', 99);
  assert.deepEqual(root.children.map((n) => n.text), ['start', 'a', 'end']);
});

test('remove returns the removed node by index', () => {
  const root = new Node('root', true);
  root.add('a');
  root.add('b');
  const removed = root.remove(0);
  assert.equal(removed.text, 'a');
  assert.equal(removed.parent, null);
  assert.deepEqual(root.children.map((n) => n.text), ['b']);
});

test('remove accepts a node instance', () => {
  const root = new Node('root', true);
  const a = root.add('a');
  root.add('b');
  assert.equal(root.remove(a), a);
  assert.deepEqual(root.children.map((n) => n.text), ['b']);
});

test('remove rejects unknown nodes', () => {
  const root = new Node('root', true);
  assert.throws(() => root.remove(new Node('x')));
});

test('text is readable and writable', () => {
  const node = new Node('old');
  assert.equal(node.text, 'old');
  node.text = 'new';
  assert.equal(node.text, 'new');
});

test('parent reflects tree position', () => {
  const root = new Node('root', true);
  const child = root.add('child');
  assert.equal(child.parent, root);
  root.remove(child);
  assert.equal(child.parent, null);
});

test('moving a node detaches it from its former parent', () => {
  const first = new Node('first', true);
  const second = new Node('second', true);
  const child = first.add('child');
  second.add(child);
  assert.equal(first.childCount, 0);
  assert.equal(second.get(0), child);
  assert.equal(child.parent, second);
});

test('insert rejects ancestor cycles', () => {
  const root = new Node('root', true);
  const child = root.add(new Node('child', true));
  assert.throws(() => child.add(root));
  assert.throws(() => root.add(root));
});

test('mindForAIText produces parseable standard text', () => {
  const node = new Node('root', true);
  const branch = node.add(new Node('branch', true));
  branch.add('leaf');
  const text = node.mindForAIText();
  assert.ok(text.startsWith('type: mindforai\nversion: 1\ncontent[1]:'));
  const data = parseOrRaise(text);
  assert.equal(data.content.length, 1);
});

test('special characters survive a round trip', () => {
  const root = new Node('root, with: symbols "x"', true);
  root.add(new Node('multi\nline', true)).add('text: x');
  root.add('  spaced');
  root.add('tab\there');
  const text = root.mindForAIText();
  const data = parseOrRaise(text);
  const roundTrip = serializeDocument(data.content);
  assert.equal(roundTrip, text);
});

test('manifest field is kept when serializing', () => {
  const text = serializeDocument(['root'], 1, 'QUJDREVG');
  assert.ok(text.endsWith('manifest: QUJDREVG'));
  const data = parseOrRaise(text);
  assert.equal(data.manifest, 'QUJDREVG');
});

test('empty document round trips', () => {
  const text = serializeDocument([], 1);
  assert.equal(text, 'type: mindforai\nversion: 1\ncontent: []');
  assert.deepEqual(parseOrRaise(text).content, []);
});

test('invalid documents report issues', () => {
  const result = parseText('content[1]: a');
  assert.equal(result.data, null);
  assert.ok(result.issues.length > 0);
});

test('parseOrRaise rejects invalid text with ParseError', () => {
  assert.throws(() => parseOrRaise('type: drawnix\nversion: 1'), ParseError);
});

test('child count mismatch is reported', () => {
  const text = 'type: mindforai\nversion: 1\ncontent[1]:\n  - text: root\n    children[3]:\n      - a';
  const result = parseText(text);
  assert.equal(result.data, null);
  assert.ok(result.issues.some((issue) => issue.code === 'childrenCountMismatch'));
});

test('crlf line endings are accepted', () => {
  const text = 'type: mindforai\r\nversion: 1\r\ncontent[1]:\r\n  - root';
  const data = parseOrRaise(text);
  assert.equal(data.content[0], 'root');
});
