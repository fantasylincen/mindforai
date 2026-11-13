// DATA-35 监听移动端可视视口与软键盘高度，写入 CSS 变量供工具栏与状态栏避让
import {
  MOBILE_KEYBOARD_HEIGHT_CSS_VAR,
  MOBILE_KEYBOARD_VISIBLE_THRESHOLD_PX,
  MOBILE_VIEWPORT_HEIGHT_CSS_VAR,
} from '../constants';

type ViewportSizeLike = {
  width: number;
  height: number;
};

type VisualViewportLike = {
  height: number;
  offsetTop: number;
  scale?: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

type MobileViewportMetrics = {
  viewportHeight: number;
  keyboardHeight: number;
};

export const resolveMobileViewportMetrics = (
  layoutViewport: ViewportSizeLike,
  visualViewport: VisualViewportLike | null
): MobileViewportMetrics => {
  if (!visualViewport) {
    return { viewportHeight: layoutViewport.height, keyboardHeight: 0 };
  }
  const zoomScale = visualViewport.scale || 1;
  const visualViewportHeight = Math.round(
    visualViewport.height * zoomScale + visualViewport.offsetTop
  );
  const viewportHeight = Math.min(layoutViewport.height, visualViewportHeight);
  const occludedHeight = Math.max(0, layoutViewport.height - visualViewportHeight);
  const keyboardHeight =
    occludedHeight >= MOBILE_KEYBOARD_VISIBLE_THRESHOLD_PX ? occludedHeight : 0;
  return { viewportHeight, keyboardHeight };
};

const readLayoutViewport = (): ViewportSizeLike => {
  const layoutHeight =
    typeof window.innerHeight === 'number' && window.innerHeight > 0
      ? window.innerHeight
      : document.documentElement.clientHeight;
  return { width: window.innerWidth, height: layoutHeight };
};

const applyMetricsToRoot = (rootElement: HTMLElement | null, metrics: MobileViewportMetrics) => {
  const style = (rootElement || document.documentElement).style;
  style.setProperty(MOBILE_VIEWPORT_HEIGHT_CSS_VAR, `${metrics.viewportHeight}px`);
  style.setProperty(MOBILE_KEYBOARD_HEIGHT_CSS_VAR, `${metrics.keyboardHeight}px`);
};

export const setupMobileKeyboardBridge = (rootElement: HTMLElement | null) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }
  const visualViewport = (window.visualViewport || null) as VisualViewportLike | null;
  const updateMetrics = () => {
    const layoutViewport = readLayoutViewport();
    const metrics = resolveMobileViewportMetrics(layoutViewport, visualViewport);
    applyMetricsToRoot(rootElement, metrics);
  };
  updateMetrics();
  window.addEventListener('resize', updateMetrics);
  window.addEventListener('orientationchange', updateMetrics);
  visualViewport?.addEventListener('resize', updateMetrics);
  visualViewport?.addEventListener('scroll', updateMetrics);
  return () => {
    window.removeEventListener('resize', updateMetrics);
    window.removeEventListener('orientationchange', updateMetrics);
    visualViewport?.removeEventListener('resize', updateMetrics);
    visualViewport?.removeEventListener('scroll', updateMetrics);
  };
};
