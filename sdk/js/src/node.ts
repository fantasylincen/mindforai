// 实现思维导图节点树及其增删查改与文本导出
import { MindForAIError } from './errors';
import { serializeDocument } from './parser';
import type { MindForAINodeData } from './types';

export class Node {
  private _text: string;
  private _branch: boolean;
  private _children: Node[];
  private _parent: Node | null;

  constructor(text = '', branch = false) {
    this._text = typeof text === 'string' ? text : String(text);
    this._branch = Boolean(branch);
    this._children = [];
    this._parent = null;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = typeof value === 'string' ? value : String(value);
  }

  get parent(): Node | null {
    return this._parent;
  }

  get isBranch(): boolean {
    return this._branch || this._children.length > 0;
  }

  get children(): Node[] {
    return this._children.slice();
  }

  get childCount(): number {
    return this._children.length;
  }

  get descendants(): Node[] {
    const result: Node[] = [];
    for (const child of this._children) {
      result.push(child);
      result.push(...child.descendants);
    }
    return result;
  }

  get(index: number): Node {
    if (!Number.isInteger(index)) {
      throw new MindForAIError('index must be an integer');
    }
    if (index < 0 || index >= this._children.length) {
      throw new RangeError('child index out of range');
    }
    return this._children[index];
  }

  add(node: Node | string): Node {
    return this.insert(node, this._children.length);
  }

  insert(node: Node | string, index: number): Node {
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

  remove(target: Node | number): Node {
    if (typeof target === 'number') {
      if (!Number.isInteger(target) || target < 0 || target >= this._children.length) {
        throw new RangeError('child index out of range');
      }
      const removed = this._children.splice(target, 1)[0];
      removed._parent = null;
      return removed;
    }
    if (!(target instanceof Node)) {
      throw new MindForAIError('remove requires a Node or an index');
    }
    if (!this._children.includes(target)) {
      throw new MindForAIError('node is not a child of this node');
    }
    return this.detach(target);
  }

  clear(): void {
    for (const child of this._children) {
      child._parent = null;
    }
    this._children = [];
  }

  indexOf(target: Node): number {
    if (!(target instanceof Node)) {
      throw new MindForAIError('indexOf requires a Node');
    }
    return this._children.indexOf(target);
  }

  mindForAIText(): string {
    return serializeDocument([this.toData()]);
  }

  toData(): MindForAINodeData {
    if (!this._branch && !this._children.length) {
      return this._text;
    }
    return { text: this._text, children: this._children.map((child) => child.toData()) };
  }

  detach(target: Node): Node {
    const position = this._children.indexOf(target);
    if (position < 0) {
      return target;
    }
    const removed = this._children.splice(position, 1)[0];
    removed._parent = null;
    return removed;
  }

  isAncestorOf(node: Node): boolean {
    let current: Node | null = this as Node;
    while (current) {
      if (current === node) {
        return true;
      }
      current = current._parent;
    }
    return false;
  }

  attach(child: Node): void {
    this._children.push(child);
    child._parent = this;
  }
}

export function coerceNode(node: Node | string): Node {
  if (node instanceof Node) {
    return node;
  }
  if (typeof node === 'string') {
    return new Node(node);
  }
  throw new MindForAIError('child must be a Node or a string');
}

export function buildNodes(content: MindForAINodeData[]): Node[] {
  return content.map((item) => buildNode(item));
}

function buildNode(item: MindForAINodeData): Node {
  if (typeof item === 'string') {
    return new Node(item, false);
  }
  if (item && typeof item === 'object') {
    const node = new Node(typeof item.text === 'string' ? item.text : '', true);
    for (const child of item.children || []) {
      node.attach(buildNode(child));
    }
    return node;
  }
  return new Node(String(item));
}
