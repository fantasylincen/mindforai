// 左下角文档状态栏，显示当前文件路径、保存状态与自动保存开关
import classNames from 'classnames';
import { ATTACHED_ELEMENT_CLASS_NAME, PlaitBoard } from '@plait/core';
import { useBoard } from '@plait-board/react-board';
import { useEffect, useRef } from 'react';
import { useMindForAI, type MindForAIBoard } from '../hooks/use-mindforai';
import { useI18n } from '../i18n';
import { saveDocumentToCurrentFile, isFileHandleWritable } from '../data/document-save';
import { NodeFingerprintStatus } from './node-fingerprint-status';
import './document-status-bar.scss';

export const DocumentStatusBar = () => {
  const board = useBoard();
  const { appState, setAppState } = useMindForAI();
  const { t } = useI18n();
  const { filePath, fileHandle, isDirty } = appState;
  const autoSave = !!appState.autoSave;
  const pathText = filePath || t('statusBar.noFile');
  const hasLocalFile = !!fileHandle;
  const statusText = isDirty
    ? t('statusBar.unsaved')
    : hasLocalFile
      ? t('statusBar.saved')
      : t('statusBar.localOnly');
  const autoSaveRef = useRef(autoSave);
  const isDirtyRef = useRef(isDirty);
  const fileHandleRef = useRef(fileHandle);
  const isAutoSavingRef = useRef(false);
  autoSaveRef.current = autoSave;
  isDirtyRef.current = isDirty;
  fileHandleRef.current = fileHandle;

  const triggerAutoSave = () => {
    const currentAppState = (board as MindForAIBoard).appState;
    const shouldSave =
      autoSaveRef.current &&
      !!fileHandleRef.current &&
      (isDirtyRef.current || !!currentAppState?.isDirty);
    if (!shouldSave || isAutoSavingRef.current || PlaitBoard.hasBeenTextEditing(board)) {
      return;
    }
    isAutoSavingRef.current = true;
    saveDocumentToCurrentFile(board, {
      silent: true,
    }).finally(() => {
      isAutoSavingRef.current = false;
    });
  };
  const triggerAutoSaveRef = useRef(triggerAutoSave);
  triggerAutoSaveRef.current = triggerAutoSave;

  useEffect(() => {
    if (!board || !autoSave || !fileHandle) {
      return;
    }
    let boardContainer: HTMLElement;
    try {
      boardContainer = PlaitBoard.getBoardContainer(board) as HTMLElement;
    } catch {
      return;
    }
    const handlePointerUp = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !boardContainer.contains(target)) {
        return;
      }
      triggerAutoSaveRef.current();
    };
    const handleFocusOut = () => {
      if (!PlaitBoard.hasBeenTextEditing(board)) {
        triggerAutoSaveRef.current();
      }
    };
    let wasEditing = PlaitBoard.hasBeenTextEditing(board);
    const editingStateTimer = window.setInterval(() => {
      const isEditing = PlaitBoard.hasBeenTextEditing(board);
      if (wasEditing && !isEditing) {
        triggerAutoSaveRef.current();
      }
      wasEditing = isEditing;
    }, 250);
    boardContainer.addEventListener('pointerup', handlePointerUp, true);
    boardContainer.addEventListener('focusout', handleFocusOut, true);
    return () => {
      window.clearInterval(editingStateTimer);
      boardContainer.removeEventListener('pointerup', handlePointerUp, true);
      boardContainer.removeEventListener('focusout', handleFocusOut, true);
    };
  }, [board, autoSave, fileHandle]);

  useEffect(() => {
    if (!board || !autoSave || !fileHandle || !isDirty) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!PlaitBoard.hasBeenTextEditing(board)) {
        triggerAutoSaveRef.current();
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [board, autoSave, fileHandle, isDirty]);

  return (
    <div
      className={classNames('document-status-bar', ATTACHED_ELEMENT_CLASS_NAME)}
      data-testid="document-status-bar"
    >
      <span
        className={classNames('document-status-bar__indicator', {
          'document-status-bar__indicator--dirty': isDirty,
        })}
      ></span>
      <span className="document-status-bar__path" title={pathText}>
        {pathText}
      </span>
      <span className="document-status-bar__status">{statusText}</span>
      <NodeFingerprintStatus />
      <label className="document-status-bar__auto-save" title={t('statusBar.autoSaveHint')}>
        <input
          className="document-status-bar__auto-save-input"
          type="checkbox"
          checked={autoSave}
          data-testid="auto-save-toggle"
          onChange={(event) => {
            const nextAutoSave = event.target.checked;
            setAppState((currentAppState) => ({
              ...currentAppState,
              autoSave: nextAutoSave,
            }));
            if (nextAutoSave && fileHandle) {
              isFileHandleWritable(fileHandle).catch(() => false);
            }
          }}
        />
        <span className="document-status-bar__auto-save-label">{t('statusBar.autoSave')}</span>
      </label>
    </div>
  );
};
