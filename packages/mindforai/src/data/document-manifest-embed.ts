// DATA-27 把清单文本压缩成 ZIP 再转 Base64 写入主文档，并从主文档还原清单
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { DOCUMENT_MANIFEST_ARCHIVE_NAME } from '../constants';
import type { DocumentManifest } from './document-manifest';
import {
  parseDocumentManifestText,
  serializeDocumentManifestText,
} from './document-manifest-text';

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < bytes.length; index++) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const toSameRealmBytes = (source: Uint8Array): Uint8Array => {
  const bytes = new Uint8Array(source.length);
  bytes.set(source);
  return bytes;
};

export const encodeDocumentManifestToBase64 = (manifest: DocumentManifest): string => {
  const manifestText = serializeDocumentManifestText(manifest);
  const archive = toSameRealmBytes(strToU8(manifestText));
  const zipped = zipSync({ [DOCUMENT_MANIFEST_ARCHIVE_NAME]: archive });
  return bytesToBase64(toSameRealmBytes(zipped));
};

export const decodeDocumentManifestFromBase64 = (
  base64: string | null | undefined
): DocumentManifest | null => {
  if (!base64 || !base64.trim()) {
    return null;
  }
  let manifestText: string;
  try {
    const unzipped = unzipSync(base64ToBytes(base64));
    const archiveBytes = unzipped[DOCUMENT_MANIFEST_ARCHIVE_NAME];
    if (!archiveBytes) {
      return null;
    }
    manifestText = strFromU8(toSameRealmBytes(archiveBytes));
  } catch {
    return null;
  }
  return parseDocumentManifestText(manifestText);
};
