import React from 'react';
import classNames from 'classnames';
import { getSelectedElements, PlaitBoard } from '@plait/core';
import { MindElement } from '@plait/mind';
import { ToolButton } from '../../tool-button';
import { CollapseAllIcon, ExpandAllIcon } from '../../icons';
import { useI18n } from '../../../i18n';
import { collapseOrExpandAllDescendants } from './expand-collapse';

export type PopupExpandCollapseButtonsProps = {
  board: PlaitBoard;
};

export const isMindElementWithChildren = (board: PlaitBoard) => {
  const selectedElements = getSelectedElements(board);
  return (
    selectedElements.length === 1 &&
    MindElement.isMindElement(board, selectedElements[0]) &&
    !!selectedElements[0].children?.length
  );
};

export const PopupExpandCollapseButtons: React.FC<PopupExpandCollapseButtonsProps> = ({
  board,
}) => {
  const { t } = useI18n();
  const toggleAllDescendants = (isCollapsed: boolean) => {
    const element = getSelectedElements(board)[0];
    if (!MindElement.isMindElement(board, element)) {
      return;
    }
    collapseOrExpandAllDescendants(board, element, isCollapsed);
  };
  return (
    <>
      <ToolButton
        className={classNames('property-button')}
        visible={true}
        icon={ExpandAllIcon}
        type="icon"
        title={t('popupToolbar.expandAll')}
        aria-label={t('popupToolbar.expandAll')}
        aria-keyshortcuts="Control+Alt+E"
        onPointerUp={() => {
          toggleAllDescendants(false);
        }}
      />
      <ToolButton
        className={classNames('property-button')}
        visible={true}
        icon={CollapseAllIcon}
        type="icon"
        title={t('popupToolbar.collapseAll')}
        aria-label={t('popupToolbar.collapseAll')}
        aria-keyshortcuts="Control+Alt+C"
        onPointerUp={() => {
          toggleAllDescendants(true);
        }}
      />
    </>
  );
};
