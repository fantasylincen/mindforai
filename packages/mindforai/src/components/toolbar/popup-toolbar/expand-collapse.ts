// UI-18 提供思维导图节点的全部展开与全部折叠能力，并对外提供获取全部后代的公共方法
import { PlaitBoard, Transforms } from '@plait/core';
import { MindElement, PlaitMind } from '@plait/mind';

const collectDescendants = (element: MindElement, visited: Set<string>, result: MindElement[]) => {
  for (const child of element.children || []) {
    const mindChild = child as MindElement;
    if (!mindChild?.id || visited.has(mindChild.id)) {
      continue;
    }
    visited.add(mindChild.id);
    result.push(mindChild);
    collectDescendants(mindChild, visited, result);
  }
};

/**
 * 获取当前节点下的所有层级子节点（后代节点）。
 * 深度优先递归收集所有子孙节点，以扁平化数组返回，不包含当前节点本身。
 */
export const getAllDescendants = (element: MindElement): MindElement[] => {
  const result: MindElement[] = [];
  if (element) {
    collectDescendants(element, new Set<string>(), result);
  }
  return result;
};

const findPathSafely = (board: PlaitBoard, element: MindElement): number[] | null => {
  try {
    return PlaitBoard.findPath(board, element);
  } catch {
    return null;
  }
};

const setCollapsedAtPath = (board: PlaitBoard, path: number[] | null, isCollapsed: boolean) => {
  if (!path) {
    return;
  }
  Transforms.setNode(board, { isCollapsed }, path);
};

/**
 * 折叠或展开当前节点的下一级子节点（第一层）。
 */
export const collapseOrExpandChildren = (
  board: PlaitBoard,
  element: MindElement,
  isCollapsed: boolean
) => {
  if (!element?.id || !element.children?.length) {
    return;
  }
  setCollapsedAtPath(board, findPathSafely(board, element), isCollapsed);
};

/**
 * 把当前节点的所有层级子孙节点统统折叠或展开至叶子节点。
 * 先一次性计算全部后代路径再统一写入，避免父节点折叠后深层节点路径失效；
 * 保留被选中节点本身展开（尤其是根节点，Plait 不提供根节点折叠气泡），从而始终可以再次展开。
 */
export const collapseOrExpandAllDescendants = (
  board: PlaitBoard,
  element: MindElement,
  isCollapsed: boolean
) => {
  if (!element?.id) {
    return;
  }
  const descendantPaths: number[][] = [];
  for (const descendant of getAllDescendants(element)) {
    if (!descendant.children?.length) {
      continue;
    }
    const path = findPathSafely(board, descendant);
    if (path) {
      descendantPaths.push(path);
    }
  }
  const rootPath = findPathSafely(board, element);
  const keepRootExpanded = PlaitMind.isMind(element);

  for (const path of descendantPaths) {
    setCollapsedAtPath(board, path, isCollapsed);
  }

  if (isCollapsed && keepRootExpanded) {
    setCollapsedAtPath(board, rootPath, false);
    return;
  }
  setCollapsedAtPath(board, rootPath, isCollapsed);
};