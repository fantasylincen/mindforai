// WEB-17 VS Code Webview 与扩展宿主之间的消息通道，并接管白板的文件打开与保存
type VsCodeApi = {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

export type HostResponse = {
  type?: string;
  requestId?: string;
  cancelled?: boolean;
  error?: string;
  files?: { name: string; text: string }[];
  handle?: { name: string; uri?: string } | null;
};

export type HostDocumentMessage = {
  type: 'document';
  fileName: string;
  fileUri?: string;
  text: string;
};

export type HostFileSystemHandlers = {
  openDocumentFilesByHost: (options: {
    extensions: string[];
    description: string;
    multiple: boolean;
  }) => Promise<File[]>;
  saveDocumentBlobByHost: (
    blob: Blob,
    options: { name: string; extension: string; description: string; fileHandle: unknown }
  ) => Promise<{ name: string; uri?: string } | null>;
};

declare const acquireVsCodeApi: () => VsCodeApi;

let hostApi: VsCodeApi | null = null;
let requestSeed = 0;
const pendingRequests = new Map<string, (response: HostResponse) => void>();
const documentHandlers = new Set<(message: HostDocumentMessage) => void>();

const getHostApi = (): VsCodeApi => {
  if (!hostApi) {
    hostApi = acquireVsCodeApi();
  }
  return hostApi;
};

const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};

export const requestHost = <T>(message: Record<string, unknown>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const requestId = `request-${++requestSeed}`;
    pendingRequests.set(requestId, (response) => {
      pendingRequests.delete(requestId);
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      if (response.cancelled) {
        reject(createAbortError());
        return;
      }
      resolve(response as T);
    });
    getHostApi().postMessage({ ...message, requestId });
  });

export const notifyHost = (message: Record<string, unknown>) => {
  getHostApi().postMessage(message);
};

export const subscribeHostDocument = (handler: (message: HostDocumentMessage) => void) => {
  documentHandlers.add(handler);
  // 客户端不缓存文档内容：每次订阅都向宿主重新读取当前文件
  notifyHost({ type: 'documentRequest' });
  return () => {
    documentHandlers.delete(handler);
  };
};

export const startHostMessageBridge = () => {
  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    if (!message || typeof message !== 'object') {
      return;
    }
    if (message.type === 'response' && typeof message.requestId === 'string') {
      pendingRequests.get(message.requestId)?.(message as HostResponse);
      return;
    }
    if (message.type === 'document') {
      const documentMessage = message as HostDocumentMessage;
      for (const handler of documentHandlers) {
        handler(documentMessage);
      }
    }
  });
  notifyHost({ type: 'ready' });
};

export const hostFileSystemHandlers: HostFileSystemHandlers = {
  openDocumentFilesByHost: async (options) => {
    const response = await requestHost<HostResponse>({
      type: 'openFiles',
      extensions: options.extensions,
      description: options.description,
      multiple: options.multiple,
    });
    return (response.files || []).map((file) => new File([file.text], file.name));
  },
  saveDocumentBlobByHost: async (blob, options) => {
    const text = await blob.text();
    const fileHandle = options.fileHandle as { uri?: string } | null;
    const response = await requestHost<HostResponse>({
      type: 'saveFile',
      text,
      name: options.name,
      extension: options.extension,
      description: options.description,
      handleUri: fileHandle?.uri,
    });
    return response.handle ?? null;
  },
};
