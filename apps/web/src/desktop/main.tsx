// DESK-04 桌面版渲染进程入口：注册桌面文件通道并挂载多标签应用
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { activateHostDocumentFileChannel } from '@mindforai/mindforai';

import { setDocumentFileHost } from '@mindforai/mindforai';
import { desktopFileSystemHandlers } from './bridge';
import { installDesktopFileDropListener } from './file-drop';
import { DesktopApp } from './app';
import './styles.scss';

activateHostDocumentFileChannel();
setDocumentFileHost(desktopFileSystemHandlers);
installDesktopFileDropListener();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <DesktopApp />
  </StrictMode>
);
