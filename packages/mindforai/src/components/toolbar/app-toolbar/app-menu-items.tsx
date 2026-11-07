import {
  ExportImageIcon,
  GithubIcon,
  HelpIcon,
  NewWindowIcon,
  OpenFileIcon,
  SaveFileIcon,
  SearchIcon,
  TrashIcon,
} from '../../icons';
import { useBoard, useListRender } from '@plait-board/react-board';
import { fileOpen } from '../../../data/filesystem';
import {
  applyDocumentDataToBoard,
  getMergeManifest,
  readFilesForOpen,
} from '../../../data/document-open';
import { saveDocumentAsFormat, saveDocumentToCurrentFile } from '../../../data/document-save';
import MenuItem from '../../menu/menu-item';
import MenuItemLink from '../../menu/menu-item-link';
import { saveAsPng, saveAsSvg } from '../../../utils/image';
import { useMindForAI } from '../../../hooks/use-mindforai';
import { useI18n } from '../../../i18n';
import Menu from '../../menu/menu';
import MenuItemContentSwitch from '../../menu/menu-item-content-switch';
import { useContext } from 'react';
import { MenuContentPropsContext } from '../../menu/common';
import { EVENT } from '../../../constants';
import { getShortcutKey } from '../../../utils/common';

export const SaveToFile = () => {
  const board = useBoard();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="save-button"
      onSelect={() => {
        saveDocumentToCurrentFile(board);
      }}
      icon={SaveFileIcon}
      aria-label={t('menu.saveFile')}
    >
      {t('menu.saveFile')}
    </MenuItem>
  );
};
SaveToFile.displayName = 'SaveToFile';

export const SaveAsFile = () => {
  const board = useBoard();
  const menuContentProps = useContext(MenuContentPropsContext);
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="save-as-button"
      onSelect={() => undefined}
      icon={SaveFileIcon}
      aria-label={t('menu.saveAsFile')}
      shortcut={getShortcutKey('CtrlOrCmd+Shift+S')}
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
          <MenuItem
            data-testid="save-as-mindforai-button"
            onSelect={() => {
              saveDocumentAsFormat(board, 'mindforai');
            }}
            aria-label={t('menu.saveAsMindForAI')}
          >
            {t('menu.saveAsMindForAI')}
          </MenuItem>
          <MenuItem
            data-testid="save-as-drawnixlite-button"
            onSelect={() => {
              saveDocumentAsFormat(board, 'drawnixlite');
            }}
            aria-label={t('menu.saveAsDrawnixLite')}
          >
            {t('menu.saveAsDrawnixLite')}
          </MenuItem>
          <MenuItem
            data-testid="save-as-markdown-button"
            onSelect={() => {
              saveDocumentAsFormat(board, 'markdown');
            }}
            aria-label={t('menu.saveAsMarkdown')}
          >
            {t('menu.saveAsMarkdown')}
          </MenuItem>
        </Menu>
      }
    >
      {t('menu.saveAsFile')}
    </MenuItem>
  );
};
SaveAsFile.displayName = 'SaveAsFile';

export const OpenFile = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { setAppState, showToast } = useMindForAI();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="open-button"
      onSelect={() => {
        fileOpen({
          description: 'MindForAI files',
          extensions: ['mindforai', 'drawnixlite', 'md'],
          multiple: true,
        })
          .then(async (files) => {
            const fileList = Array.isArray(files) ? files : [files];
            if (!fileList.length) {
              return;
            }
            const result = await readFilesForOpen(fileList);
            if (result.invalid) {
              setAppState((currentAppState) => ({
                ...currentAppState,
                invalidDocument: {
                  fileName: result.invalid!.filePath,
                  fileHandle: null,
                  contents: result.invalid!.contents,
                  format: result.invalid!.format,
                  issues: result.invalid!.issues,
                },
              }));
              return;
            }
            if (!result.data) {
              showToast({ message: t('toast.dropFileUnsupported'), type: 'error' });
              return;
            }
            const isMultiFile = result.isMultiFile;
            const documentName = isMultiFile
              ? `${t('toast.mergedFileNamePrefix')}${result.fileCount}${t('toast.mergedFileNameSuffix')}`
              : fileList[0].name;
            const manifest = getMergeManifest(result.data, isMultiFile);
            applyDocumentDataToBoard(board, listRender, result.data, manifest);
            setAppState((currentAppState) => ({
              ...currentAppState,
              fileHandle: isMultiFile
                ? null
                : (fileList[0] as File & { handle?: never }).handle || null,
              filePath: documentName,
              editingDocument: false,
              isDirty: false,
            }));
          })
          .catch((error) => {
            if (error && typeof error === 'object' && (error as Error).name === 'AbortError') {
              return;
            }
            showToast({ message: t('toast.dropFileUnsupported'), type: 'error' });
          });
      }}
      icon={OpenFileIcon}
      aria-label={t('menu.open')}
    >
      {t('menu.open')}
    </MenuItem>
  );
};
OpenFile.displayName = 'OpenFile';

