// UI-45 在所有思维导图节点中搜索文本，显示匹配数量并支持上下定位与高亮
import { useEffect, useRef, useState } from 'react';
import { useBoard } from '@plait-board/react-board';
import { CloseIcon, SearchIcon } from '../icons';
import { useMindForAI } from '../../hooks/use-mindforai';
import { useI18n } from '../../i18n';
import {
  clearNodeMatchHighlight,
  clearNodeSelection,
  findNodeMatches,
  revealNodeMatch,
  type NodeSearchMatch,
} from '../../data/node-search';
import './search-panel.scss';

export const SearchPanel = () => {
  const board = useBoard();
  const { appState, setAppState } = useMindForAI();
  const { t } = useI18n();
  const open = !!appState.openSearch;
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<NodeSearchMatch[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setMatches(findNodeMatches(board, query));
  }, [board, board.children, open, query]);

  useEffect(() => {
    setActiveIndex(-1);
    if (!query.trim()) {
      clearNodeMatchHighlight();
      clearNodeSelection(board);
    }
  }, [board, query, open]);

  useEffect(() => {
    if (!open) {
      clearNodeMatchHighlight();
      clearNodeSelection(board);
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [board, open]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        clearNodeMatchHighlight();
        clearNodeSelection(board);
        setAppState((currentAppState) => ({ ...currentAppState, openSearch: false }));
        return;
      }
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) {
        return;
      }
      if (event.key.toLowerCase() !== 'f') {
        return;
      }
      event.preventDefault();
      setAppState((currentAppState) =>
        currentAppState.openSearch
          ? currentAppState
          : { ...currentAppState, openSearch: true }
      );
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [board, open, setAppState]);

  const close = () => {
    clearNodeMatchHighlight();
    clearNodeSelection(board);
    setAppState((currentAppState) => ({ ...currentAppState, openSearch: false }));
  };

  const navigate = (delta: number) => {
    if (!matches.length) {
      return;
    }
    const base =
      activeIndex < 0 ? (delta > 0 ? -1 : 0) : activeIndex;
    const nextIndex = (base + delta + matches.length) % matches.length;
    setActiveIndex(nextIndex);
    revealNodeMatch(board, matches[nextIndex], query);
  };

  if (!open) {
    return null;
  }

  const current = matches.length ? (activeIndex >= 0 ? activeIndex + 1 : 1) : 0;
  const counter = `${current} / ${matches.length}`;

  return (
    <div className="mindforai-search-panel" data-testid="search-panel">
      <div className="mindforai-search-panel__row">
        <span className="mindforai-search-panel__icon">{SearchIcon}</span>
        <input
          ref={inputRef}
          className="mindforai-search-panel__input"
          data-testid="search-input"
          value={query}
          placeholder={t('search.placeholder')}
          aria-label={t('search.title')}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              navigate(event.shiftKey ? -1 : 1);
              return;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
        />
        <span className="mindforai-search-panel__counter" data-testid="search-counter">
          {counter}
        </span>
        <button
          type="button"
          className="mindforai-search-panel__button"
          title={t('search.prev')}
          aria-label={t('search.prev')}
          onClick={() => navigate(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="mindforai-search-panel__button"
          title={t('search.next')}
          aria-label={t('search.next')}
          onClick={() => navigate(1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="mindforai-search-panel__button"
          title={t('search.close')}
          aria-label={t('search.close')}
          onClick={close}
        >
          {CloseIcon}
        </button>
      </div>
      {query.trim() && !matches.length && (
        <div className="mindforai-search-panel__empty">{t('search.noResult')}</div>
      )}
    </div>
  );
};