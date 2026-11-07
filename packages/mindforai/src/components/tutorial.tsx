// UI-33 首页标题头，展示品牌标题并承载下方拖拽提示面板插槽
import React from 'react';
import { useI18n } from '../i18n';
import './tutorial.scss';

interface TutorialProps {
  children?: React.ReactNode;
}

export const Tutorial: React.FC<TutorialProps> = ({ children }) => {
  const { t } = useI18n();

  return (
    <div className="mindforai-tutorial">
      <div className="tutorial-overlay">
        <div className="tutorial-content">
          <h1 className="brand-title">{t('tutorial.title')}</h1>
          <p className="brand-description">{t('tutorial.description')}</p>
          {children}
        </div>
      </div>
    </div>
  );
};
