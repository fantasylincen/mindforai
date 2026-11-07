// 展示文档解析错误，并提供语法着色、格式化和文本编辑应用能力的编辑器
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { PlaitBoard, Viewport } from '@plait/core';
import { useBoard, useListRender } from '@plait-board/react-board';
import { Dialog, DialogContent } from '../dialog/dialog';
import { useMindForAI } from '../../hooks/use-mindforai';
import { useI18n } from '../../i18n';
import { formatDocumentContents, validateDocumentContents } from '../../data/document-validation';
import { getErrorMessage, type DocumentValidationIssue } from '../../data/document-issues';
import { tokenizeDocumentLine, type DocumentTokenType } from './highlight';
import { serializeAsMindForAI } from '../../data/toon-document';
import {
  applyDocumentManifestLanguage,
  applyDocumentManifestTheme,
  applyDocumentManifestToElements,
  applyDocumentManifestViewport,
  collectDocumentManifest,
  collectDocumentManifestBase64,
} from '../../data/document-manifest';
import { getMergeManifest, resolveElementsWithManifest } from '../../data/document-open';
import type { DocumentExportedData, DocumentFormat } from '../../data/types';
import './text-editor-dialog.scss';

const MAX_HIGHLIGHT_LINES = 3000;
const LINE_HEIGHT = 20;

const getTokenClassName = (type: DocumentTokenType) => {
  return `text-editor-dialog__token text-editor-dialog__token--${type}`;
};

const getLineClassName = (hasError: boolean) => {
  return hasError
    ? 'text-editor-dialog__line text-editor-dialog__line--error'
    : 'text-editor-dialog__line';
};

