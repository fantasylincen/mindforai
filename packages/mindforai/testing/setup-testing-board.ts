import { BoardCreationMode, setCreationMode } from '@plait/common';
import { BoardTransforms, setupTestingBoard } from '@plait/core';
import type {
  PlaitElement,
  PlaitPlugin,
  SetupTestingBoardOptions,
  TestingBoardFixture,
} from '@plait/core';
import { mergeToolState } from '../src/hooks/use-mindforai';
import type {
  MindForAIBoard,
  MindForAIPointerType,
  MindForAIState,
  MindForAIToolState,
} from '../src/hooks/use-mindforai';

export type MindForAITestingAppStateOverrides = Partial<Omit<MindForAIState, 'toolState'>> & {
  toolState?: Partial<MindForAIToolState>;
};

export interface SetupMindForAITestingBoardOptions extends SetupTestingBoardOptions {
  appState?: MindForAITestingAppStateOverrides;
  pointer?: MindForAIPointerType;
  creationMode?: BoardCreationMode;
}

export interface MindForAITestingBoardFixture extends Omit<TestingBoardFixture, 'board'> {
  board: MindForAIBoard;
}

const createTestingAppState = (
  overrides: MindForAITestingAppStateOverrides = {}
): MindForAIState => {
  const { toolState, ...stateOverrides } = overrides;

  return {
    toolState: mergeToolState(toolState),
    isMobile: false,
    fileHandle: null,
    openCleanConfirm: false,
    invalidDocument: null,
    exportTransparent: false,
    ...stateOverrides,
  };
};

export const setupMindForAITestingBoard = (
  plugins: PlaitPlugin[],
  children: PlaitElement[] = [],
  options: SetupMindForAITestingBoardOptions = {}
): MindForAITestingBoardFixture => {
  const { appState, pointer, creationMode, ...testingBoardOptions } = options;
  const initializeMindForAIState: PlaitPlugin = (board) => {
    const mindForAIBoard = board as MindForAIBoard;
    mindForAIBoard.appState = createTestingAppState(appState);

    if (pointer !== undefined) {
      BoardTransforms.updatePointerType(mindForAIBoard, pointer);
    }
    if (creationMode !== undefined) {
      setCreationMode(mindForAIBoard, creationMode);
    }

    return mindForAIBoard;
  };

  const fixture = setupTestingBoard(
    [initializeMindForAIState, ...plugins],
    children,
    testingBoardOptions
  );

  return {
    ...fixture,
    board: fixture.board as MindForAIBoard,
  };
};
