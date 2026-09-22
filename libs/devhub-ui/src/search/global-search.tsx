'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { IconButton, type InputLikeElement, SearchField, VisuallyHidden } from '@berrypjh/react-ui';

import { useDevHubNavigate } from '../provider/devhub-provider';
import { Icon } from '../ui/icon';

import { isMac, isSearchShortcut, resultStatus, shortcutOf } from './shortcut';

const FIELD_ID = 'devhub-search';

export type SearchSuggestion = { id: string; label: string; description: string };

export type GlobalSearchProps<T> = {
  /** 질의에 맞는 결과 전부와 화면에 보일 상위. 순위는 앱의 색인이 정한다. */
  results: (query: string) => { all: T[]; shown: T[] };
  keyOf: (result: T) => string;
  toSuggestion: (result: T) => SearchSuggestion;
  hrefOf: (result: T) => string;
  /** 단축키 글자(⌘K · Ctrl+K)를 받아 placeholder 를 만든다. */
  placeholder: (shortcut: string) => string;
  /** 맞는 것이 없을 때 목록 자리에 보일 글. live region 이 따로 알리므로 `aria-hidden` 으로 둔다. */
  noMatch?: ReactNode;
};

/**
 * 저장소 전체 검색. react-ui `SearchField` 가 combobox 다 — 포커스는 입력에 남고, 화살표가 제안을 옮기고,
 * Enter 가 고르고, Escape 가 목록을 닫는다. 여기서는 ⌘K / Ctrl+K, 결과 수 알림, 좁은 화면의 펼침을 더한다.
 * `lg` 미만에서는 검색 버튼 뒤에 접혀 있다가 상단 바의 둘째 줄로 열린다.
 * 결과 수 · 결과 없음은 늘 있는 live region 이 알린다. `SearchField` 의 빈 상태는 열릴 때 새로 끼워지는
 * status 라 읽히지 않을 수 있어, 보이는 글만 두고(`aria-hidden`) 두 번 읽히지 않게 한다.
 */
export const GlobalSearch = <T,>({
  results,
  keyOf,
  toSuggestion,
  hrefOf,
  placeholder,
  noMatch = '일치하는 항목이 없습니다',
}: GlobalSearchProps<T>) => {
  const navigate = useDevHubNavigate();
  const inputRef = useRef<InputLikeElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const shortcut = useMemo(() => shortcutOf(isMac()), []);

  const { all, shown } = useMemo(() => results(query), [results, query]);
  const byKey = useMemo(
    () => new Map(shown.map((result) => [keyOf(result), result])),
    [shown, keyOf],
  );

  /** 펼치고(`lg` 부터는 이미 보인다) 보인 뒤에 포커스한다. */
  const openAndFocus = () => {
    setOpen(true);
    setFocusRequest((count) => count + 1);
  };

  useEffect(() => {
    if (focusRequest === 0) return;
    inputRef.current?.focus();
    if (inputRef.current instanceof HTMLInputElement) inputRef.current.select();
  }, [focusRequest]);

  useEffect(() => {
    const mac = isMac();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event, mac)) return;
      event.preventDefault();
      openAndFocus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <IconButton
        ref={toggleRef}
        size="sm"
        color="secondary"
        aria-label="검색"
        aria-expanded={open}
        aria-controls={FIELD_ID}
        onClick={() => (open ? setOpen(false) : openAndFocus())}
        className="lg:hidden"
      >
        <Icon name="search" />
      </IconButton>
      <div
        id={FIELD_ID}
        className={`w-full max-lg:order-last lg:w-auto lg:max-w-96 lg:min-w-40 lg:flex-[1_1_18rem] ${
          open ? '' : 'max-lg:hidden'
        }`}
      >
        <SearchField
          size="sm"
          variant="boxed"
          fullWidth
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder(shortcut.label)}
          inputRef={inputRef}
          inputProps={{
            'aria-label': '저장소 검색',
            'aria-keyshortcuts': shortcut.aria,
            onKeyDown: (event) => {
              if (event.key === 'Escape' && query === '' && open) close();
            },
          }}
          clearable
          clearAriaLabel="검색어 지우기"
          suggestions={shown.map(toSuggestion)}
          noSuggestionsText={query.trim() ? <span aria-hidden="true">{noMatch}</span> : undefined}
          onSuggestionSelect={(suggestion) => {
            const result = byKey.get(suggestion.id);
            if (!result) return;
            setQuery('');
            setOpen(false);
            navigate(hrefOf(result));
          }}
        />
        <VisuallyHidden role="status">
          {resultStatus(query, all.length, shown.length)}
        </VisuallyHidden>
      </div>
    </>
  );
};
