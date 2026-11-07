// 提供文件内容解析、DataURL 读取与图片类型判断等通用 Blob 工具

import { IMAGE_MIME_TYPES } from '../constants';
import { DataURL } from '../types';

export const parseFileContents = async (blob: Blob | File) => {
  let contents: string;
  if ('text' in Blob) {
    contents = await blob.text();
  } else {
    contents = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsText(blob, 'utf8');
      reader.onloadend = () => {
        if (reader.readyState === FileReader.DONE) {
          resolve(reader.result as string);
        }
      };
    });
  }
  return contents;
};

export const getDataURL = async (file: Blob | File): Promise<DataURL> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result as DataURL;
      resolve(dataURL);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const isSupportedImageFileType = (type: string | null | undefined) => {
  return !!type && (Object.values(IMAGE_MIME_TYPES) as string[]).includes(type);
};
