// DATA-13 图片元素插入、图片地址协议校验与命中检测相关数据操作
import { getHitElementByPoint, getSelectedElements, PlaitBoard, Point } from '@plait/core';
import { DataURL } from '../types';
import { getDataURL } from './blob';
import { MindElement, MindTransforms } from '@plait/mind';
import { DrawTransforms } from '@plait/draw';
import { getElementOfFocusedImage } from '@plait/common';

const SAFE_IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

export const getSafeImageSource = (source: string | null | undefined) => {
  if (!source) {
    return '';
  }
  const trimmed = source.trim();
  if (/^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed;
  }
  try {
    return SAFE_IMAGE_PROTOCOLS.has(new URL(trimmed).protocol) ? trimmed : '';
  } catch {
    return '';
  }
};

export const loadHTMLImageElement = (dataURL: DataURL) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (error) => {
      reject(error);
    };
    image.src = dataURL;
  });
};

export const buildImage = (image: HTMLImageElement, dataURL: DataURL, maxWidth: number) => {
  const width = image.width > maxWidth ? maxWidth : image.width;
  const height = (width / image.width) * image.height;
  return {
    url: dataURL,
    width,
    height,
  };
};

export const insertImage = async (
  board: PlaitBoard,
  imageFile: File,
  startPoint?: Point,
  isDrop?: boolean
) => {
  const selectedElement = getSelectedElements(board)[0] || getElementOfFocusedImage(board);
  const defaultImageWidth = selectedElement ? 240 : 400;
  const dataURL = await getDataURL(imageFile);
  const image = await loadHTMLImageElement(dataURL);
  const imageItem = buildImage(image, dataURL, defaultImageWidth);
  const element = startPoint && getHitElementByPoint(board, startPoint);
  if (isDrop && element && MindElement.isMindElement(board, element)) {
    MindTransforms.setImage(board, element as MindElement, imageItem);
    return;
  }
  if (selectedElement && MindElement.isMindElement(board, selectedElement) && !isDrop) {
    MindTransforms.setImage(board, selectedElement as MindElement, imageItem);
  } else {
    DrawTransforms.insertImage(board, imageItem, startPoint);
  }
};
