'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { FocusEventHandler } from 'react';

import type { InputLikeChangeEventHandler, InputLikeElement } from '../../types';
import { assignRef, cx } from '../../utils';
import { useFormControl } from '../form-control';
import { getTextFieldInputComponent } from '../text-field';

import { searchFieldClasses } from './SearchField.constants';
import type {
  SearchFieldInputKeyDownHandler,
  SearchFieldProps,
  SearchFieldSuggestion,
} from './SearchField.types';
import {
  getMergedInputProps,
  getSuggestionValue,
  moveActiveIndex,
  toInputString,
} from './SearchField.utils';

/**
 * 검색 입력 + (선택) 지우기 버튼 + (선택) 제안 목록.
 *
 * 제안 목록은 APG list-autocomplete combobox 다. DOM 포커스는 언제나 입력에 남고, 활성 제안은
 * `aria-activedescendant` 로 알린다. 제안 행은 상호작용 요소를 품지 않는 `role="option"` 이며,
 * 누르면(mousedown 기본 동작을 막아) 포커스를 입력에서 빼앗지 않은 채 선택된다.
 */
export const SearchField = ({
  className,
  defaultValue,
  value,
  onChange,
  inputProps,
  inputRef,
  placeholder = 'Search',
  variant = 'boxed',
  suggestions,
  noSuggestionsText,
  clearable = false,
  clearAriaLabel,
  onClear,
  onValueChange,
  onSuggestionSelect,
  ...rest
}: SearchFieldProps) => {
  const formControl = useFormControl();
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputElementRef = useRef<InputLikeElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [uncontrolledValue, setUncontrolledValue] = useState(() => toInputString(defaultValue));

  const InputComponent = getTextFieldInputComponent(variant);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? toInputString(value) : uncontrolledValue;

  const rows = suggestions ?? [];
  const hasPopup = suggestions !== undefined || noSuggestionsText != null;
  const listVisible = open && rows.length > 0;
  const showEmptyState = open && rows.length === 0 && noSuggestionsText != null;

  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const activeSuggestion = listVisible ? rows[activeIndex] : undefined;
  const activeOptionId = activeSuggestion ? optionId(activeIndex) : undefined;

  const disabled = rest.disabled ?? formControl?.disabled ?? false;
  const showClear = clearable && currentValue !== '' && !disabled && !rest.readOnly;

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  const closeList = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleValueChange = (nextValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleInputRef = (instance: InputLikeElement | null) => {
    inputElementRef.current = instance;
    assignRef(inputRef, instance);
  };

  const handleWrapperFocus: FocusEventHandler<HTMLDivElement> = () => {
    setOpen(true);
  };

  const handleWrapperBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    const nextFocused = event.relatedTarget;

    if (nextFocused instanceof Node && wrapperRef.current?.contains(nextFocused)) {
      return;
    }

    closeList();
  };

  const handleChange: InputLikeChangeEventHandler = (event) => {
    handleValueChange(event.target.value);
    onChange?.(event);
    setActiveIndex(-1);
    setOpen(true);
  };

  const selectSuggestion = (suggestion: SearchFieldSuggestion) => {
    if (suggestion.disabled) {
      return;
    }

    handleValueChange(getSuggestionValue(suggestion));
    onSuggestionSelect?.(suggestion);
    closeList();
  };

  const handleClear = () => {
    handleValueChange('');
    onClear?.();
    setActiveIndex(-1);
    inputElementRef.current?.focus();
  };

  const handleInputKeyDown: SearchFieldInputKeyDownHandler = (event) => {
    inputProps?.onKeyDown?.(event);

    if (event.defaultPrevented || !hasPopup) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!rows.length) {
        return;
      }

      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        moveActiveIndex(rows, listVisible ? activeIndex : -1, event.key === 'ArrowDown' ? 1 : -1),
      );
      return;
    }

    if (event.key === 'Enter' && activeSuggestion) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
      return;
    }

    if (event.key === 'Escape' && (listVisible || showEmptyState)) {
      event.preventDefault();
      closeList();
    }
  };

  const mergedInputProps = getMergedInputProps({
    activeOptionId,
    expanded: listVisible,
    hasPopup,
    inputProps,
    listboxId,
    onKeyDown: handleInputKeyDown,
  });

  return (
    <div
      className={searchFieldClasses.root}
      ref={wrapperRef}
      onFocus={handleWrapperFocus}
      onBlur={handleWrapperBlur}
    >
      <InputComponent
        {...rest}
        value={currentValue}
        className={cx(searchFieldClasses.input, className)}
        type="search"
        placeholder={placeholder}
        onChange={handleChange}
        inputProps={mergedInputProps}
        inputRef={handleInputRef}
        endAdornment={
          <>
            {showClear ? (
              <button
                type="button"
                className={searchFieldClasses.clear}
                aria-label={clearAriaLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleClear}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            ) : null}

            <span className={searchFieldClasses.icon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
              </svg>
            </span>
          </>
        }
      />

      {listVisible ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cx(searchFieldClasses.suggestions, searchFieldClasses.suggestionsOpen)}
        >
          {rows.map((suggestion, index) => (
            // aria-activedescendant 패턴: 키보드는 입력(combobox)이 처리하고 option 은 포커스를 받지 않는다.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={suggestion.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={suggestion.disabled || undefined}
              className={cx(
                searchFieldClasses.suggestion,
                index === activeIndex && searchFieldClasses.suggestionActive,
                suggestion.disabled && searchFieldClasses.suggestionDisabled,
              )}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <span className={searchFieldClasses.suggestionContent}>
                <span className={searchFieldClasses.suggestionLabel}>{suggestion.label}</span>

                {suggestion.description ? (
                  <span className={searchFieldClasses.suggestionDescription}>
                    {suggestion.description}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmptyState ? (
        <div role="status" className={cx(searchFieldClasses.suggestions, searchFieldClasses.empty)}>
          {noSuggestionsText}
        </div>
      ) : null}
    </div>
  );
};

SearchField.displayName = 'SearchField';
