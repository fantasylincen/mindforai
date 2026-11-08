// 声明 MindForAI 与 Node 类的 TypeScript 类型
import type {
  MindForAINodeData,
  MindForAIBranchNodeData,
  MindForAIParseResult,
} from './types';

export declare class MindForAIError extends Error {}
export declare class ParseError extends MindForAIError {}

export declare class Node {
  constructor(text?: string, branch?: boolean);
  text: string;
  readonly parent: Node | null;
  readonly isBranch: boolean;
  readonly children: Node[];
  readonly childCount: number;
  readonly descendants: Node[];
  get(index: number): Node;
  add(node: Node | string): Node;
  insert(node: Node | string, index: number): Node;
  remove(target: Node | number): Node;
  clear(): void;
  indexOf(target: Node): number;
  mindForAIText(): string;
  toData(): MindForAINodeData;
}

export declare class MindForAI {
  constructor(rootText?: string, version?: number);
  root: Node;
  version: number;
  manifest: string | null;
  load(path: string): this;
  loadText(contents: string): this;
  save(path: string): void;
  mindForAIText(): string;
  contentData(): MindForAIBranchNodeData[];
}

export declare function serializeDocument(
  content: MindForAINodeData[],
  version?: number,
  manifest?: string | null
): string;

export declare function parseText(contents: string): MindForAIParseResult;
export declare function parseOrRaise(contents: string): MindForAIParseResult['data'];