export const OpenNewWindow = () => {
  const { openNewWindow } = useMindForAI();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="new-window-button"
      onSelect={() => {
        openNewWindow();
      }}
      icon={NewWindowIcon}
      aria-label={t('menu.newWindow')}
    >
      {t('menu.newWindow')}
    </MenuItem>
  );
};
OpenNewWindow.displayName = 'OpenNewWindow';

export const SearchNodes = () => {
  const { setAppState } = useMindForAI();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="search-nodes-button"
      onSelect={() => {
        setAppState((currentAppState) => ({ ...currentAppState, openSearch: true }));
      }}
      icon={SearchIcon}
      shortcut={getShortcutKey('CtrlOrCmd+F')}
      aria-label={t('menu.search')}
    >
      {t('menu.search')}
    </MenuItem>
  );
};
SearchNodes.displayName = 'SearchNodes';

export const OpenHelp = () => {
  const { setAppState } = useMindForAI();
  const { t } = useI18n();
  return (
    <MenuItem
      data-testid="help-button"
      onSelect={() => {
        setAppState((currentAppState) => ({ ...currentAppState, openHelp: true }));
      }}
      icon={HelpIcon}
      aria-label={t('menu.help')}
    >
      {t('menu.help')}
    </MenuItem>
  );
};
OpenHelp.displayName = 'OpenHelp';

export const SaveAsImage = () => {
  const board = useBoard();
  const { appState, setAppState } = useMindForAI();
  const menuContentProps = useContext(MenuContentPropsContext);
  const { t } = useI18n();
  return (
    <MenuItem
      icon={ExportImageIcon}
      data-testid="image-export-button"
      onSelect={() => undefined}
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
          <MenuItem
            onSelect={() => {
              saveAsSvg(board);
            }}
            aria-label={t('menu.exportImage.svg')}
            shortcut={getShortcutKey('CtrlOrCmd+Shift+E')}
          >
            {t('menu.exportImage.svg')}
          </MenuItem>
          <MenuItem
            onSelect={() => {
              saveAsPng(board);
            }}
            aria-label={t('menu.exportImage.png')}
          >
            {t('menu.exportImage.png')}
          </MenuItem>
          <MenuItem
            onSelect={(event) => {
              event.preventDefault();
              setAppState((currentAppState) => ({
                ...currentAppState,
                exportTransparent: !currentAppState.exportTransparent,
              }));
            }}
            className="menu-item--setting"
            role="menuitemcheckbox"
            aria-checked={appState.exportTransparent}
            aria-label={t('general.copyToClipboard.transparent')}
          >
            <MenuItemContentSwitch checked={appState.exportTransparent}>
              {t('general.copyToClipboard.transparent')}
            </MenuItemContentSwitch>
          </MenuItem>
        </Menu>
      }
      aria-label={t('menu.exportImage')}
    >
      {t('menu.exportImage')}
    </MenuItem>
  );
};
SaveAsImage.displayName = 'SaveAsImage';

export const CleanBoard = () => {
  const board = useBoard();
  const { t } = useI18n();
  return (
    <MenuItem
      icon={TrashIcon}
      data-testid="reset-button"
      onSelect={() => {
        board.deleteFragment(board.children);
      }}
      shortcut={getShortcutKey('CtrlOrCmd+Backspace')}
      aria-label={t('menu.cleanBoard')}
    >
      {t('menu.cleanBoard')}
    </MenuItem>
  );
};
CleanBoard.displayName = 'CleanBoard';

export const Socials = () => {
  return (
    <MenuItemLink
      icon={GithubIcon}
      href="https://github.com/fantasylincen/mindforai"
      aria-label="GitHub"
    >
      GitHub
    </MenuItemLink>
  );
};
Socials.displayName = 'Socials';
