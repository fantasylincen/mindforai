// 验证没有清单文件时默认只展开到第三级节点
import { describe, expect, it } from 'vitest';
import { PlaitElement } from '@plait/core';
import { applyDefaultVisibleLevels } from './document-expansion';

const buildChainElements = () => {
  const levelFour = { id: 'l4', children: [], data: { topic: { children: [{ text: 'L4' }] } } };
  const levelThree = {
    id: 'l3',
    children: [levelFour],
    data: { topic: { children: [{ text: 'L3' }] } },
  };
  const levelTwo = {
    id: 'l2',
    children: [levelThree],
    data: { topic: { children: [{ text: 'L2' }] } },
  };
  return [
    { id: 'l1', children: [levelTwo], data: { topic: { children: [{ text: 'L1' }] } } },
  ] as unknown as PlaitElement[];
};

describe('default visible levels', () => {
  it('keeps the first three levels expanded and collapses the third level node', () => {
    const elements = applyDefaultVisibleLevels(buildChainElements(), 3) as any[];

    expect(elements[0].isCollapsed).toBeUndefined();
    expect(elements[0].children[0].isCollapsed).toBeUndefined();
    expect(elements[0].children[0].children[0].isCollapsed).toBe(true);
    expect(elements[0].children[0].children[0].children[0].isCollapsed).toBeUndefined();
  });

  it('keeps every level expanded when the requested level count is not positive', () => {
    const elements = applyDefaultVisibleLevels(buildChainElements(), 0) as any[];

    expect(elements[0].isCollapsed).toBeUndefined();
    expect(elements[0].children[0].children[0].isCollapsed).toBeUndefined();
  });
});
