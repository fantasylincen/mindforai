import Stack from '../../stack';
import {
  ATTACHED_ELEMENT_CLASS_NAME,
  getRectangleByElements,
  getSelectedElements,
  isDragging,
  isMovingElements,
  isSelectionMoving,
  PlaitBoard,
  PlaitElement,
  RectangleClient,
  toHostPointFromViewBoxPoint,
  toScreenPointFromHostPoint,
} from '@plait/core';
import { useEffect, useRef, useState } from 'react';
import { useBoard } from '@plait-board/react-board';
import { flip, offset, useFloating } from '@floating-ui/react';
import { Island } from '../../island';
import classNames from 'classnames';
import { useI18n } from '../../../i18n';
import { getStrokeColorByElement as getStrokeColorByMindElement, MindElement } from '@plait/mind';
import './popup-toolbar.scss';
import {
  ArrowLineHandle,
  getStrokeColorByElement as getStrokeColorByDrawElement,
  getStrokeStyleByElement,
  isClosedCustomGeometry,
  isClosedDrawElement,
  PlaitDrawElement,
} from '@plait/draw';
import { StrokeStyle } from '@plait/common';
import { PopupStrokeButton } from './stroke-button';
import { PopupFillButton } from './fill-button';
import { isWhite, removeHexAlpha } from '../../../utils/color';
import { ArrowMarkButton } from './arrow-mark-button';
import { isMindElementWithChildren, PopupExpandCollapseButtons } from './expand-collapse-buttons';
import { canInsertMermaidFlowchart, PopupInsertMermaidButton } from './insert-mermaid-button';

