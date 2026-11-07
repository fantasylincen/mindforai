// WEB-04 应用入口：文档、主题与语言均随文件保存于 manifest，客户端不额外缓存
import { useState } from 'react';
import { MindForAI } from '@mindforai/mindforai';
import type { Language } from '@mindforai/mindforai';

import { PlaitElement, PlaitTheme, ThemeColorMode, Viewport } from '@plait/core';
import { DEFAULT_PREFERENCE, type StoredPreference } from './preferences';

type AppValue = {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
};

export function App() {
  const [preference, setPreference] = useState<StoredPreference>(() => DEFAULT_PREFERENCE);
  const [value, setValue] = useState<AppValue>({ children: [] });
  const [tutorial, setTutorial] = useState(true);

  const updatePreference = (partialPreference: Partial<StoredPreference>) => {
    setPreference((currentPreference) => ({ ...currentPreference, ...partialPreference }));
  };

  return (
    <MindForAI
      value={value.children}
      viewport={value.viewport}
      theme={{ themeColorMode: preference.themeColorMode }}
      initialLanguage={preference.language}
      onLanguageChange={(language: Language) => {
        updatePreference({ language });
      }}
      onThemeChange={(themeColorMode: ThemeColorMode) => {
        updatePreference({ themeColorMode });
      }}
      onDocumentFileChange={({ filePath }) => {
        if (!filePath) {
          setTutorial(true);
        }
      }}
      onChange={(data) => {
        if (!data || !('operations' in data)) {
          return;
        }
        setValue({
          children: data.children,
          viewport: data.viewport,
          theme: data.theme,
        });
        if (data.children && data.children.length > 0) {
          setTutorial(false);
        }
      }}
      tutorial={tutorial}
    />
  );
}

export default App;
