// DESK-06 桌面版标签页数据模型：标签创建、标题计算、格式推断与序列化辅助
import {
  documentTextToInitialValue,
  resolveSaveableDocumentFormatByPath,
  serializeBoardDocumentText,
  type InitialDocumentValue,
} from '@mindforai/mindforai';
import type { PlaitBoard } from '@plait/core';

export type DesktopTab = {
  id: string;
  name: string;
  path: string;
  text: string;
  dirty: boolean;
  revision: number;
};

const UNTITLED_NAME = '未命名';
let tabSeed = 0;

const splitFileName = (filePath: string) => {
  const normalized = (filePath || '').split('\\').join('/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] || '';
};

export const createBlankTab = (): DesktopTab => {
  tabSeed += 1;
  return {
    id: `tab-${Date.now()}-${tabSeed}`,
    name: UNTITLED_NAME,
    path: '',
    text: '',
    dirty: false,
    revision: 0,
  };
};

export const createTabFromFile = (file: {
  name: string;
  path: string;
  text: string;
}): DesktopTab => {
  tabSeed += 1;
  return {
    id: `tab-${Date.now()}-${tabSeed}`,
    name: splitFileName(file.path) || file.name || UNTITLED_NAME,
    path: file.path || '',
    text: file.text || '',
    dirty: false,
    revision: 0,
  };
};

export const getTabTitle = (tab: DesktopTab) =>
  splitFileName(tab.path) || tab.name || UNTITLED_NAME;

export const getTabFormat = (tab: DesktopTab) =>
  resolveSaveableDocumentFormatByPath(tab.path || getTabTitle(tab));

export const getTabInitialValue = (tab: DesktopTab): InitialDocumentValue => {
  if (!tab.text.trim()) {
    return { elements: [], viewport: undefined, theme: undefined, language: undefined };
  }
  return (
    documentTextToInitialValue(tab.path || getTabTitle(tab), tab.text) || {
      elements: [],
      viewport: undefined,
      theme: undefined,
      language: undefined,
    }
  );
};

export const serializeTabBoard = (tab: DesktopTab, board: PlaitBoard | null): string => {
  if (!board) {
    return tab.text;
  }
  const text = serializeBoardDocumentText(board, getTabFormat(tab), tab.path || getTabTitle(tab));
  return text || tab.text;
};

export const getTabBaseName = (tab: DesktopTab) => {
  const title = getTabTitle(tab);
  return title.replace(/\.[^./\\]+$/, '') || UNTITLED_NAME;
};
