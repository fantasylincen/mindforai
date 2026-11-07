// 验证默认偏好使用写死的暗夜主题与中文
import { describe, expect, it } from 'vitest';
import { ThemeColorMode } from '@plait/core';
import { DEFAULT_PREFERENCE } from './preferences';

describe('preferences', () => {
  it('uses hardcoded dark theme and chinese default', () => {
    expect(DEFAULT_PREFERENCE).toEqual({
      language: 'zh',
      themeColorMode: ThemeColorMode.dark,
    });
  });
});
