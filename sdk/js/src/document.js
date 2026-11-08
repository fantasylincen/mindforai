// 实现 MindForAI 文档的加载、保存与根节点访问
import { readFileSync, writeFileSync } from 'node:fs';
import { Node, buildNodes } from './node.js';
import { parseOrRaise, serializeDocument } from './parser.js';
import { MindForAIError } from './errors.js';

export class MindForAI {
  constructor(rootText = '', version = 1) {
    this._root = new Node(rootText, true);
    this._version = version;
    this._manifest = null;
  }

  get root() {
    return this._root;
  }

  set root(node) {
    if (!(node instanceof Node)) {
      throw new MindForAIError('root must be a Node');
    }
    this._root = node;
  }

  get version() {
    return this._version;
  }

  set version(value) {
    this._version = Number(value);
  }

  get manifest() {
    return this._manifest;
  }

  set manifest(value) {
    this._manifest = value || null;
  }

  load(path) {
    return this.loadText(readFileSync(path, 'utf8'));
  }

  loadText(contents) {
    const data = parseOrRaise(contents);
    this._version = typeof data.version === 'number' ? data.version : 1;
    this._manifest = data.manifest || null;
    const nodes = buildNodes(Array.isArray(data.content) ? data.content : []);
    let root;
    if (nodes.length === 1 && (nodes[0].isBranch || nodes[0].childCount > 0)) {
      root = nodes[0];
    } else {
      root = new Node('', true);
      for (const node of nodes) {
        root.insert(node, root.childCount);
      }
    }
    this._root = root;
    return this;
  }

  save(path) {
    writeFileSync(path, this.mindForAIText(), 'utf8');
  }

  mindForAIText() {
    return serializeDocument(this.contentData(), this._version, this._manifest);
  }

  contentData() {
    if (this._root.isBranch || this._root.childCount > 0) {
      return [this._root.toData()];
    }
    return [];
  }
}
