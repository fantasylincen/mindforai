// 实现 MindForAI 文档的加载、保存与根节点访问
import { readFileSync, writeFileSync } from 'node:fs';
import { Node, buildNodes } from './node';
import { parseOrRaise, serializeDocument } from './parser';
import { MindForAIError } from './errors';
import type { MindForAINodeData } from './types';

export class MindForAI {
  private _root: Node;
  private _version: number;
  private _manifest: string | null;

  constructor(rootText = '', version = 1) {
    this._root = new Node(rootText, true);
    this._version = version;
    this._manifest = null;
  }

  get root(): Node {
    return this._root;
  }

  set root(node: Node) {
    if (!(node instanceof Node)) {
      throw new MindForAIError('root must be a Node');
    }
    this._root = node;
  }

  get version(): number {
    return this._version;
  }

  set version(value: number) {
    this._version = Number(value);
  }

  get manifest(): string | null {
    return this._manifest;
  }

  set manifest(value: string | null) {
    this._manifest = value || null;
  }

  load(path: string): this {
    return this.loadText(readFileSync(path, 'utf8'));
  }

  loadText(contents: string): this {
    const data = parseOrRaise(contents);
    this._version = typeof data.version === 'number' ? data.version : 1;
    this._manifest = data.manifest || null;
    const nodes = buildNodes(Array.isArray(data.content) ? data.content : []);
    let root: Node;
    if (nodes.length === 1 && (nodes[0].isBranch || nodes[0].childCount > 0)) {
      root = nodes[0];
    } else {
      root = new Node('', true);
      for (const node of nodes) {
        root.attach(node);
      }
    }
    this._root = root;
    return this;
  }

  save(path: string): void {
    writeFileSync(path, this.mindForAIText(), 'utf8');
  }

  mindForAIText(): string {
    return serializeDocument(this.contentData(), this._version, this._manifest);
  }

  contentData(): MindForAINodeData[] {
    if (this._root.isBranch || this._root.childCount > 0) {
      return [this._root.toData()];
    }
    return [];
  }
}
