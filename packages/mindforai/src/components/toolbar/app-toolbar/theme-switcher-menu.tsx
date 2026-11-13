// UI-47 移动端主菜单里的主题切换子菜单，替代隐藏的右下角主题下拉栏
import { useContext } from 'react';
import { BoardTransforms } from '@plait/core';
import { useBoard } from '@plait-board/react-board';
import { MenuIcon } from '../../icons';
import { useI18n } from '../../../i18n';
import type { Translations } from '../../../i18n/types';
import Menu from '../../menu/menu';
import MenuItem from '../../menu/menu-item';
import { MenuContentPropsContext } from '../../menu/common';
import { EVENT } from '../../../constants';

type ThemeOption = {
  value: string;
  labelKey: keyof Translations;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'default', labelKey: 'theme.default' },
  { value: 'colorful', labelKey: 'theme.colorful' },
  { value: 'soft', labelKey: 'theme.soft' },
  { value: 'retro', labelKey: 'theme.retro' },
  { value: 'dark', labelKey: 'theme.dark' },
  { value: 'starry', labelKey: 'theme.starry' },
];

export const ThemeSwitcherMenu = () => {
  const board = useBoard();
  const { t } = useI18n();
  const menuContentProps = useContext(MenuContentPropsContext);
  const currentThemeColorMode = board.theme.themeColorMode;

  return (
    <MenuItem
      icon={MenuIcon}
      data-testid="theme-switcher-button"
      onSelect={() => {
        return undefined;
      }}
      submenu={
        <Menu
          onSelect={() => {
            const itemSelectEvent = new CustomEvent(EVENT.MENU_ITEM_SELECT, {
              bubbles: true,
              cancelable: true,
            });
            menuContentProps.onSelect?.(itemSelectEvent);
          }}
        >
          {THEME_OPTIONS.map((themeOption) => (
            <MenuItem
              key={themeOption.value}
              onSelect={() => {
                BoardTransforms.updateThemeColor(board, themeOption.value as never);
              }}
              aria-label={t(themeOption.labelKey)}
              data-testid={`theme-option-${themeOption.value}`}
              selected={currentThemeColorMode === themeOption.value}
            >
              {t(themeOption.labelKey)}
            </MenuItem>
          ))}
        </Menu>
      }
      aria-label={t('theme.switcher')}
    >
      {t('theme.switcher')}
    </MenuItem>
  );
};

ThemeSwitcherMenu.displayName = 'ThemeSwitcherMenu';
