// 定义全局常量：事件名、文档扩展名、MIME 类型与版本号
export enum EVENT {
  COPY = 'copy',
  PASTE = 'paste',
  CUT = 'cut',
  KEYDOWN = 'keydown',
  KEYUP = 'keyup',
  MOUSE_MOVE = 'mousemove',
  RESIZE = 'resize',
  UNLOAD = 'unload',
  FOCUS = 'focus',
  BLUR = 'blur',
  DRAG_OVER = 'dragover',
  DROP = 'drop',
  GESTURE_END = 'gestureend',
  BEFORE_UNLOAD = 'beforeunload',
  GESTURE_START = 'gesturestart',
  GESTURE_CHANGE = 'gesturechange',
  POINTER_MOVE = 'pointermove',
  POINTER_DOWN = 'pointerdown',
  POINTER_UP = 'pointerup',
  STATE_CHANGE = 'statechange',
  WHEEL = 'wheel',
  TOUCH_START = 'touchstart',
  TOUCH_END = 'touchend',
  HASHCHANGE = 'hashchange',
  VISIBILITY_CHANGE = 'visibilitychange',
  SCROLL = 'scroll',
  MENU_ITEM_SELECT = 'menu.itemSelect',
  MESSAGE = 'message',
  FULLSCREENCHANGE = 'fullscreenchange',
}

export const IMAGE_MIME_TYPES = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  jfif: 'image/jfif',
  md: 'text/markdown',
} as const;

export const MIME_TYPES = {
  json: 'application/json',
  drawnixlite: 'application/vnd.drawnixlite+json',
  mindforai: 'application/vnd.mindforai+toon',
  ...IMAGE_MIME_TYPES,
} as const;

export const MERMAID_MIND_RENDER_MARGIN = 12;

export const NODE_MORE_HINT_DELAY_MS = 500;

export const NODE_MORE_HINT_VISIBLE_MS = 3200;

export const DOCUMENT_FILE_EXTENSIONS = {
  drawnixlite: 'drawnixlite',
  mindforai: 'mindforai',
} as const;

export const DOCUMENT_MANIFEST_TYPE = 'mindforai-manifest';

export const DOCUMENT_MANIFEST_FIELD = 'manifest';

export const DOCUMENT_MANIFEST_ARCHIVE_NAME = 'manifest.mindforai';

export const VERSIONS = {
  drawnixlite: 1,
  mindforai: 1,
  manifest: 1,
} as const;
