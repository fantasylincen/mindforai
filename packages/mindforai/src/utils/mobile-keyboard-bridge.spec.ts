// 验证移动端可视视口与软键盘高度换算
import { describe, expect, it } from 'vitest';
import { resolveMobileViewportMetrics } from './mobile-keyboard-bridge';

const createVisualViewport = (height: number, offsetTop = 0, scale = 1) => ({
  height,
  offsetTop,
  scale,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

describe('resolveMobileViewportMetrics', () => {
  it('无可视视口时使用布局视口高度且键盘高度为 0', () => {
    expect(resolveMobileViewportMetrics({ width: 390, height: 844 }, null)).toEqual({
      viewportHeight: 844,
      keyboardHeight: 0,
    });
  });

  it('软键盘弹起时只让出键盘高度', () => {
    expect(
      resolveMobileViewportMetrics({ width: 390, height: 844 }, createVisualViewport(500))
    ).toEqual({ viewportHeight: 500, keyboardHeight: 344 });
  });

  it('地址栏收起造成的高度差小于阈值时不视为键盘', () => {
    expect(
      resolveMobileViewportMetrics({ width: 390, height: 844 }, createVisualViewport(800))
    ).toEqual({ viewportHeight: 800, keyboardHeight: 0 });
  });

  it('缩放后按 scale 与 offsetTop 还原可视高度', () => {
    expect(
      resolveMobileViewportMetrics({ width: 1024, height: 1366 }, createVisualViewport(600, 40, 2))
    ).toEqual({ viewportHeight: 1240, keyboardHeight: 126 });
  });
});
