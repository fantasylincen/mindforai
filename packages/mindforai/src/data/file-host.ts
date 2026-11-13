// DATA-33 开放宿主文件通道：让 IDE 扩展接管打开与保存，浏览器环境保持默认实现
export interface HostFileHandle {
  kind?: 'file';
  name: string;
  uri?: string;
}

export interface HostOpenOptions {
  extensions: string[];
  description: string;
  multiple: boolean;
}

export interface HostSaveOptions {
  name: string;
  extension: string;
  description: string;
  fileHandle: unknown;
}

export interface DocumentFileHost {
  openDocumentFilesByHost(options: HostOpenOptions): Promise<File[]>;
  saveDocumentBlobByHost(blob: Blob, options: HostSaveOptions): Promise<HostFileHandle | null>;
}

let currentDocumentFileHost: DocumentFileHost | null = null;

export const setDocumentFileHost = (host: DocumentFileHost | null) => {
  currentDocumentFileHost = host;
};

export const getDocumentFileHost = (): DocumentFileHost | null => currentDocumentFileHost;

let isHostDocumentFileChannelActive = false;

export const activateHostDocumentFileChannel = () => {
  isHostDocumentFileChannelActive = true;
};

export const isHostDocumentFileChannel = () => isHostDocumentFileChannelActive;
