// DATA-20 在浏览器本地只保存当前打开的文档文本与文件身份，避免刷新页面后丢失正在编辑的文件
import { DOCUMENT_FILE_EXTENSIONS } from '../constants';

export interface DocumentSessionFileIdentity {
  fileName: string;
  filePath: string;
  lastModified?: number;
  size?: number;
}

export interface DocumentSession {
  type: 'mindforai-session';
  version: number;
  documentText: string;
  isDirty: boolean;
  fileIdentity?: DocumentSessionFileIdentity | null;
}

const ACTIVE_SESSION_PREFIX = 'mindforai.activeDocumentSession.';
const ACTIVE_SESSION_KEY_POINTER = 'mindforai.activeDocumentSessionKey';
const SESSION_VERSION = 1;

const readActiveSessionKey = (storage: Storage): string | null => {
  try {
    return storage.getItem(ACTIVE_SESSION_KEY_POINTER);
  } catch {
    return null;
  }
};

const getSessionKey = (filePath: string | null | undefined) => {
  const name = (filePath || '').split(/[\\/]/).pop() || '';
  return `${ACTIVE_SESSION_PREFIX}${name || 'untitled'}`;
};

const readRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isDocumentSession = (value: unknown): value is DocumentSession => {
  const record = readRecord(value);
  return (
    !!record &&
    record.type === 'mindforai-session' &&
    typeof record.documentText === 'string' &&
    typeof record.isDirty === 'boolean'
  );
};

const getActiveSessionKeys = (storage: Storage): string[] => {
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && key.startsWith(ACTIVE_SESSION_PREFIX)) {
        keys.push(key);
      }
    }
  } catch {
    return [];
  }
  return keys;
};

const readSessionByKey = (storage: Storage, key: string): DocumentSession | null => {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) || 'null');
    return isDocumentSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeDocumentSession = (session: DocumentSession | null) => {
  const storage = getStorage();
  if (!storage || !session || !session.documentText) {
    return;
  }
  try {
    const sessionKey = getSessionKey(session.fileIdentity?.filePath);
    storage.setItem(sessionKey, JSON.stringify({ ...session, version: SESSION_VERSION }));
    storage.setItem(ACTIVE_SESSION_KEY_POINTER, sessionKey);
  } catch {
    return;
  }
};

export const readDocumentSession = (): DocumentSession | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const candidates: DocumentSession[] = [];
  const activeSessionKey = readActiveSessionKey(storage);
  if (activeSessionKey) {
    const activeSession = readSessionByKey(storage, activeSessionKey);
    if (isSessionRestorable(activeSession)) {
      return activeSession;
    }
  }
  for (const key of getActiveSessionKeys(storage)) {
    const parsed = readSessionByKey(storage, key);
    if (parsed) {
      candidates.push(parsed);
    }
  }
  if (!candidates.length) {
    return null;
  }
  const dirtyCandidate = candidates.find((candidate) => candidate.isDirty);
  return dirtyCandidate || candidates[0];
};

export const clearDocumentSession = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    for (const key of getActiveSessionKeys(storage)) {
      storage.removeItem(key);
    }
    storage.removeItem(ACTIVE_SESSION_KEY_POINTER);
  } catch {
    return;
  }
};

export const isSessionRestorable = (session: DocumentSession | null | undefined) => {
  return !!session && !!session.documentText && session.documentText.trim().length > 0;
};

export const createDocumentSessionFileIdentity = (file: File | null | undefined) => {
  if (!file) {
    return null;
  }
  const fileName = file.name || '';
  if (!fileName.toLowerCase().endsWith(`.${DOCUMENT_FILE_EXTENSIONS.mindforai}`)) {
    return null;
  }
  return {
    fileName,
    filePath: fileName,
    lastModified: file.lastModified,
    size: file.size,
  } satisfies DocumentSessionFileIdentity;
};