export const PopupToolbar = () => {
  const board = useBoard();
  const { t } = useI18n();
  const selectedElements = getSelectedElements(board);
  const [movingOrDragging, setMovingOrDragging] = useState(false);
  const movingOrDraggingRef = useRef(movingOrDragging);
  const hasImage = selectedElements.some(PlaitDrawElement.isImage);
  const showExpandCollapse = isMindElementWithChildren(board);
  const showInsertMermaid = canInsertMermaidFlowchart(board);
  const open = selectedElements.length > 0 && !isSelectionMoving(board);
  const { viewport, selection, children } = board;
  const { refs, floatingStyles } = useFloating({
    placement: 'right-start',
    middleware: [offset(32), flip()],
  });
  let state: {
    fill: string | undefined;
    strokeColor?: string;
    strokeStyle?: StrokeStyle;
    hasFill?: boolean;
    hasStroke?: boolean;
    hasStrokeStyle?: boolean;
    // Line state
    isLine?: boolean;
    source?: ArrowLineHandle;
    target?: ArrowLineHandle;
  } = {
    fill: 'red',
  };
  if (open && !movingOrDragging && !hasImage) {
    const hasFill =
      selectedElements.some((value) => hasFillProperty(board, value)) &&
      !PlaitBoard.hasBeenTextEditing(board);
    const hasStroke =
      selectedElements.some((value) => hasStrokeProperty(board, value)) &&
      !PlaitBoard.hasBeenTextEditing(board);
    const hasStrokeStyle =
      selectedElements.some((value) => hasStrokeStyleProperty(board, value)) &&
      !PlaitBoard.hasBeenTextEditing(board);
    const isLine = selectedElements.every((value) => PlaitDrawElement.isArrowLine(value));
    state = {
      ...getElementState(board),
      hasFill,
      hasStroke,
      hasStrokeStyle,
      isLine,
    };
  }
  useEffect(() => {
    if (open) {
      const hasSelected = selectedElements.length > 0;
      if (!movingOrDragging && hasSelected) {
        const elements = getSelectedElements(board);
        const rectangle = getRectangleByElements(board, elements, false);
        const [start, end] = RectangleClient.getPoints(rectangle);
        const screenStart = toScreenPointFromHostPoint(
          board,
          toHostPointFromViewBoxPoint(board, start)
        );
        const screenEnd = toScreenPointFromHostPoint(
          board,
          toHostPointFromViewBoxPoint(board, end)
        );
        const width = screenEnd[0] - screenStart[0];
        const height = screenEnd[1] - screenStart[1];
        refs.setPositionReference({
          getBoundingClientRect() {
            return {
              width,
              height,
              x: screenStart[0],
              y: screenStart[1],
              top: screenStart[1],
              left: screenStart[0],
              right: screenStart[0] + width,
              bottom: screenStart[1] + height,
            };
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, selection, children, movingOrDragging]);

  useEffect(() => {
    movingOrDraggingRef.current = movingOrDragging;
  }, [movingOrDragging]);

  useEffect(() => {
    const { pointerUp, pointerMove } = board;

    board.pointerMove = (event: PointerEvent) => {
      if ((isMovingElements(board) || isDragging(board)) && !movingOrDraggingRef.current) {
        setMovingOrDragging(true);
      }
      pointerMove(event);
    };

    board.pointerUp = (event: PointerEvent) => {
      if (movingOrDraggingRef.current && (isMovingElements(board) || isDragging(board))) {
        setMovingOrDragging(false);
      }
      pointerUp(event);
    };

    return () => {
      board.pointerUp = pointerUp;
      board.pointerMove = pointerMove;
    };
  }, [board]);

  return (
    <>
      {open && !movingOrDragging && (
        <Island
          padding={1}
          className={classNames('popup-toolbar', ATTACHED_ELEMENT_CLASS_NAME)}
          ref={refs.setFloating}
          style={floatingStyles}
        >
          <Stack.Row gap={1}>
            {state.hasStroke && (
              <PopupStrokeButton
                board={board}
                key={1}
                currentColor={state.strokeColor}
                currentStyle={state.strokeStyle}
                title={t('popupToolbar.stroke')}
                hasStrokeStyle={state.hasStrokeStyle || false}
              >
                <label
                  className={classNames('stroke-label', 'color-label')}
                  style={{ borderColor: state.strokeColor }}
                ></label>
              </PopupStrokeButton>
            )}
            {state.hasFill && (
              <PopupFillButton
                board={board}
                key={2}
                currentColor={state.fill}
                title={t('popupToolbar.fillColor')}
              >
                <label
                  className={classNames('fill-label', 'color-label', {
                    'color-white': state.fill && isWhite(removeHexAlpha(state.fill)),
                  })}
                  style={{ backgroundColor: state.fill }}
                ></label>
              </PopupFillButton>
            )}
            {state.isLine && (
              <>
                <ArrowMarkButton board={board} key={4} end={'source'} endProperty={state.source} />
                <ArrowMarkButton board={board} key={5} end={'target'} endProperty={state.target} />
              </>
            )}
            {showExpandCollapse && (
              <PopupExpandCollapseButtons board={board} key={7}></PopupExpandCollapseButtons>
            )}
            {showInsertMermaid && (
              <PopupInsertMermaidButton board={board} key={8}></PopupInsertMermaidButton>
            )}
          </Stack.Row>
        </Island>
      )}
    </>
  );
};

export const getMindElementState = (board: PlaitBoard, element: MindElement) => {
  return {
    fill: element.fill,
    strokeColor: getStrokeColorByMindElement(board, element),
    strokeStyle: getStrokeStyleByElement(board, element),
  };
};

export const getDrawElementState = (board: PlaitBoard, element: PlaitDrawElement) => {
  return {
    fill: element.fill,
    strokeColor: getStrokeColorByDrawElement(board, element),
    strokeStyle: getStrokeStyleByElement(board, element),
    source: element?.source || {},
    target: element?.target || {},
  };
};

export const getElementState = (board: PlaitBoard) => {
  const selectedElement = getSelectedElements(board)[0];
  if (MindElement.isMindElement(board, selectedElement)) {
    return getMindElementState(board, selectedElement);
  }
  return getDrawElementState(board, selectedElement as PlaitDrawElement);
};

export const hasFillProperty = (board: PlaitBoard, element: PlaitElement) => {
  if (MindElement.isMindElement(board, element)) {
    return true;
  }
  if (isClosedCustomGeometry(board, element)) {
    return true;
  }
  if (PlaitDrawElement.isDrawElement(element)) {
    return (
      PlaitDrawElement.isShapeElement(element) &&
      !PlaitDrawElement.isImage(element) &&
      !PlaitDrawElement.isText(element) &&
      isClosedDrawElement(element)
    );
  }
  return false;
};

export const hasStrokeProperty = (board: PlaitBoard, element: PlaitElement) => {
  if (MindElement.isMindElement(board, element)) {
    return true;
  }
  if (PlaitDrawElement.isDrawElement(element)) {
    return (
      (PlaitDrawElement.isShapeElement(element) &&
        !PlaitDrawElement.isImage(element) &&
        !PlaitDrawElement.isText(element)) ||
      PlaitDrawElement.isArrowLine(element) ||
      PlaitDrawElement.isVectorLine(element) ||
      PlaitDrawElement.isTable(element)
    );
  }
  return false;
};

export const hasStrokeStyleProperty = (board: PlaitBoard, element: PlaitElement) => {
  return hasStrokeProperty(board, element);
};
