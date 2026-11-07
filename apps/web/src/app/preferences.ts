// WEB-05 应用默认偏好：语言与主题不再写入客户端缓存，统一使用写死的默认值
import { ThemeColorMode } from '@plait/core';
import type { Language } from '@mindforai/mindforai';

export type StoredPreference = {
  language: Language;
  themeColorMode: ThemeColorMode;
};

export const DEFAULT_PREFERENCE: StoredPreference = {
  language: 'zh',
  themeColorMode: ThemeColorMode.dark,
};
