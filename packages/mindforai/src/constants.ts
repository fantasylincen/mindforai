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
  toon: 'application/vnd.mindforai+toon',
  drawnixlite: 'application/vnd.drawnixlite+json',
  mindforai: 'application/vnd.mindforai+toon',
  ...IMAGE_MIME_TYPES,
} as const;

export const MERMAID_MIND_RENDER_MARGIN = 12;

export const NODE_MORE_HINT_DELAY_MS = 500;

export const NODE_MORE_HINT_VISIBLE_MS = 3200;

export const DOCUMENT_FILE_EXTENSIONS = {
  drawnixlite: 'json',
  mindforai: 'toon',
} as const;

export const LEGACY_DOCUMENT_FILE_EXTENSIONS = {
  drawnixlite: 'drawnixlite',
  mindforai: 'mindforai',
} as const;

export const DOCUMENT_OPEN_EXTENSIONS = [
  DOCUMENT_FILE_EXTENSIONS.mindforai,
  DOCUMENT_FILE_EXTENSIONS.drawnixlite,
  'md',
  LEGACY_DOCUMENT_FILE_EXTENSIONS.mindforai,
  LEGACY_DOCUMENT_FILE_EXTENSIONS.drawnixlite,
] as const;

// DATA-35 移动端浏览器地址栏与软键盘遮挡画板时，把可视视口尺寸写入 CSS 变量

// CORE-01 移动端浏览器可视视口相关 CSS 变量名
export const MOBILE_VIEWPORT_HEIGHT_CSS_VAR = '--mindforai-viewport-height';

// CORE-01 移动端软键盘占据高度相关 CSS 变量名
export const MOBILE_KEYBOARD_HEIGHT_CSS_VAR = '--mindforai-keyboard-height';

// DATA-35 软键盘高度变化识别阈值，小于该值时视为键盘已收起
export const MOBILE_KEYBOARD_VISIBLE_THRESHOLD_PX = 120;

export const DOCUMENT_MANIFEST_TYPE = 'mindforai-manifest';

export const DOCUMENT_MANIFEST_FIELD = 'manifest';

export const DOCUMENT_MANIFEST_ARCHIVE_NAME = 'manifest.toon';

export const LEGACY_DOCUMENT_MANIFEST_ARCHIVE_NAME = 'manifest.mindforai';

export const VERSIONS = {
  drawnixlite: 1,
  mindforai: 1,
  manifest: 1,
} as const;
