// DESK-07 桌面版顶部标签栏：显示所有打开的文档、未保存标记与关闭按钮
import classNames from 'classnames';
import type { DesktopTab } from './tab-model';
import { getTabTitle } from './tab-model';
import './tab-bar.scss';

export type TabBarProps = {
  tabs: DesktopTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
};

export const TabBar = ({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: TabBarProps) => {
  return (
    <div className="desktop-tab-bar" role="tablist">
      <div className="desktop-tab-bar__list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            title={tab.path || getTabTitle(tab)}
            className={classNames('desktop-tab', {
              'desktop-tab--active': tab.id === activeTabId,
            })}
            onMouseDown={(event) => {
              if (event.button === 0) {
                onSelectTab(tab.id);
              }
            }}
            onAuxClick={(event) => {
              if (event.button === 1) {
                onCloseTab(tab.id);
              }
            }}
          >
            {tab.dirty && <span className="desktop-tab__dot" />}
            <span className="desktop-tab__title">{getTabTitle(tab)}</span>
            <button
              type="button"
              className="desktop-tab__close"
              aria-label="关闭标签页"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="desktop-tab-bar__new"
        aria-label="新建标签页"
        title="新建标签页 (Ctrl+N)"
        onClick={onNewTab}
      >
        +
      </button>
    </div>
  );
};
