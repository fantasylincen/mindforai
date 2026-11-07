// 校验 MindForAI 工具状态的默认值与合并逻辑
import { PlaitPointerType } from '@plait/core';
import { ArrowLineShape, BasicShapes } from '@plait/draw';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultToolState, mergeToolState } from './use-mindforai';

vi.mock('@plait/core', () => ({
  DEFAULT_COLOR: '#000000',
  PlaitPointerType: {
    hand: 'hand',
    selection: 'selection',
  },
  ThemeColorMode: {
    default: 'default',
    colorful: 'colorful',
    soft: 'soft',
    retro: 'retro',
    dark: 'dark',
    starry: 'starry',
  },
}));

vi.mock('@plait/draw', () => ({
  ArrowLineShape: {
    straight: 'straight',
  },
  BasicShapes: {
    rectangle: 'rectangle',
    diamond: 'diamond',
  },
}));

vi.mock('@plait/mind', () => ({
  MindPointerType: {
    mind: 'mind',
  },
}));

describe('mindforai tool state', () => {
  it('creates the default persistent tool state', () => {
    const toolState = createDefaultToolState();

    expect(toolState.pointer).toBe(PlaitPointerType.selection);
    expect(toolState.lastShapePointer).toBe(BasicShapes.rectangle);
    expect(toolState.lastArrowPointer).toBe(ArrowLineShape.straight);
  });

  it('merges stored partial tool state with safe defaults', () => {
    const toolState = mergeToolState({
      pointer: BasicShapes.diamond,
    });

    expect(toolState.pointer).toBe(BasicShapes.diamond);
    expect(toolState.lastShapePointer).toBe(BasicShapes.rectangle);
    expect(toolState.lastArrowPointer).toBe(ArrowLineShape.straight);
  });
});
