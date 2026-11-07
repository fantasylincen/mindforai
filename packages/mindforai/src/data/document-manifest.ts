// DATA-19 生成与读取清单，记录节点样式、折叠状态、元数据、视口、主题与语言，并以 ZIP+Base64 内嵌到主文档
import { BoardTransforms, PlaitBoard, PlaitElement, ThemeColorMode, Viewport } from '@plait/core';
import { DOCUMENT_MANIFEST_TYPE, VERSIONS } from '../constants';
import { i18nInsidePlaitHook, setBoardLanguage } from '../i18n';
import type { Language } from '../i18n/types';
import { applyOpacityToHex, hexAlphaToOpacity, removeHexAlpha } from '../utils/color';
import {
  decodeDocumentManifestFromBase64,
  encodeDocumentManifestToBase64,
} from './document-manifest-embed';

export interface DocumentManifestNodeState {
  path: string;
  fill?: string | null;
  fillOpacity?: number;
  strokeColor?: string | null;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeStyle?: string;
  isCollapsed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DocumentManifest {
  type: typeof DOCUMENT_MANIFEST_TYPE;
  version: number;
  document?: string;
  viewport?: Viewport;
  theme?: string;
  language?: string;
  nodes: DocumentManifestNodeState[];
}

const STYLE_KEYS = ['fill', 'strokeColor', 'strokeWidth', 'strokeStyle', 'isCollapsed'] as const;
const METADATA_KEYS = [
  'type',
  'layout',
  'shape',
  'branchColor',
  'branchWidth',
  'branchShape',
  'manualWidth',
  'rightNodeCount',
  'start',
  'end',
] as const;
const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{3,8}$/;

const getColorOpacity = (color: string | null | undefined): number | undefined => {
  if (!color || !HEX_COLOR_PATTERN.test(color)) {
    return undefined;
  }
  return hexAlphaToOpacity(color);
};

const resolveManifestColor = (
  color: string | null | undefined,
  opacity: number | undefined
): string | null | undefined => {
  if (color === null || color === undefined) {
    return color;
  }
  if (opacity === undefined || !HEX_COLOR_PATTERN.test(color)) {
    return color;
  }
  const baseColor = removeHexAlpha(color);
  if (baseColor.replace('#', '').length !== 6) {
    return color;
  }
  if (opacity >= 100) {
    return baseColor;
  }
  return applyOpacityToHex(baseColor, opacity);
};

const collectNodeState = (
  element: PlaitElement,
  path: string
): DocumentManifestNodeState | null => {
  const record = element as unknown as Record<string, unknown>;
  const state: DocumentManifestNodeState = { path };
  let hasState = false;
  for (const key of STYLE_KEYS) {
    if (!(key in record) || record[key] === undefined) {
      continue;
    }
    (state as unknown as Record<string, unknown>)[key] = record[key];
    hasState = true;
  }
  if (typeof record.fill === 'string') {
    state.fillOpacity = getColorOpacity(record.fill);
  }
  if (typeof record.strokeColor === 'string') {
    state.strokeOpacity = getColorOpacity(record.strokeColor);
  }
  const metadata: Record<string, unknown> = {};
  for (const key of METADATA_KEYS) {
    if (!(key in record) || record[key] === undefined) {
      continue;
    }
    metadata[key] = record[key];
    hasState = true;
  }
  if (Object.keys(metadata).length) {
    state.metadata = metadata;
  }
  return hasState ? state : null;
};

const collectNodeStates = (
  elements: PlaitElement[],
  parentPath: number[],
  states: DocumentManifestNodeState[]
) => {
  elements.forEach((element, index) => {
    const path = [...parentPath, index];
    const state = collectNodeState(element, path.join('.'));
    if (state) {
      states.push(state);
    }
    const children = (element as unknown as { children?: PlaitElement[] }).children;
    if (Array.isArray(children)) {
      collectNodeStates(children, path, states);
    }
  });
};

export const collectDocumentManifest = (
  board: PlaitBoard,
  documentPath: string
): DocumentManifest => {
  const nodes: DocumentManifestNodeState[] = [];
  collectNodeStates(board.children || [], [], nodes);
  const theme = board.theme?.themeColorMode as string | undefined;
  const language = i18nInsidePlaitHook(board).language as string | undefined;
  return {
    type: DOCUMENT_MANIFEST_TYPE,
    version: VERSIONS.manifest,
    document: documentPath ? documentPath : undefined,
    viewport: board.viewport ? { ...board.viewport } : undefined,
    theme,
    language,
    nodes,
  };
};

const applyNodeState = (element: PlaitElement, state: DocumentManifestNodeState) => {
  const record = element as unknown as Record<string, unknown>;
  if ('fill' in state) {
    record.fill = resolveManifestColor(state.fill, state.fillOpacity);
  }
  if ('strokeColor' in state) {
    record.strokeColor = resolveManifestColor(state.strokeColor, state.strokeOpacity);
  }
  if (state.strokeWidth !== undefined) {
    record.strokeWidth = state.strokeWidth;
  }
  if (state.strokeStyle !== undefined) {
    record.strokeStyle = state.strokeStyle;
  }
  if (state.isCollapsed !== undefined) {
    record.isCollapsed = state.isCollapsed;
  }
  if (state.metadata) {
    for (const [key, value] of Object.entries(state.metadata)) {
      record[key] = value;
    }
  }
};

export const applyDocumentManifestToElements = (
  elements: PlaitElement[],
  manifest: DocumentManifest
): PlaitElement[] => {
  const nodeStateMap = new Map(manifest.nodes.map((node) => [node.path, node]));
  const walk = (items: PlaitElement[], parentPath: number[]) => {
    items.forEach((element, index) => {
      const path = [...parentPath, index];
      const state = nodeStateMap.get(path.join('.'));
      if (state) {
        applyNodeState(element, state);
      }
      const children = (element as unknown as { children?: PlaitElement[] }).children;
      if (Array.isArray(children)) {
        walk(children, path);
      }
    });
  };
  walk(elements, []);
  return elements;
};

export const applyDocumentManifestViewport = (
  board: PlaitBoard,
  manifest: DocumentManifest | null | undefined
) => {
  if (!manifest?.viewport) {
    BoardTransforms.fitViewport(board);
    return;
  }
  const zoom = manifest.viewport.zoom;
  if (manifest.viewport.origination) {
    BoardTransforms.updateViewport(board, manifest.viewport.origination, zoom);
    return;
  }
  if (typeof zoom === 'number') {
    BoardTransforms.updateZoom(board, zoom);
    return;
  }
  BoardTransforms.fitViewport(board);
};

export const applyDocumentManifestTheme = (
  board: PlaitBoard,
  manifest: DocumentManifest | null | undefined
) => {
  const theme = manifest?.theme;
  if (!theme) {
    return;
  }
  BoardTransforms.updateThemeColor(board, theme as ThemeColorMode);
};

export const applyDocumentManifestLanguage = (
  board: PlaitBoard,
  manifest: DocumentManifest | null | undefined
): Language | null => {
  const language = manifest?.language;
  if (!language) {
    return null;
  }
  setBoardLanguage(board, language as Language);
  return language as Language;
};

export const collectDocumentManifestBase64 = (board: PlaitBoard, documentPath: string): string => {
  return encodeDocumentManifestToBase64(collectDocumentManifest(board, documentPath));
};

export const readDocumentManifestBase64 = (
  manifestBase64: string | null | undefined
): DocumentManifest | null => {
  return decodeDocumentManifestFromBase64(manifestBase64);
};
