// DESK-10 桌面版按文本保存未激活标签页：直接调用宿主文件通道写入磁盘
import { getDesktopApi } from './bridge';
import { getTabBaseName, type DesktopTab } from './tab-model';

const resolveExtension = (tab: DesktopTab) => {
  const match = /\.([^.\\/]+)$/.exec(tab.path || '');
  return match ? match[1].toLowerCase() : 'toon';
};

export const saveTabTextToPath = async (tab: DesktopTab): Promise<boolean> => {
  const api = getDesktopApi();
  if (!api) {
    return false;
  }
  const result = await api.saveDocument({
    text: tab.text,
    name: getTabBaseName(tab),
    extension: resolveExtension(tab),
    path: tab.path,
    saveAs: !tab.path,
  });
  return !result.cancelled && !result.error && !!result.path;
};
