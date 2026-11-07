// MH-04 为思维导图节点提供 Mermaid 流程图渲染、编辑入口与上下文更新保护
import {
  PlaitBoard,
  PlaitElement,
  RectangleClient,
  createForeignObject,
  createG,
  toHostPoint,
  toViewBoxPoint,
} from '@plait/core';
import {
  MIND_ELEMENT_TO_NODE,
  MindNodeComponent,
  PlaitMind,
  PlaitMindComponent,
} from '@plait/mind';
import {
  getMermaidDefinition,
  getMermaidMindRenderRectangle,
  isMermaidMindElementForBoard,
} from '../mermaid-mind';
import { enterMermaidMindEditing } from '../mermaid-mind-editing';
import { syncMermaidMindElement } from '../mermaid-mind-sync';
import type { MermaidMindProps } from './with-mind-extend';

const MERMAID_MIND_CLASS_NAME = 'mindforai-mermaid-mind';

export { isMermaidMindElementForBoard };

class MermaidMindRenderer {
  private mermaidG: SVGGElement | null = null;
  private mermaidRef: {
    destroy: () => void;
    update: (props: Partial<MermaidMindProps>) => void;
  } | null = null;
  private editing = false;

  constructor(private component: MindNodeComponent) {}

  draw() {
    if (this.editing) {
      return;
    }
    this.destroy();
    const definition = getMermaidDefinition(this.component.element);
    if (!definition) {
      this.setTextVisible(true);
      return;
    }
    this.setTextVisible(false);
    const rectangle = this.getMermaidMindRectangle();
    const g = createG();
    g.classList.add(MERMAID_MIND_CLASS_NAME);
    const foreignObject = createForeignObject(
      rectangle.x,
      rectangle.y,
      rectangle.width,
      rectangle.height
    );
    g.append(foreignObject);
    this.component.getElementG().append(g);
    this.mermaidG = g;
    const board = this.component.board as unknown as PlaitBoard & {
      renderMermaidMind: (
        container: Element | DocumentFragment,
        props: MermaidMindProps
      ) => { destroy: () => void; update: (props: Partial<MermaidMindProps>) => void };
    };
    this.mermaidRef = board.renderMermaidMind(foreignObject, {
      board,
      mermaid: definition,
      width: rectangle.width,
      height: rectangle.height,
      onRendered: () => {
        syncMermaidMindElement(this.component.board, this.component.element, true);
      },
    });
  }

  onContextChanged(previous: any) {
    if (this.editing || !PlaitElement.hasMounted(this.component.element)) {
      return;
    }
    const previousMermaid = getMermaidDefinition(previous?.element);
    const currentMermaid = getMermaidDefinition(this.component.element);
    if (!this.mermaidG || previousMermaid !== currentMermaid) {
      this.draw();
    } else {
      this.updateMermaidMindRect();
    }
  }

  setEditing(editing: boolean) {
    if (this.editing === editing) {
      return;
    }
    this.editing = editing;
    if (editing) {
      this.destroy();
      this.setTextVisible(true);
    } else {
      this.draw();
    }
  }

  destroy() {
    if (this.mermaidRef) {
      this.mermaidRef.destroy();
      this.mermaidRef = null;
    }
    if (this.mermaidG) {
      this.mermaidG.remove();
      this.mermaidG = null;
    }
  }

