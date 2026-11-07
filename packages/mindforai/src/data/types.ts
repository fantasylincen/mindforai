// 定义文档格式、导出数据结构与节点类型
import { PlaitElement, PlaitTheme, Viewport } from '@plait/core';

export type SaveableDocumentFormat = 'mindforai' | 'drawnixlite' | 'markdown';

export type DocumentFormat = SaveableDocumentFormat;

export interface DocumentExportedData {
  elements: PlaitElement[];
  viewport: Viewport;
  theme?: PlaitTheme;
  manifest?: string;
}

export enum DocumentExportedType {
  drawnixlite = 'drawnixlite',
  mindforai = 'mindforai',
}

export type MindForAINode = string | MindForAIBranchNode;

export interface MindForAIBranchNode {
  text: string;
  children: MindForAINode[];
}

export interface MindForAIExportedData {
  type: DocumentExportedType.mindforai;
  version: number;
  content: MindForAINode[];
  manifest?: string;
}

export interface CompactDocumentNode {
  text?: string;
  children?: CompactDocumentNode[];
}

export interface CompactDocumentExportedData {
  type: DocumentExportedType.drawnixlite;
  version: number;
  content: CompactDocumentNode[];
  manifest?: string;
}
