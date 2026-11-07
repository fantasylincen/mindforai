import { useBoard } from '@plait-board/react-board';
import Stack from '../../stack';
import { ToolButton } from '../../tool-button';
import { MenuIcon, RedoIcon, SaveFileIcon, TrashIcon, UndoIcon } from '../../icons';
import classNames from 'classnames';
import {
  ATTACHED_ELEMENT_CLASS_NAME,
  deleteFragment,
  getSelectedElements,
  PlaitBoard,
} from '@plait/core';
import { Island } from '../../island';
import { Popover, PopoverContent, PopoverTrigger } from '../../popover/popover';
import { useState } from 'react';
import {
  CleanBoard,
  OpenFile,
  OpenHelp,
  OpenNewWindow,
  SaveAsFile,
  SaveAsImage,
  SearchNodes,
  SaveToFile,
  Socials,
} from './app-menu-items';
import { LanguageSwitcherMenu } from './language-switcher-menu';
import { saveDocumentToCurrentFile } from '../../../data/document-save';
import Menu from '../../menu/menu';
import MenuSeparator from '../../menu/menu-separator';
import { useI18n } from '../../../i18n';
import { DocumentTitle } from '../../document-title';

export const AppToolbar = () => {
  const board = useBoard();
  const { t } = useI18n();
  const container = PlaitBoard.getBoardContainer(board);
  const selectedElements = getSelectedElements(board);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const isUndoDisabled = board.history.undos.length <= 0;
  const isRedoDisabled = board.history.redos.length <= 0;
  return (
    <Island padding={1} className={classNames('app-toolbar', ATTACHED_ELEMENT_CLASS_NAME)}>
      <Stack.Row gap={1}>
        <Popover
          key={0}
          sideOffset={12}
          open={appMenuOpen}
          onOpenChange={(open) => {
            setAppMenuOpen(open);
          }}
          placement="bottom-start"
        >
          <PopoverTrigger asChild>
            <ToolButton
              type="icon"
              visible={true}
              selected={appMenuOpen}
              icon={MenuIcon}
              title={t('general.menu')}
              aria-label={t('general.menu')}
              onPointerDown={() => {
                setAppMenuOpen(!appMenuOpen);
              }}
            />
          </PopoverTrigger>
          <PopoverContent container={container}>
            <Menu
              onSelect={() => {
                setAppMenuOpen(false);
              }}
            >
              <OpenFile></OpenFile>
              <OpenNewWindow></OpenNewWindow>
              <SearchNodes></SearchNodes>
              <SaveToFile></SaveToFile>
              <SaveAsFile></SaveAsFile>
              <SaveAsImage></SaveAsImage>
              <CleanBoard></CleanBoard>
              <MenuSeparator />
              <OpenHelp></OpenHelp>
              <LanguageSwitcherMenu />
              <Socials />
            </Menu>
          </PopoverContent>
        </Popover>
        <ToolButton
          key={1}
          type="icon"
          icon={UndoIcon}
          visible={true}
          title={t('general.undo')}
          aria-label={t('general.undo')}
          onPointerUp={() => {
            board.undo();
          }}
          disabled={isUndoDisabled}
        />
        <ToolButton
          key={5}
          type="icon"
          icon={SaveFileIcon}
          visible={true}
          title={t('menu.saveFile')}
          aria-label={t('menu.saveFile')}
          onPointerUp={() => {
            saveDocumentToCurrentFile(board);
          }}
        />
        <ToolButton
          key={2}
          type="icon"
          icon={RedoIcon}
          visible={true}
          title={t('general.redo')}
          aria-label={t('general.redo')}
          onPointerUp={() => {
            board.redo();
          }}
          disabled={isRedoDisabled}
        />
        {selectedElements.length > 0 && (
          <ToolButton
            className="trash"
            key={4}
            type="icon"
            icon={TrashIcon}
            visible={true}
            title={t('general.delete')}
            aria-label={t('general.delete')}
            onPointerUp={() => {
              deleteFragment(board);
            }}
          />
        )}
        <DocumentTitle></DocumentTitle>
      </Stack.Row>
    </Island>
  );
};
