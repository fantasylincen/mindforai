// 验证「打开新窗口」菜单项会触发宿主提供的新窗口回调
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MindForAIContext } from '../../../hooks/use-mindforai';
import { I18nProvider } from '../../../i18n';
import { OpenNewWindow } from './app-menu-items';

const renderWithContext = (openNewWindow: () => void) => {
  return render(
    <I18nProvider initialLanguage="zh">
      <MindForAIContext.Provider
        value={{
          appState: {
            toolState: {} as never,
            isMobile: false,
            fileHandle: null,
            filePath: null,
            isDirty: false,
            openCleanConfirm: false,
            exportTransparent: false,
          },
          setAppState: vi.fn(),
          showToast: vi.fn(),
          openNewWindow,
        }}
      >
        <OpenNewWindow />
      </MindForAIContext.Provider>
    </I18nProvider>
  );
};

describe('OpenNewWindow', () => {
  it('should call openNewWindow when the menu item is selected', () => {
    const openNewWindow = vi.fn();
    renderWithContext(openNewWindow);

    const menuItem = screen.getByTestId('new-window-button');
    menuItem.click();

    expect(openNewWindow).toHaveBeenCalledTimes(1);
  });
});
