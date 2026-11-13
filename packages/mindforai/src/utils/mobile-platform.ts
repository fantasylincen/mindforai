// UTIL-12 判定当前是否为触摸优先的移动端平台，供移动端布局与文件选择器共用
export const isTouchMobilePlatform = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || '';
  if (/iPad|iPhone|iPod|Android|Mobile|Tablet/i.test(userAgent)) {
    return true;
  }
  return (navigator.maxTouchPoints || 0) > 1 && /Macintosh/.test(userAgent);
};
