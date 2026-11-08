// 实现思维导图节点树及其增删查改与文本导出
import { MindForAIError } from './errors.js';
import { serializeDocument } from './parser.js';

export class Node {
  constructor(text = '', branch = false) {
    this._text = typeof text === 'string' ? text : String(text);
    this._branch = Boolean(branch);
    this._children = [];
    this._parent = null;
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this._text = typeof value === 'string' ? value : String(value);
  }

  get parent() {
    return this._parent;
  }

  get isBranch() {
    return this._branch || this._children.length > 0;
  }

  get children() {
    return this._children.slice();
  }

  get childCount() {
    return this._children.length;
  }

  get descendants() {
    const result = [];
    for (const child of this._children) {
      result.push(child);
      result.push(...child.descendants);
    }
    return result;
  }

  get(index) {
    if (!Number.isInteger(index)) {
      throw new MindForAIError('index must be an integer');
    }
    if (index < 0 || index >= this._children.length) {
      throw new RangeError('child index out of range');
    }
    return this._children[index];
  }

  add(node) {
    return this.insert(node, this._children.length);
  }

  insert(node, index) {
    const target = coerceNode(node);
    let position = Number.isInteger(index) ? index : this._children.length;
    if (position < 0) {
      position = 0;
    }
    if (position > this._children.length) {
      position = this._children.length;
    }
    if (target === this) {
      throw new MindForAIError('cannot insert a node into itself');
    }
    if (this.isAncestorOf(target)) {
      throw new MindForAIError('cannot insert an ancestor node as a child');
    }
    if (target._parent) {
      target._parent.detach(target);
    }
    this._children.splice(position, 0, target);
    target._parent = this;
    return target;
  }

  remove(target) {
    if (Number.isInteger(target)) {
      if (target < 0 || target >= this._children.length) {
        throw new RangeError('child index out of range');
      }
      const removed = this._children.splice(target, 1)[0];
      removed._parent = null;
      return removed;
    }
    if (!(target instanceof Node)) {
      throw new MindForAIError('remove requires a Node or an index');
    }
    const position = this._children.indexOf(target);
    if (position < 0) {
      throw new MindForAIError('node is not a child of this node');
    }
    return this.detach(target);
  }

  clear() {
    for (const child of this._children) {
      child._parent = null;
    }
    this._children = [];
  }

  indexOf(target) {
    if (!(target instanceof Node)) {
      throw new MindForAIError('indexOf requires a Node');
    }
    return this._children.indexOf(target);
  }

  mindForAIText() {
    return serializeDocument([this.toData()]);
  }

  toData() {
    if (!this._branch && !this._children.length) {
      return this._text;
    }
    return { text: this._text, children: this._children.map((child) => child.toData()) };
  }

  detach(target) {
    const position = this._children.indexOf(target);
    if (position < 0) {
      return target;
    }
    const removed = this._children.splice(position, 1)[0];
    removed._parent = null;
    return removed;
  }

  isAncestorOf(node) {
    let current = this;
    while (current) {
      if (current === node) {
        return true;
      }
      current = current._parent;
    }
    return false;
  }
}

function coerceNode(node) {
  if (node instanceof Node) {
    return node;
  }
  if (typeof node === 'string') {
    return new Node(node);
  }
  throw new MindForAIError('child must be a Node or a string');
}

export function buildNodes(content) {
  return content.map((item) => buildNode(item));
}

function buildNode(item) {
  if (typeof item === 'string') {
    return new Node(item, false);
  }
  if (item && typeof item === 'object') {
    const node = new Node(typeof item.text === 'string' ? item.text : '', true);
    for (const child of item.children || []) {
      const built = buildNode(child);
      node._children.push(built);
      built._parent = node;
    }
    return node;
  }
  return new Node(String(item));
}

export { coerceNode };
