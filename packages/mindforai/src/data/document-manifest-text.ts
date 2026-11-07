// DATA-25 把“文件名_manifest.mindforai”清单与 .mindforai 文本树互相转换
import type { Point, Viewport } from '@plait/core';
import { DOCUMENT_MANIFEST_TYPE, VERSIONS } from '../constants';
import { parseMindForAIText, serializeMindForAIText } from './mindforai-text';
import { DocumentExportedType } from './types';
import type { MindForAIBranchNode, MindForAINode } from './types';
import type { DocumentManifest, DocumentManifestNodeState } from './document-manifest';

const MANIFEST_ROOT_TEXT = 'manifest';
const DOCUMENT_SECTION_PREFIX = 'document: ';
const THEME_FIELD = 'theme';
const LANGUAGE_FIELD = 'language';
const VIEWPORT_SECTION_TEXT = 'viewport';
const NODES_SECTION_TEXT = 'nodes';
const NODE_ENTRY_PREFIX = 'node ';
const METADATA_SECTION_TEXT = 'metadata';
const ZOOM_FIELD = 'zoom';
const ORIGINATION_FIELD = 'origination';
const NODE_STATE_KEYS = [
  'fill',
  'fillOpacity',
  'strokeColor',
  'strokeOpacity',
  'strokeWidth',
  'strokeStyle',
  'isCollapsed',
] as const;
const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

const formatManifestScalarValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return JSON.stringify(value) ?? '';
};

const buildManifestFieldLine = (key: string, value: unknown): string => {
  return `${key}: ${formatManifestScalarValue(value)}`;
};

const splitManifestFieldLine = (line: string): [string, string] | null => {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }
  const key = line.slice(0, separatorIndex).trim();
  if (!key) {
    return null;
  }
  const rawValue = line.slice(separatorIndex + 1).replace(/^ /, '');
  return [key, rawValue];
};

const buildManifestNodeStateTree = (state: DocumentManifestNodeState): MindForAINode => {
  const entryText = `${NODE_ENTRY_PREFIX}${state.path}`;
  const lines: MindForAINode[] = [];
  for (const key of NODE_STATE_KEYS) {
    const value = (state as unknown as Record<string, unknown>)[key];
    if (value === undefined) {
      continue;
    }
    lines.push(buildManifestFieldLine(key, value));
  }
  const metadataFields = state.metadata ? Object.entries(state.metadata) : [];
  if (metadataFields.length) {
    lines.push({
      text: METADATA_SECTION_TEXT,
      children: metadataFields.map(([key, value]) => buildManifestFieldLine(key, value)),
    });
  }
  return lines.length ? { text: entryText, children: lines } : entryText;
};

const readManifestOriginationPoint = (origination: unknown): Point | null => {
  if (Array.isArray(origination)) {
    const [x, y] = origination;
    return typeof x === 'number' && typeof y === 'number' ? [x, y] : null;
  }
  const record = origination as { x?: number; y?: number } | null;
  if (record && typeof record.x === 'number' && typeof record.y === 'number') {
    return [record.x, record.y];
  }
  return null;
};

const buildManifestViewportTree = (viewport?: Viewport): MindForAINode[] => {
  if (!viewport || typeof viewport.zoom !== 'number') {
    return [];
  }
  const lines: MindForAINode[] = [buildManifestFieldLine(ZOOM_FIELD, viewport.zoom)];
  const originationPoint = readManifestOriginationPoint(viewport.origination);
  if (originationPoint) {
    lines.push(buildManifestFieldLine(ORIGINATION_FIELD, originationPoint));
  }
  return [{ text: VIEWPORT_SECTION_TEXT, children: lines }];
};

export const serializeDocumentManifestText = (manifest: DocumentManifest): string => {
  const sections: MindForAINode[] = [];
  if (manifest.document) {
    sections.push(`${DOCUMENT_SECTION_PREFIX}${manifest.document}`);
  }
  if (manifest.theme) {
    sections.push(buildManifestFieldLine(THEME_FIELD, manifest.theme));
  }
  if (manifest.language) {
    sections.push(buildManifestFieldLine(LANGUAGE_FIELD, manifest.language));
  }
  sections.push(...buildManifestViewportTree(manifest.viewport));
  sections.push({
    text: NODES_SECTION_TEXT,
    children: manifest.nodes.map((node) => buildManifestNodeStateTree(node)),
  });
  return serializeMindForAIText({
    type: DocumentExportedType.mindforai,
    version: manifest.version || VERSIONS.manifest,
    content: [{ text: MANIFEST_ROOT_TEXT, children: sections }],
  });
};

const parseManifestScalarValue = (rawValue: string): unknown => {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return '';
  }
  if (trimmedValue === 'null') {
    return null;
  }
  if (trimmedValue === 'true') {
    return true;
  }
  if (trimmedValue === 'false') {
    return false;
  }
  if (NUMBER_PATTERN.test(trimmedValue)) {
    return Number(trimmedValue);
  }
  if (trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
    try {
      return JSON.parse(trimmedValue);
    } catch {
      return rawValue;
    }
  }
  return rawValue;
};

const readBranchChildren = (branch: MindForAIBranchNode): MindForAIBranchNode[] => {
  return branch.children.filter((child): child is MindForAIBranchNode => typeof child !== 'string');
};

