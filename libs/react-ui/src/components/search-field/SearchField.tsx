'use client';

import { useId, useMemo, useRef, useState } from 'react';

import type { FocusEventHandler } from 'react';

import type {
  InputLikeChangeEventHandler,
  InputLikeElement,
  InputLikeFocusEventHandler,
} from '../../types';
import { assignRef, cx } from '../../utils';
import { getTextFieldInputComponent } from '../text-field';

import { searchFieldClasses } from './SearchField.constants';
import type {
  SearchFieldInputKeyDownHandler,
  SearchFieldProps,
  SearchFieldSuggestion,
  SearchFieldSuggestionKeyDownHandler,
} from './SearchField.types';
import {
  getMergedInputProps,
  getSuggestionValue,
  isSuggestionSelected,
  toInputString,
} from './SearchField.utils';

export const SearchField = ({
  className,
  defaultValue,
  value,
  onBlur,
  onChange,
  onFocus,
  inputProps,
  inputRef,
  placeholder = 'Search',
  variant = 'boxed',
  suggestions = [],
  noSuggestionsText,
  onClear: _onClear,
  onValueChange,
  onSuggestionSelect,
  ...rest
}: SearchFieldProps) => {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputElementRef = useRef<InputLikeElement | null>(null);
  const suggestionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(() => toInputString(defaultValue));

  const InputComponent = getTextFieldInputComponent(variant);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? toInputString(value) : uncontrolledValue;

  const visibleSuggestions = useMemo(() => suggestions, [suggestions]);

  const hasSuggestions = visibleSuggestions.length > 0;
  const expanded = open && hasSuggestions;
  const showEmptyState = open && !hasSuggestions && noSuggestionsText != null;

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

  const handleFocus: InputLikeFocusEventHandler = (event) => {
    onFocus?.(event);
  };

  const handleBlur: InputLikeFocusEventHandler = (event) => {
    onBlur?.(event);
  };

  const handleWrapperFocus: FocusEventHandler<HTMLDivElement> = () => {
    setOpen(true);
  };

  const handleWrapperBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    const nextFocused = event.relatedTarget;

    if (nextFocused instanceof Node && wrapperRef.current?.contains(nextFocused)) {
      return;
    }

    setOpen(false);
  };

  const handleChange: InputLikeChangeEventHandler = (event) => {
    const nextValue = event.target.value;

    handleValueChange(nextValue);
    onChange?.(event);

    if (!open) {
      setOpen(true);
    }
  };

  const handleSuggestionSelect = (suggestion: SearchFieldSuggestion) => {
    if (suggestion.disabled) {
      return;
    }

    const nextValue = getSuggestionValue(suggestion);

    handleValueChange(nextValue);
    onSuggestionSelect?.(suggestion);
    setOpen(false);
    inputElementRef.current?.focus();
  };

  const handleInputKeyDown: SearchFieldInputKeyDownHandler = (event) => {
    inputProps?.onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' && hasSuggestions) {
      event.preventDefault();
      setOpen(true);

      window.requestAnimationFrame(() => {
        suggestionRefs.current[0]?.focus();
      });
    }
  };

  const handleSuggestionKeyDown: SearchFieldSuggestionKeyDownHandler = (
    event,
    suggestion,
    index,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      suggestionRefs.current[index + 1]?.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (index === 0) {
        inputElementRef.current?.focus();
      } else {
        suggestionRefs.current[index - 1]?.focus();
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      inputElementRef.current?.focus();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleSuggestionSelect(suggestion);
    }
  };

  const mergedInputProps = getMergedInputProps({
    expanded,
    inputProps,
    listboxId,
    onKeyDown: handleInputKeyDown,
    showEmptyState,
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        inputProps={mergedInputProps}
        inputRef={handleInputRef}
        endAdornment={
          <span className={searchFieldClasses.icon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
            </svg>
          </span>
        }
      />

      {expanded ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cx(
            searchFieldClasses.suggestions,
            expanded && searchFieldClasses.suggestionsOpen,
          )}
        >
          {visibleSuggestions.map((suggestion, index) => {
            const isSelected = isSuggestionSelected({
              currentValue,
              suggestion,
            });

            return (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={isSelected}
                aria-disabled={suggestion.disabled || undefined}
                className={cx(
                  searchFieldClasses.suggestion,
                  suggestion.disabled && searchFieldClasses.suggestionDisabled,
                )}
              >
                <button
                  type="button"
                  className={searchFieldClasses.suggestionButton}
                  disabled={suggestion.disabled}
                  ref={(node) => {
                    suggestionRefs.current[index] = node;
                  }}
                  onClick={() => {
                    handleSuggestionSelect(suggestion);
                  }}
                  onKeyDown={(event) => handleSuggestionKeyDown(event, suggestion, index)}
                >
                  <span className={searchFieldClasses.suggestionContent}>
                    <span className={searchFieldClasses.suggestionLabel}>{suggestion.label}</span>

                    {suggestion.description ? (
                      <span className={searchFieldClasses.suggestionDescription}>
                        {suggestion.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showEmptyState ? (
        <div id={listboxId} role="listbox" className={searchFieldClasses.suggestions}>
          <div className={searchFieldClasses.empty}>{noSuggestionsText}</div>
        </div>
      ) : null}
    </div>
  );
};

SearchField.displayName = 'SearchField';
