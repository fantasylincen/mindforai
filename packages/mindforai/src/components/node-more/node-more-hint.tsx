// UI-42 节点加减号圆形按钮的 Ctrl 快捷交互：悬浮提示与全部展开 / 折叠
import { useEffect, useRef, useState } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useBoard } from '@plait-board/react-board';
import { getElementById, PlaitBoard } from '@plait/core';
import { MindElement } from '@plait/mind';
import { useI18n } from '../../i18n';
import { NODE_MORE_HINT_DELAY_MS, NODE_MORE_HINT_VISIBLE_MS } from '../../constants';
import { collapseOrExpandAllDescendants } from '../toolbar/popup-toolbar/expand-collapse';
import './node-more-hint.scss';

type BadgeHit = {
  elementId: string;
  isCollapseBadge: boolean;
};

/**
 * 通过真实渲染的 DOM 判断鼠标是否落在节点右侧的折叠 / 展开圆形按钮上。
 */
const detectBadgeAtPoint = (clientX: number, clientY: number): BadgeHit | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const target = document.elementFromPoint(clientX, clientY);
  if (!target) {
    return null;
  }
  const badge = (target as Element).closest('.collapse-button, .expanded-button');
  if (!badge) {
    return null;
  }
  const owner = badge.closest('[plait-data-id]');
  const elementId = owner?.getAttribute('plait-data-id');
  if (!elementId) {
    return null;
  }
  return {
    elementId,
    isCollapseBadge: badge.classList.contains('collapse-button'),
  };
};

const NODE_MORE_HINT_CONSUMED_KEY = 'mindforai:node-more-ctrl-hint-consumed';

const readHintConsumed = () => {
  try {
    return window.localStorage.getItem(NODE_MORE_HINT_CONSUMED_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeHintConsumed = () => {
  try {
    window.localStorage.setItem(NODE_MORE_HINT_CONSUMED_KEY, 'true');
  } catch {}
};

type HintState = {
  visible: boolean;
  x: number;
  y: number;
  isCollapseBadge: boolean;
};

const HIDDEN_HINT: HintState = { visible: false, x: 0, y: 0, isCollapseBadge: false };

export const NodeMoreHint = () => {
  const board = useBoard();
  const { t } = useI18n();
  const [hint, setHint] = useState<HintState>(HIDDEN_HINT);
  const consumedRef = useRef(readHintConsumed());
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const hoveredBadgeRef = useRef<BadgeHit | null>(null);
  const pendingBadgeRef = useRef<BadgeHit | null>(null);

  useEffect(() => {
    const container = PlaitBoard.getBoardContainer(board);

    const clearTimers = () => {
      if (showTimerRef.current !== null) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const hideHint = () => {
      clearTimers();
      hoveredBadgeRef.current = null;
      setHint(HIDDEN_HINT);
    };

    const scheduleHint = (badge: BadgeHit, clientX: number, clientY: number) => {
      if (consumedRef.current) {
        return;
      }
      if (hoveredBadgeRef.current?.elementId === badge.elementId) {
        return;
      }
      hideHint();
      hoveredBadgeRef.current = badge;
      showTimerRef.current = window.setTimeout(() => {
        setHint({
          visible: true,
          x: clientX,
          y: clientY,
          isCollapseBadge: badge.isCollapseBadge,
        });
        hideTimerRef.current = window.setTimeout(() => {
          setHint(HIDDEN_HINT);
        }, NODE_MORE_HINT_VISIBLE_MS);
      }, NODE_MORE_HINT_DELAY_MS);
    };

    let moveRafId = 0;
    let lastMoveEvent: PointerEvent | null = null;
    const flushMove = () => {
      moveRafId = 0;
      const event = lastMoveEvent;
      lastMoveEvent = null;
      if (!event || PlaitBoard.hasBeenTextEditing(board)) {
        return;
      }
      if (hoveredBadgeRef.current) {
        return;
      }
      const badge = detectBadgeAtPoint(event.clientX, event.clientY);
      if (badge) {
        scheduleHint(badge, event.clientX, event.clientY);
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (hoveredBadgeRef.current) {
        const badge = detectBadgeAtPoint(event.clientX, event.clientY);
        if (!badge || badge.elementId !== hoveredBadgeRef.current.elementId) {
          hideHint();
        }
        return;
      }
      lastMoveEvent = event;
      if (!moveRafId) {
        moveRafId = window.requestAnimationFrame(flushMove);
      }
    };

    const handlePointerLeave = () => {
      hideHint();
    };

    const handlePointerCancel = () => {
      pendingBadgeRef.current = null;
      hideHint();
    };

    const toggleAllForBadge = (badge: BadgeHit) => {
      if (!consumedRef.current) {
        consumedRef.current = true;
        writeHintConsumed();
      }
      const element = getElementById<MindElement>(board, badge.elementId);
      if (element && MindElement.isMindElement(board, element)) {
        collapseOrExpandAllDescendants(board, element, badge.isCollapseBadge);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const badge = detectBadgeAtPoint(event.clientX, event.clientY);
      if (!badge) {
        return;
      }
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      if (!isCtrlPressed) {
        return;
      }
      // 阻止画板开始框选并阻断默认的单级折叠，Ctrl 点击改为全部展开 / 折叠
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      pendingBadgeRef.current = badge;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const badge = detectBadgeAtPoint(event.clientX, event.clientY);
      if (!badge) {
        return;
      }
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      if (!isCtrlPressed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const pendingBadge = pendingBadgeRef.current;
      pendingBadgeRef.current = null;
      if (pendingBadge) {
        toggleAllForBadge(pendingBadge);
      }
      hideHint();
    };

    container.addEventListener('pointermove', handlePointerMove, true);
    container.addEventListener('pointerleave', handlePointerLeave, true);
    container.addEventListener('pointerdown', handlePointerDown, true);
    container.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
    window.addEventListener('blur', handlePointerCancel);
    return () => {
      container.removeEventListener('pointermove', handlePointerMove, true);
      container.removeEventListener('pointerleave', handlePointerLeave, true);
      container.removeEventListener('pointerdown', handlePointerDown, true);
      container.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      window.removeEventListener('blur', handlePointerCancel);
      if (moveRafId) {
        window.cancelAnimationFrame(moveRafId);
      }
      clearTimers();
    };
  }, [board]);

  if (!hint.visible) {
    return null;
  }

  const message = hint.isCollapseBadge
    ? t('nodeMoreHint.collapseAll')
    : t('nodeMoreHint.expandAll');

  return (
    <FloatingPortal root={PlaitBoard.getBoardContainer(board)}>
      <div
        className="mindforai-node-more-hint"
        style={{ left: hint.x, top: hint.y }}
        role="tooltip"
        aria-live="polite"
      >
        {message}
      </div>
    </FloatingPortal>
  );
};