const readBranchFieldLines = (branch: MindForAIBranchNode): [string, string][] => {
  const fields: [string, string][] = [];
  for (const child of branch.children) {
    if (typeof child !== 'string') {
      continue;
    }
    const field = splitManifestFieldLine(child);
    if (field) {
      fields.push(field);
    }
  }
  return fields;
};

const readManifestMetadata = (branch: MindForAIBranchNode): Record<string, unknown> => {
  const metadata: Record<string, unknown> = {};
  for (const [key, rawValue] of readBranchFieldLines(branch)) {
    metadata[key] = parseManifestScalarValue(rawValue);
  }
  return metadata;
};

const assignManifestNodeStateField = (
  state: DocumentManifestNodeState,
  key: string,
  rawValue: string
) => {
  const value = parseManifestScalarValue(rawValue);
  const record = state as unknown as Record<string, unknown>;
  if (key === 'fill' || key === 'strokeColor' || key === 'strokeStyle') {
    record[key] = typeof value === 'string' || value === null ? value : rawValue;
    return;
  }
  if (key === 'fillOpacity' || key === 'strokeOpacity' || key === 'strokeWidth') {
    if (typeof value === 'number') {
      record[key] = value;
    }
    return;
  }
  if (key === 'isCollapsed') {
    if (typeof value === 'boolean') {
      record.isCollapsed = value;
    }
  }
};

const readManifestNodeState = (branch: MindForAIBranchNode): DocumentManifestNodeState | null => {
  if (!branch.text.startsWith(NODE_ENTRY_PREFIX)) {
    return null;
  }
  const path = branch.text.slice(NODE_ENTRY_PREFIX.length).trim();
  if (!path) {
    return null;
  }
  const state: DocumentManifestNodeState = { path };
  for (const child of branch.children) {
    if (typeof child !== 'string') {
      if (child.text === METADATA_SECTION_TEXT) {
        const metadata = readManifestMetadata(child);
        if (Object.keys(metadata).length) {
          state.metadata = metadata;
        }
      }
      continue;
    }
    const field = splitManifestFieldLine(child);
    if (field) {
      assignManifestNodeStateField(state, field[0], field[1]);
    }
  }
  return state;
};

const readManifestViewport = (branch: MindForAIBranchNode): Viewport | null => {
  let zoom: number | undefined;
  let origination: Point | undefined;
  for (const [key, rawValue] of readBranchFieldLines(branch)) {
    if (key === ZOOM_FIELD) {
      const parsedZoom = parseManifestScalarValue(rawValue);
      if (typeof parsedZoom === 'number') {
        zoom = parsedZoom;
      }
      continue;
    }
    if (key === ORIGINATION_FIELD) {
      const originationPoint = readManifestOriginationPoint(parseManifestScalarValue(rawValue));
      if (originationPoint) {
        origination = originationPoint;
      }
    }
  }
  if (typeof zoom !== 'number') {
    return null;
  }
  return origination ? { zoom, origination } : { zoom };
};

export const parseDocumentManifestText = (contents: string): DocumentManifest | null => {
  const parsedText = parseMindForAIText(contents);
  if (!parsedText) {
    return null;
  }
  const rootNode = parsedText.content[0];
  if (!rootNode || typeof rootNode === 'string' || rootNode.text !== MANIFEST_ROOT_TEXT) {
    return null;
  }
  let documentPath: string | undefined;
  let viewport: Viewport | undefined;
  let theme: string | undefined;
  let language: string | undefined;
  const nodes: DocumentManifestNodeState[] = [];
  for (const section of rootNode.children) {
    if (typeof section === 'string') {
      if (section.startsWith(DOCUMENT_SECTION_PREFIX)) {
        documentPath = section.slice(DOCUMENT_SECTION_PREFIX.length).trim() || undefined;
        continue;
      }
      const field = splitManifestFieldLine(section);
      if (field && field[0] === THEME_FIELD) {
        theme = field[1].trim() || undefined;
      } else if (field && field[0] === LANGUAGE_FIELD) {
        language = field[1].trim() || undefined;
      }
      continue;
    }
    if (section.text.startsWith(DOCUMENT_SECTION_PREFIX)) {
      documentPath = section.text.slice(DOCUMENT_SECTION_PREFIX.length).trim() || undefined;
      continue;
    }
    const sectionField = splitManifestFieldLine(section.text);
    if (sectionField && !section.children.length && sectionField[0] === THEME_FIELD) {
      theme = sectionField[1].trim() || undefined;
      continue;
    }
    if (sectionField && !section.children.length && sectionField[0] === LANGUAGE_FIELD) {
      language = sectionField[1].trim() || undefined;
      continue;
    }
    if (section.text === VIEWPORT_SECTION_TEXT) {
      viewport = readManifestViewport(section) || undefined;
      continue;
    }
    if (section.text === NODES_SECTION_TEXT) {
      for (const entry of readBranchChildren(section)) {
        const state = readManifestNodeState(entry);
        if (state) {
          nodes.push(state);
        }
      }
    }
  }
  return {
    type: DOCUMENT_MANIFEST_TYPE,
    version: parsedText.version || VERSIONS.manifest,
    document: documentPath,
    viewport,
    theme,
    language,
    nodes,
  };
};
