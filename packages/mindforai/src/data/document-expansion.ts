// DATA-26 没有清单文件时按可见层级折叠节点，默认只展开到第三级
import { PlaitElement } from '@plait/core';

export const DEFAULT_VISIBLE_LEVEL_COUNT = 3;

const collapseNodesBelowVisibleLevel = (
  elements: PlaitElement[],
  depth: number,
  visibleLevelCount: number
) => {
  for (const element of elements) {
    const record = element as unknown as { children?: PlaitElement[]; isCollapsed?: boolean };
    const children = Array.isArray(record.children) ? record.children : [];
    if (!children.length) {
      continue;
    }
    if (depth + 1 >= visibleLevelCount) {
      record.isCollapsed = true;
    }
    collapseNodesBelowVisibleLevel(children, depth + 1, visibleLevelCount);
  }
};

export const applyDefaultVisibleLevels = <T extends PlaitElement>(
  elements: T[],
  visibleLevelCount: number = DEFAULT_VISIBLE_LEVEL_COUNT
): T[] => {
  if (visibleLevelCount > 0) {
    collapseNodesBelowVisibleLevel(elements, 0, visibleLevelCount);
  }
  return elements;
};
