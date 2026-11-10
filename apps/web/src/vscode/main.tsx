// WEB-15 VS Code 扩展 Webview 入口，挂载白板应用并接管宿主文件通道
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { setDocumentFileHost } from '@mindforai/mindforai';

import WebviewApp from './app';
import { hostFileSystemHandlers, startHostMessageBridge } from './bridge';

setDocumentFileHost(hostFileSystemHandlers);
startHostMessageBridge();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <WebviewApp />
  </StrictMode>
);