export const TextEditorDialog = ({ container }: { container: HTMLElement | null }) => {
  const board = useBoard();
  const listRender = useListRender();
  const { appState, setAppState, showToast } = useMindForAI();
  const { t, language } = useI18n();
  const invalidDocument = appState.invalidDocument || null;
  const editingDocument = !!appState.editingDocument;
  const isOpen = editingDocument || !!invalidDocument;
  const activeFormat: DocumentFormat | null = editingDocument
    ? 'mindforai'
    : invalidDocument?.format || null;
  const [text, setText] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [issues, setIssues] = useState<DocumentValidationIssue[]>([]);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingDocument) {
      const manifestBase64 = collectDocumentManifestBase64(board, appState.filePath || '');
      const documentText = serializeAsMindForAI(board, manifestBase64);
      setText(documentText);
      setPreviewText(documentText);
      setIssues([]);
      return;
    }
    if (!invalidDocument) {
      return;
    }
    setText(invalidDocument.contents);
    setPreviewText(invalidDocument.contents);
    setIssues(invalidDocument.issues);
  }, [editingDocument, invalidDocument, board, appState.filePath]);

  useEffect(() => {
    if (!isOpen || !activeFormat) {
      return;
    }
    const timer = window.setTimeout(() => {
      const result = validateDocumentContents(text, activeFormat);
      setIssues(result.issues);
      setPreviewText(text);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [text, previewText, activeFormat, isOpen]);

  const deferredText = useDeferredValue(previewText);
  const lines = useMemo(() => deferredText.split('\n'), [deferredText]);
  const issueLineSet = useMemo(() => new Set(issues.map((issue) => issue.line)), [issues]);
  const shouldHighlight = lines.length <= MAX_HIGHLIGHT_LINES;

  const getLineLabel = (line: number) => {
    return language === 'zh' ? `第 ${line} 行` : `Line ${line}`;
  };

  const scrollToLine = (line: number) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const lineIndex = Math.max(0, Math.min(line - 1, lines.length - 1));
    const position = lines
      .slice(0, lineIndex)
      .reduce((total, currentLine) => total + currentLine.length + 1, 0);
    const lineLength = lines[lineIndex]?.length || 0;
    textarea.focus();
    textarea.setSelectionRange(position, position + lineLength);
    textarea.scrollTop = Math.max(0, (lineIndex - 2) * LINE_HEIGHT);
    if (preRef.current) {
      preRef.current.scrollTop = textarea.scrollTop;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  };

  const syncScroll = (target: HTMLTextAreaElement) => {
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleFormat = () => {
    if (!activeFormat) {
      return;
    }
    const formatted = formatDocumentContents(text, activeFormat);
    const result = validateDocumentContents(formatted.text, activeFormat);
    setText(formatted.text);
    setPreviewText(formatted.text);
    setIssues(result.issues);
    showToast({
      message: result.issues.length ? t('textEditor.formatFailed') : t('textEditor.formatSuccess'),
      type: result.issues.length ? 'error' : 'success',
    });
  };

  const applyStoredManifest = (data: DocumentExportedData) => {
    const manifest = getMergeManifest(data, false);
    return {
      elements: resolveElementsWithManifest(data.elements, manifest),
      manifest,
    };
  };

  const applyEditedDocument = () => {
    const result = validateDocumentContents(text, 'mindforai');
    if (!result.ok || !result.data) {
      setIssues(result.issues);
      showToast({ message: t('textEditor.stillInvalid'), type: 'error' });
      return;
    }
    const manifest = collectDocumentManifest(board, appState.filePath || '');
    const nextElements = applyDocumentManifestToElements(result.data.elements, manifest);
    board.children = nextElements;
    listRender.update(board.children, {
      board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    setAppState((currentAppState) => ({
      ...currentAppState,
      isDirty: true,
      editingDocument: false,
    }));
    showToast({ message: t('textEditor.applySuccess'), type: 'success' });
  };

  const openInvalidDocument = () => {
    if (!invalidDocument) {
      return;
    }
    const result = validateDocumentContents(text, invalidDocument.format);
    if (!result.ok || !result.data) {
      setIssues(result.issues);
      showToast({ message: t('textEditor.stillInvalid'), type: 'error' });
      return;
    }
    const data = result.data;
    if (!Array.isArray(data.elements)) {
      setIssues([{ code: 'invalidDocumentStructure', line: 1, column: 1 }]);
      showToast({ message: t('textEditor.stillInvalid'), type: 'error' });
      return;
    }
    const restored = applyStoredManifest(data);
    board.children = restored.elements;
    board.viewport = data.viewport || ({ zoom: 1 } as Viewport);
    if (data.theme) {
      board.theme = data.theme;
    }
    listRender.update(board.children, {
      board,
      parent: board,
      parentG: PlaitBoard.getElementHost(board),
    });
    applyDocumentManifestViewport(board, restored.manifest);
    applyDocumentManifestTheme(board, restored.manifest);
    const restoredLanguage = applyDocumentManifestLanguage(board, restored.manifest);
    setAppState((currentAppState) => ({
      ...currentAppState,
      filePath: invalidDocument.fileName,
      fileHandle: invalidDocument.fileHandle,
      isDirty: false,
      invalidDocument: null,
      ...(restoredLanguage ? { language: restoredLanguage } : {}),
    }));
    showToast({
      message: `${t('toast.dropFileLoaded')}${invalidDocument.fileName}`,
      type: 'success',
    });
  };

  const handleOpen = () => {
    if (editingDocument) {
      applyEditedDocument();
      return;
    }
    openInvalidDocument();
  };

  const handleClose = () => {
    if (editingDocument) {
      setAppState((currentAppState) => ({ ...currentAppState, editingDocument: false }));
      return;
    }
    setAppState((currentAppState) => ({ ...currentAppState, invalidDocument: null }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') {
      return;
    }
    const target = event.currentTarget;
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    const start = target.selectionStart;
    const end = target.selectionEnd;
    target.setRangeText('  ', start, end, 'end');
    setText(target.value);
  };

  const fileName = editingDocument
    ? appState.filePath || t('statusBar.noFile')
    : invalidDocument?.fileName || '';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="text-editor-dialog" container={container}>
        {isOpen && (
          <>
            <div className="text-editor-dialog__header">
              <h2 className="text-editor-dialog__title">
                {editingDocument ? t('textEditor.editTitle') : t('textEditor.title')}
              </h2>
              <span className="text-editor-dialog__file">{fileName}</span>
            </div>
            <p className="text-editor-dialog__description">
              {editingDocument ? t('textEditor.editDescription') : t('textEditor.description')}
            </p>
            {issues.length ? (
              <div className="text-editor-dialog__issues">
                {issues.slice(0, 8).map((issue, index) => (
                  <button
                    key={`${issue.code}-${issue.line}-${issue.column}-${index}`}
                    type="button"
                    className="text-editor-dialog__issue"
                    onClick={() => scrollToLine(issue.line)}
                  >
                    {getLineLabel(issue.line)} · {getErrorMessage(issue, t)}
                  </button>
                ))}
                {issues.length > 8 && (
                  <span className="text-editor-dialog__issue-more">+{issues.length - 8}</span>
                )}
              </div>
            ) : (
              <div className="text-editor-dialog__valid">{t('textEditor.valid')}</div>
            )}
            <div className="text-editor-dialog__editor">
              <div className="text-editor-dialog__gutter" ref={gutterRef} aria-hidden="true">
                {Array.from({ length: lines.length }, (_, index) => (
                  <div
                    key={index}
                    className={
                      issueLineSet.has(index + 1)
                        ? 'text-editor-dialog__line-number text-editor-dialog__line-number--error'
                        : 'text-editor-dialog__line-number'
                    }
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="text-editor-dialog__code">
                <pre className="text-editor-dialog__highlight" ref={preRef} aria-hidden="true">
                  {lines.map((line, index) => {
                    const tokens =
                      shouldHighlight && activeFormat
                        ? tokenizeDocumentLine(line, activeFormat)
                        : [{ text: line, type: 'plain' as const }];
                    return (
                      <div key={index} className={getLineClassName(issueLineSet.has(index + 1))}>
                        {tokens.map((token, tokenIndex) => (
                          <span key={tokenIndex} className={getTokenClassName(token.type)}>
                            {token.text}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </pre>
                <textarea
                  className="text-editor-dialog__input"
                  ref={textareaRef}
                  value={text}
                  spellCheck={false}
                  wrap="off"
                  onChange={(event) => {
                    setText(event.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onScroll={(event) => syncScroll(event.currentTarget)}
                />
              </div>
            </div>
            <div className="text-editor-dialog__actions">
              <button type="button" className="text-editor-dialog__button" onClick={handleClose}>
                {t('textEditor.close')}
              </button>
              <button type="button" className="text-editor-dialog__button" onClick={handleFormat}>
                {t('textEditor.format')}
              </button>
              <button
                type="button"
                className="text-editor-dialog__button text-editor-dialog__button--primary"
                onClick={handleOpen}
              >
                {editingDocument ? t('textEditor.apply') : t('textEditor.open')}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
