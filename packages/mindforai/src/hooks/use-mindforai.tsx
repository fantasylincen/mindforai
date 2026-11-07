// 定义 MindForAI 的 React 上下文、工具状态与文档状态
import { PlaitBoard, PlaitPointerType } from '@plait/core';
import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import { MindPointerType } from '@plait/mind';
import { ArrowLineShape, BasicShapes, DrawPointerType } from '@plait/draw';
import { Editor } from 'slate';
import { LinkElement } from '@plait/common';
import { MindForAIFileHandle } from '../data/json';
import type { MindForAIToastOptions } from '../components/toast/toast';
import type { InvalidDocumentState } from '../data/document-load';
import type { Language } from '../i18n/types';

export type MindForAIPointerType = PlaitPointerType | MindPointerType | DrawPointerType;

export type MindForAIToolState = {
  pointer: MindForAIPointerType;
  lastShapePointer: DrawPointerType;
  lastArrowPointer: ArrowLineShape;
};

export const createDefaultToolState = (): MindForAIToolState => ({
  pointer: PlaitPointerType.selection,
  lastShapePointer: BasicShapes.rectangle,
  lastArrowPointer: ArrowLineShape.straight,
});

export const mergeToolState = (toolState?: Partial<MindForAIToolState>): MindForAIToolState => ({
  ...createDefaultToolState(),
  ...toolState,
});

export interface MindForAIBoard extends PlaitBoard {
  appState: MindForAIState;
  showToast?: (toast: MindForAIToastOptions) => void;
  setMindForAIAppState?: Dispatch<SetStateAction<MindForAIState>>;
}

export type LinkState = {
  targetDom: HTMLElement;
  editor: Editor;
  targetElement: LinkElement;
  isEditing: boolean;
  isHovering: boolean;
  isHoveringOrigin: boolean;
};

export type MindForAIState = {
  toolState: MindForAIToolState;
  isMobile: boolean;
  fileHandle: MindForAIFileHandle;
  filePath: string | null;
  isDirty: boolean;
  openCleanConfirm: boolean;
  invalidDocument?: InvalidDocumentState | null;
  exportTransparent: boolean;
  linkState?: LinkState | null;
  autoSave?: boolean;
  editingDocument?: boolean;
  openSearch?: boolean;
  openHelp?: boolean;
  language?: Language | null;
};

export const MindForAIContext = createContext<{
  appState: MindForAIState;
  setAppState: Dispatch<SetStateAction<MindForAIState>>;
  showToast: (toast: MindForAIToastOptions) => void;
  openNewWindow: () => void;
} | null>(null);

export const useMindForAI = (): {
  appState: MindForAIState;
  setAppState: Dispatch<SetStateAction<MindForAIState>>;
  showToast: (toast: MindForAIToastOptions) => void;
  openNewWindow: () => void;
} => {
  const context = useContext(MindForAIContext);

  if (!context) {
    throw new Error(
      `The \`useMindForAI\` hook must be used inside the <MindForAI> component's context.`
    );
  }

  return context;
};