  private setTextVisible(visible: boolean) {
    const textManage = this.component.textManage;
    if (textManage?.g) {
      textManage.g.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  getMermaidMindRectangle() {
    return getMermaidMindRenderRectangle(this.component.node);
  }

  private updateMermaidMindRect() {
    const definition = getMermaidDefinition(this.component.element);
    if (!this.mermaidG || !definition) {
      return;
    }
    const foreignObject = this.mermaidG.querySelector('foreignObject');
    if (!foreignObject) {
      return;
    }
    const rectangle = this.getMermaidMindRectangle();
    foreignObject.setAttribute('x', `${rectangle.x}`);
    foreignObject.setAttribute('y', `${rectangle.y}`);
    foreignObject.setAttribute('width', `${rectangle.width}`);
    foreignObject.setAttribute('height', `${rectangle.height}`);
    this.mermaidRef?.update({
      mermaid: definition,
      width: rectangle.width,
      height: rectangle.height,
    });
  }
}

type MindNodeComponentClass = new () => MindNodeComponent;

const withMermaidMind = (Base: MindNodeComponentClass) =>
  class extends Base {
    private mermaidRenderer: MermaidMindRenderer | null = null;
    private dblClickTarget: SVGGElement | null = null;
    private isMermaidMode = false;

    get hasChildren() {
      if (this.isMermaidMode) {
        return false;
      }
      return super.hasChildren;
    }

    initialize() {
      super.initialize();
      this.isMermaidMode = isMermaidMindElementForBoard(this.element);
      if (!this.isMermaidMode) {
        return;
      }
      this.mermaidRenderer = new MermaidMindRenderer(this);
      this.patchNodeMore();
      this.patchTextEditing();
      this.patchDblClickEditing();
      this.mermaidRenderer.draw();
    }

    onContextChanged(value: any, previous: any) {
      if (!MIND_ELEMENT_TO_NODE.has(this.element)) {
        return;
      }
      super.onContextChanged(value, previous);
      this.mermaidRenderer?.onContextChanged(previous);
    }

    destroy() {
      this.dblClickTarget?.removeEventListener('dblclick', this.onDblClick);
      this.dblClickTarget = null;
      this.mermaidRenderer?.destroy();
      super.destroy();
    }

    /**
     * The rendered flowchart is drawn above the topic of the node, the double click is
     * handled by the element group to make sure that every position of the rendered
     * flowchart can be switched to the editable text state.
     */
    private patchDblClickEditing() {
      if (PlaitMind.isMind(this.element) && !this.isMermaidMode) {
        return;
      }
      this.dblClickTarget = this.getElementG();
      this.dblClickTarget.addEventListener('dblclick', this.onDblClick);
    }

    private onDblClick = (event: MouseEvent) => {
      const board = this.board as PlaitBoard;
      if (PlaitBoard.isReadonly(board) || PlaitBoard.hasBeenTextEditing(board)) {
        return;
      }
      if (!isMermaidMindElementForBoard(this.element)) {
        return;
      }
      if (!this.mermaidRenderer) {
        return;
      }
      const point = toViewBoxPoint(board, toHostPoint(board, event.clientX, event.clientY));
      const rectangle = this.mermaidRenderer.getMermaidMindRectangle();
      if (!RectangleClient.isHit(RectangleClient.getRectangleByPoints([point, point]), rectangle)) {
        return;
      }
      event.stopPropagation();
      enterMermaidMindEditing(board, this.element);
    };

    /**
     * A flowchart node is a terminal node, so the add button should never be rendered for it.
     */
    private patchNodeMore() {
      const nodeMoreGenerator = this.nodeMoreGenerator;
      const originalCanDraw = nodeMoreGenerator.canDraw.bind(nodeMoreGenerator);
      nodeMoreGenerator.canDraw = (element, data) => {
        if (isMermaidMindElementForBoard(element)) {
          return false;
        }
        return originalCanDraw(element, data);
      };
      nodeMoreGenerator.destroy();
    }

    /**
     * Double click on a flowchart node switches it to the editable text state, the flowchart
     * definition is the text of the node, so it can be modified directly.
     */
    private patchTextEditing() {
      const textManage = this.textManage;
      if (!textManage || !this.mermaidRenderer || (textManage as any).__mermaidMindPatched) {
        return;
      }
      const originalEdit = textManage.edit.bind(textManage);
      textManage.edit = (callback, exitEdit) => {
        if (textManage.isEditing) {
          // the node is already editable, keep the current editing state
          return textManage.exitCallback ?? (() => {});
        }
        const isFlowchart = !!getMermaidDefinition(this.element);
        const renderer = this.mermaidRenderer;
        if (!renderer) {
          return originalEdit(callback, exitEdit);
        }
        renderer.setEditing(true);
        return originalEdit(
          () => {
            renderer.setEditing(false);
            callback?.();
            if (isFlowchart) {
              setTimeout(() => {
                syncMermaidMindElement(this.board, this.element, true);
              }, 0);
            }
          },
          (event) => {
            if (
              isFlowchart &&
              event instanceof KeyboardEvent &&
              event.key === 'Enter' &&
              !event.shiftKey
            ) {
              return false;
            }
            return exitEdit ? exitEdit(event) : false;
          }
        );
      };
      (textManage as any).__mermaidMindPatched = true;
    }
  };

/**
 * The components are cast to the base component type, the anonymous class of the mixin can
 * not be described in the generated type declarations.
 */
export const MermaidMindNodeComponent = withMermaidMind(
  MindNodeComponent
) as new () => MindNodeComponent;

export const MermaidMindRootComponent = withMermaidMind(
  PlaitMindComponent
) as new () => MindNodeComponent;
