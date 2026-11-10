// WEB-17 单元测试：校验 Webview 与扩展宿主的请求响应通道与文档订阅
import { beforeEach, describe, expect, it, vi } from 'vitest';

const postedMessages: Record<string, unknown>[] = [];

const installHostApi = () => {
  (globalThis as unknown as { acquireVsCodeApi: unknown }).acquireVsCodeApi = () => ({
    postMessage: (message: Record<string, unknown>) => {
      postedMessages.push(message);
    },
    getState: () => undefined,
    setState: () => undefined,
  });
};

const loadBridge = async () => {
  vi.resetModules();
  return import('./bridge');
};

const dispatchResponse = (payload: Record<string, unknown>) => {
  window.dispatchEvent(new MessageEvent('message', { data: payload }));
};

describe('host bridge', () => {
  beforeEach(() => {
    postedMessages.length = 0;
    installHostApi();
  });

  it('startHostMessageBridge 发送 ready', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    expect(postedMessages.some((message) => message.type === 'ready')).toBe(true);
  });

  it('requestHost 通过 requestId 匹配响应', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const pending = bridge.requestHost<{ files: { name: string; text: string }[] }>({
      type: 'openFiles',
      extensions: ['.mindforai'],
      multiple: true,
    });
    const requestMessage = postedMessages.find((message) => message.type === 'openFiles')!;
    dispatchResponse({
      type: 'response',
      requestId: requestMessage.requestId,
      files: [{ name: 'project.mindforai', text: 'content' }],
    });
    const result = await pending;
    expect(result.files[0].name).toBe('project.mindforai');
  });

  it('宿主返回 cancelled 时抛出 AbortError', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const pending = bridge.requestHost({ type: 'saveFile' });
    const requestMessage = postedMessages.find((message) => message.type === 'saveFile')!;
    dispatchResponse({ type: 'response', requestId: requestMessage.requestId, cancelled: true });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('宿主返回 error 时抛出普通错误', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const pending = bridge.requestHost({ type: 'saveFile' });
    const requestMessage = postedMessages.find((message) => message.type === 'saveFile')!;
    dispatchResponse({ type: 'response', requestId: requestMessage.requestId, error: '磁盘只读' });
    await expect(pending).rejects.toThrow('磁盘只读');
  });

  it('subscribeHostDocument 能收到 document 消息并回放最新文档', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const received: string[] = [];
    const unsubscribe = bridge.subscribeHostDocument((message) => {
      received.push(message.text);
    });
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'document', fileName: 'a.mindforai', text: 'AAA' },
      })
    );
    expect(received).toEqual(['AAA']);
    unsubscribe();
    const lateReceived: string[] = [];
    bridge.subscribeHostDocument((message) => {
      lateReceived.push(message.text);
    });
    expect(lateReceived).toEqual(['AAA']);
  });

  it('openDocumentFilesByHost 构造 File 对象', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const pending = bridge.hostFileSystemHandlers.openDocumentFilesByHost({
      extensions: ['.mindforai'],
      description: 'MindForAI',
      multiple: true,
    });
    const requestMessage = postedMessages.find((message) => message.type === 'openFiles')!;
    dispatchResponse({
      type: 'response',
      requestId: requestMessage.requestId,
      files: [{ name: 'board.mindforai', text: 'TEXT' }],
    });
    const files = await pending;
    expect(files.length).toBe(1);
    expect(files[0].name).toBe('board.mindforai');
    expect(await files[0].text()).toBe('TEXT');
  });

  it('saveDocumentBlobByHost 回传 handle 与句柄 uri', async () => {
    const bridge = await loadBridge();
    bridge.startHostMessageBridge();
    const pending = bridge.hostFileSystemHandlers.saveDocumentBlobByHost(
      new Blob(['CONTENT'], { type: 'text/plain' }),
      {
        name: 'project',
        extension: 'mindforai',
        description: 'MindForAI',
        fileHandle: { uri: 'file:///a.mindforai' },
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    const requestMessage = postedMessages.find((message) => message.type === 'saveFile')!;
    expect(requestMessage.handleUri).toBe('file:///a.mindforai');
    expect(requestMessage.text).toBe('CONTENT');
    dispatchResponse({
      type: 'response',
      requestId: requestMessage.requestId,
      handle: { kind: 'file', name: 'project.mindforai', uri: 'file:///a.mindforai' },
    });
    const handle = await pending;
    expect(handle?.name).toBe('project.mindforai');
  });
});
