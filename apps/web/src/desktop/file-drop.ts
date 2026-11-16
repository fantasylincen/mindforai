// DESK-09 桌面版拖拽文件：通过宿主取回真实文件路径，先于画板拖拽层拦截并交给主进程读取
import { getDroppedFileSystemPath } from './bridge';

export type DesktopDropHandler = (paths: string[]) => void;

let dropHandler: DesktopDropHandler | null = null;

const resolveDroppedPaths = (event: DragEvent) =>
  Array.from(event.dataTransfer?.files || [])
    .map((file) => getDroppedFileSystemPath(file))
    .filter((filePath) => !!filePath);

const handleDragOver = (event: DragEvent) => {
  if (!event.dataTransfer) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};

const handleDrop = (event: DragEvent) => {
  if (!dropHandler) {
    return;
  }
  const paths = resolveDroppedPaths(event);
  if (!paths.length) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  dropHandler(paths);
};

export const setDesktopDropHandler = (handler: DesktopDropHandler | null) => {
  dropHandler = handler;
};

let isListenerInstalled = false;

export const installDesktopFileDropListener = () => {
  if (isListenerInstalled || typeof window === 'undefined') {
    return;
  }
  isListenerInstalled = true;
  window.addEventListener('dragover', handleDragOver, true);
  window.addEventListener('drop', handleDrop, true);
};
