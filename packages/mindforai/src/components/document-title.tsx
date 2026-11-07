// UI-01 顶部工具栏中的文档标题，展示当前文件名并提供关闭当前文件的操作
import classNames from 'classnames';
import { useBoard, useListRender } from '@plait-board/react-board';
import { useMindForAI } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import { resetBoardToInitialState } from '../data/document-reset';
import { CloseIcon } from './icons';
import './document-title.scss';

export const DocumentTitle = () => {
  const board = useBoard();
  const listRender = useListRender();
  const { appState, setAppState } = useMindForAI();
  const { t } = useI18n();
  const fileName = appState.filePath || '';

  if (!fileName) {
    return null;
  }

  const closeDocument = () => {
    resetBoardToInitialState(board, listRender);
    setAppState((currentAppState) => ({
      ...currentAppState,
      filePath: null,
      fileHandle: null,
      isDirty: false,
      autoSave: false,
      editingDocument: false,
      invalidDocument: null,
      linkState: null,
      openCleanConfirm: false,
    }));
  };

  return (
    <span
      className={classNames('document-title')}
      data-testid="document-title"
      title={fileName}
    >
      <span className="document-title__text">{fileName}</span>
      {appState.isDirty && <span className="document-title__dot"></span>}
      <button
        type="button"
        className="document-title__close"
        title={t('documentTitle.close')}
        aria-label={t('documentTitle.close')}
        data-testid="document-title-close"
        onClick={closeDocument}
      >
        {CloseIcon}
      </button>
    </span>
  );
};
