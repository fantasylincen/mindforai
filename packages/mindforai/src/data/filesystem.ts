// DATA-11、DATA-33 封装文件打开、保存与另存为；存在宿主文件通道时优先交给 IDE 扩展处理
import type { FileSystemHandle as BrowserFileSystemHandle } from 'browser-fs-access';
import { fileOpen as _fileOpen, fileSave as _fileSave } from 'browser-fs-access';
import { MIME_TYPES } from '../constants';
import { getDocumentFileHost } from './file-host';
import type { HostFileHandle } from './file-host';

type FILE_EXTENSION = Exclude<keyof typeof MIME_TYPES, 'binary'> | 'md';

export type FileSystemHandle = BrowserFileSystemHandle | FileSystemFileHandle;

const openDocumentFilesByHost = async <M extends boolean | undefined = false>(opts: {
  extensions?: FILE_EXTENSION[];
  description: string;
  multiple?: M;
}): Promise<M extends false | undefined ? File : File[]> => {
  const files = await getDocumentFileHost()!.openDocumentFilesByHost({
    extensions: (opts.extensions || []).map((extension) => `.${extension}`),
    description: opts.description,
    multiple: !!opts.multiple,
  });
  return (opts.multiple ? files : files[0]) as M extends false | undefined ? File : File[];
};

export const fileOpen = <M extends boolean | undefined = false>(opts: {
  extensions?: FILE_EXTENSION[];
  description: string;
  multiple?: M;
}): Promise<M extends false | undefined ? File : File[]> => {
  if (getDocumentFileHost()) {
    return openDocumentFilesByHost(opts);
  }
  type RetType = M extends false | undefined ? File : File[];

  const mimeTypes = opts.extensions?.reduce((mimeTypes, type) => {
    mimeTypes.push(MIME_TYPES[type]);

    return mimeTypes;
  }, [] as string[]);

  const extensions = opts.extensions?.reduce((acc, ext) => {
    if (ext === 'jpg') {
      return acc.concat('.jpg', '.jpeg');
    }
    return acc.concat(`.${ext}`);
  }, [] as string[]);

  return _fileOpen({
    description: opts.description,
    extensions,
    mimeTypes,
    multiple: opts.multiple ?? false,
  }) as Promise<RetType>;
};

export const fileSave = async (
  blob: Blob | Promise<Blob>,
  opts: {
    name: string;
    extension: FILE_EXTENSION;
    description: string;
    fileHandle?: unknown;
  }
): Promise<FileSystemHandle | HostFileHandle | null> => {
  if (getDocumentFileHost()) {
    const savedHandle = await getDocumentFileHost()!.saveDocumentBlobByHost(await blob, {
      name: opts.name,
      extension: opts.extension,
      description: opts.description,
      fileHandle: opts.fileHandle ?? null,
    });
    return savedHandle as unknown as FileSystemHandle;
  }
  return _fileSave(
    blob,
    {
      fileName: `${opts.name}.${opts.extension}`,
      description: opts.description,
      extensions: [`.${opts.extension}`],
    },
    opts.fileHandle as any
  );
};
