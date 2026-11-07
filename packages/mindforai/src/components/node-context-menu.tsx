// 节点右键菜单，提供跨窗口复制与粘贴为子节点
import { useCallback, useEffect, useRef, useState } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import {
  getHitElementByPoint,
  PlaitBoard,
  PlaitElement,
  toHostPoint,
  toViewBoxPoint,
} from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import Menu from './menu/menu';
import MenuItem from './menu/menu-item';
import { CopyJsonIcon, CopyNodeIcon, PasteNodeIcon } from './icons';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import {
  copyNodeAsMindForAIText,
  copyNodesAsDrawnixLiteText,
  copyNodesAsMarkdownText,
  pasteNodesAsChildren,
  readClipboardNodeElements,
} from '../data/node-clipboard';
import './node-context-menu.scss';

type NodeContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  element: PlaitElement | null;
};

const CLOSED_MENU_STATE: NodeContextMenuState = { visible: false, x: 0, y: 0, element: null };

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== 'function') {
    return false;
  }
  return !!element.closest('input, textarea, [contenteditable="true"]');
};

export const NodeContextMenu = ({ container }: { container?: HTMLElement | null }) => {
  const board = useBoard();
  const listRender = useListRender();
  const { showToast } = useMindForAI();
  const { t } = useI18n();
  const [menuState, setMenuState] = useState<NodeContextMenuState>(CLOSED_MENU_STATE);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuElementRef = useRef<PlaitElement | null>(null);
  menuElementRef.current = menuState.element;

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      if (
        PlaitBoard.isReadonly(board) ||
        PlaitBoard.hasBeenTextEditing(board) ||
        isEditableTarget(event.target)
      ) {
        setMenuState(CLOSED_MENU_STATE);
        return;
      }
      let isInsideBoard = false;
      try {
        isInsideBoard = PlaitBoard.getBoardContainer(board).contains(event.target as Node);
      } catch {
        isInsideBoard = false;
      }
      if (!isInsideBoard) {
        setMenuState(CLOSED_MENU_STATE);
        return;
      }
      const viewBoxPoint = toViewBoxPoint(board, toHostPoint(board, event.clientX, event.clientY));
      const hitElement = getHitElementByPoint(board, viewBoxPoint);
      if (!hitElement) {
        setMenuState(CLOSED_MENU_STATE);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setMenuState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        element: hitElement,
      });
    };
    window.addEventListener('contextmenu', handleContextMenu, true);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [board]);

  useEffect(() => {
    if (!menuState.visible) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setMenuState(CLOSED_MENU_STATE);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuState(CLOSED_MENU_STATE);
      }
    };
    const handleClose = () => setMenuState(CLOSED_MENU_STATE);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleClose);
    window.addEventListener('resize', handleClose);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuState.visible]);

  const closeMenu = useCallback(() => setMenuState(CLOSED_MENU_STATE), []);

  const handleCopyNode = useCallback(
    async (element: PlaitElement) => {
      closeMenu();
      try {
        await copyNodeAsMindForAIText([element]);
        showToast({ message: t('toast.copySuccess'), type: 'success' });
      } catch {
        showToast({ message: t('toast.copyFailed'), type: 'error' });
      }
    },
    [closeMenu, showToast, t]
  );

  const handleCopyDrawnixLite = useCallback(
    async (element: PlaitElement) => {
      closeMenu();
      try {
        await copyNodesAsDrawnixLiteText([element]);
        showToast({ message: t('toast.copySuccess'), type: 'success' });
      } catch {
        showToast({ message: t('toast.copyFailed'), type: 'error' });
      }
    },
    [closeMenu, showToast, t]
  );

  const handleCopyMarkdown = useCallback(
    async (element: PlaitElement) => {
      closeMenu();
      try {
        await copyNodesAsMarkdownText([element]);
        showToast({ message: t('toast.copySuccess'), type: 'success' });
      } catch {
        showToast({ message: t('toast.copyFailed'), type: 'error' });
      }
    },
    [closeMenu, showToast, t]
  );

  const handlePasteNodeAsChild = useCallback(
    async (element: PlaitElement) => {
      closeMenu();
      const elements = await readClipboardNodeElements();
      if (!elements) {
        showToast({ message: t('toast.pasteUnavailable'), type: 'error' });
        return;
      }
      let parentPath: number[] | null = null;
      try {
        parentPath = PlaitBoard.findPath(board, element);
      } catch {
        parentPath = null;
      }
      if (!parentPath) {
        return;
      }
      const pasted = pasteNodesAsChildren(board, parentPath, elements);
      if (!pasted) {
        showToast({ message: t('toast.pasteFailed'), type: 'error' });
        return;
      }
      listRender.update(board.children, {
        board,
        parent: board,
        parentG: PlaitBoard.getElementHost(board),
      });
      showToast({ message: t('toast.pasteSuccess'), type: 'success' });
    },
    [board, closeMenu, listRender, showToast, t]
  );

  if (!menuState.visible || !menuState.element) {
    return null;
  }
  const menuWidth = 200;
  const menuHeight = 192;
  const left = Math.min(menuState.x, window.innerWidth - menuWidth - 8);
  const top = Math.min(menuState.y, window.innerHeight - menuHeight - 8);

  return (
    <FloatingPortal root={container}>
      <div
        className="mindforai-node-context-menu"
        style={{ left: Math.max(8, left), top: Math.max(8, top) }}
        ref={menuRef}
        onContextMenu={(event) => event.preventDefault()}
      >
        <Menu>
          <MenuItem
            icon={CopyNodeIcon}
            aria-label={t('contextMenu.copyNode')}
            onSelect={() => {
              const element = menuElementRef.current;
              if (element) {
                handleCopyNode(element);
              }
            }}
          >
            {t('contextMenu.copyNode')}
          </MenuItem>
          <MenuItem
            icon={CopyJsonIcon}
            aria-label={t('contextMenu.copyDrawnixLite')}
            onSelect={() => {
              const element = menuElementRef.current;
              if (element) {
                handleCopyDrawnixLite(element);
              }
            }}
          >
            {t('contextMenu.copyDrawnixLite')}
          </MenuItem>
          <MenuItem
            icon={CopyJsonIcon}
            aria-label={t('contextMenu.copyMarkdown')}
            onSelect={() => {
              const element = menuElementRef.current;
              if (element) {
                handleCopyMarkdown(element);
              }
            }}
          >
            {t('contextMenu.copyMarkdown')}
          </MenuItem>
          <MenuItem
            icon={PasteNodeIcon}
            aria-label={t('contextMenu.pasteNodeAsChild')}
            onSelect={() => {
              const element = menuElementRef.current;
              if (element) {
                handlePasteNodeAsChild(element);
              }
            }}
          >
            {t('contextMenu.pasteNodeAsChild')}
          </MenuItem>
        </Menu>
      </div>
    </FloatingPortal>
  );
};
