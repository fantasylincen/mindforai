import { getSelectedElements, PlaitBoard, toSvgData } from '@plait/core';
import { base64ToBlob, boardToImage, download } from './common';
import { getBackgroundColor } from './color';
import { TRANSPARENT } from '../constants/color';
import type { MindForAIBoard } from '../hooks/use-mindforai';

type ExportElements = ReturnType<typeof getSelectedElements>;

const getSvgBlob = async (board: PlaitBoard, isTransparent: boolean, elements?: ExportElements) => {
  const backgroundColor = getBackgroundColor(board) || 'white';
  const fillStyle = isTransparent ? TRANSPARENT : backgroundColor;
  const svgData = await toSvgData(board, {
    fillStyle,
    padding: 20,
    ratio: 4,
    elements,
    inlineStyleClassNames: '.plait-text-container',
    styleNames: ['position'],
  });
  return new Blob([svgData], { type: 'image/svg+xml' });
};

const getImageBlob = async (
  board: PlaitBoard,
  isTransparent: boolean,
  elements?: ExportElements
) => {
  const backgroundColor = getBackgroundColor(board) || 'white';
  const imageDataUrl = await boardToImage(board, {
    elements,
    fillStyle: isTransparent ? 'transparent' : backgroundColor,
  });
  return imageDataUrl ? base64ToBlob(imageDataUrl) : null;
};

export const saveAsSvg = (board: PlaitBoard) => {
  const exportTransparent = !!(board as MindForAIBoard).appState?.exportTransparent;
  const selectedElements = getSelectedElements(board);
  return getSvgBlob(
    board,
    exportTransparent,
    selectedElements.length > 0 ? selectedElements : undefined
  ).then((blob) => {
    const imageName = `mindforai-${new Date().getTime()}.svg`;
    download(blob, imageName);
  });
};

export const saveAsPng = (board: PlaitBoard) => {
  const exportTransparent = !!(board as MindForAIBoard).appState?.exportTransparent;
  const selectedElements = getSelectedElements(board);
  getImageBlob(
    board,
    exportTransparent,
    selectedElements.length > 0 ? selectedElements : undefined
  ).then((imageBlob) => {
    if (imageBlob) {
      const ext = 'png';
      const imageName = `mindforai-${new Date().getTime()}.${ext}`;
      download(imageBlob, imageName);
    }
  });
};
