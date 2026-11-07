// 顶部中间工具栏，只提供手形、选择与思维导图三种工具指针的切换
import classNames from 'classnames';
import { Island } from '../island';
import Stack from '../stack';
import { ToolButton } from '../tool-button';
import { EditDocumentIcon, HandIcon, MindIcon, SelectionIcon } from '../icons';
import { useBoard } from '@plait-board/react-board';
import {
  ATTACHED_ELEMENT_CLASS_NAME,
  BoardTransforms,
  PlaitBoard,
  PlaitPointerType,
} from '@plait/core';
import { MindPointerType } from '@plait/mind';
import { BoardCreationMode, setCreationMode } from '@plait/common';
import { MindForAIPointerType, useMindForAI } from '../../hooks/use-mindforai';
import { Translations, useI18n } from '../../i18n';

type AppToolButtonProps = {
  titleKey: keyof Translations;
  icon: React.ReactNode;
  pointer: MindForAIPointerType;
};

const BUTTONS: AppToolButtonProps[] = [
  {
    icon: HandIcon,
    pointer: PlaitPointerType.hand,
    titleKey: 'toolbar.hand',
  },
  {
    icon: SelectionIcon,
    pointer: PlaitPointerType.selection,
    titleKey: 'toolbar.selection',
  },
  {
    icon: MindIcon,
    pointer: MindPointerType.mind,
    titleKey: 'toolbar.mind',
  },
];

const isBasicPointer = (pointer: MindForAIPointerType) => {
  return pointer === PlaitPointerType.hand || pointer === PlaitPointerType.selection;
};

export const CreationToolbar = () => {
  const board = useBoard();
  const { appState, setAppState } = useMindForAI();
  const { t } = useI18n();

  const updateToolStatePointer = (pointer: MindForAIPointerType) => {
    setAppState((currentAppState) => ({
      ...currentAppState,
      toolState: {
        ...currentAppState.toolState,
        pointer,
      },
    }));
  };

  const changePointer = (pointer: MindForAIPointerType) => {
    if (isBasicPointer(pointer)) {
      return;
    }
    setCreationMode(board, BoardCreationMode.dnd);
    BoardTransforms.updatePointerType(board, pointer);
    updateToolStatePointer(pointer);
  };

  const finishPointerChange = (pointer: MindForAIPointerType) => {
    if (isBasicPointer(pointer)) {
      BoardTransforms.updatePointerType(board, pointer);
      updateToolStatePointer(pointer);
      return;
    }
    setCreationMode(board, BoardCreationMode.drawing);
  };

  return (
    <Island padding={1} className={classNames('draw-toolbar', ATTACHED_ELEMENT_CLASS_NAME)}>
      <Stack.Row gap={1}>
        {BUTTONS.map((button, index) => {
          if (appState.isMobile && button.pointer === PlaitPointerType.hand) {
            return null;
          }
          return (
            <ToolButton
              key={index}
              type="radio"
              icon={button.icon}
              checked={PlaitBoard.isPointer(board, button.pointer)}
              title={t(button.titleKey)}
              aria-label={t(button.titleKey)}
              onPointerDown={() => {
                changePointer(button.pointer);
              }}
              onPointerUp={() => {
                finishPointerChange(button.pointer);
              }}
            />
          );
        })}
        <ToolButton
          type="icon"
          visible={true}
          icon={EditDocumentIcon}
          title={t('toolbar.edit')}
          aria-label={t('toolbar.edit')}
          selected={!!appState.editingDocument}
          data-testid="edit-document-button"
          onClick={() => {
            setAppState((currentAppState) => ({
              ...currentAppState,
              editingDocument: true,
            }));
          }}
        />
      </Stack.Row>
    </Island>
  );
};
