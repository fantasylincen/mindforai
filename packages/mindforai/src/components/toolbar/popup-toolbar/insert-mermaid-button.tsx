import React from 'react';
import classNames from 'classnames';
import { getSelectedElements, PlaitBoard } from '@plait/core';
import { MindElement } from '@plait/mind';
import { ToolButton } from '../../tool-button';
import { FlowchartIcon } from '../../icons';
import { useI18n } from '../../../i18n';
import { isMermaidLeafElement } from '../../../mermaid-mind';
import { DEFAULT_MERMAID_FLOWCHART, insertMermaidMindNode } from '../../../mermaid-mind-node';

export type PopupInsertMermaidButtonProps = {
  board: PlaitBoard;
};

export const canInsertMermaidFlowchart = (board: PlaitBoard) => {
  const selectedElements = getSelectedElements(board);
  if (selectedElements.length !== 1) {
    return false;
  }
  const element = selectedElements[0];
  return MindElement.isMindElement(board, element) && !isMermaidLeafElement(element);
};

export const PopupInsertMermaidButton: React.FC<PopupInsertMermaidButtonProps> = ({ board }) => {
  const { t } = useI18n();
  const insertMermaidFlowchart = () => {
    const selectedElements = getSelectedElements(board);
    if (selectedElements.length !== 1) {
      return;
    }
    const parent = selectedElements[0];
    if (!MindElement.isMindElement(board, parent) || isMermaidLeafElement(parent)) {
      return;
    }
    insertMermaidMindNode(board, parent, DEFAULT_MERMAID_FLOWCHART);
  };
  return (
    <ToolButton
      className={classNames('property-button')}
      visible={true}
      icon={FlowchartIcon}
      type="icon"
      title={t('popupToolbar.insertMermaidFlowchart')}
      aria-label={t('popupToolbar.insertMermaidFlowchart')}
      onPointerUp={() => {
        insertMermaidFlowchart();
      }}
    />
  );
};
