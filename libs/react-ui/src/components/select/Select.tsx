'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { assignRef, cx } from '../../utils';
import { useFormControl } from '../form-control';

import { selectClasses } from './Select.constants';
import {
  getFirstEnabledIndex,
  getInitialHighlightedIndex,
  getLastEnabledIndex,
  getNextEnabledIndex,
} from './Select.navigation';
import {
  hasDisplayValue,
  isOptionSelected,
  isValueEqual,
  stringifyValue,
} from './Select.selection';
import type { SelectOpenCloseEvent, SelectOptionElement, SelectProps } from './Select.types';
import {
  createSyntheticChangeEvent,
  flattenOptionChildren,
  getDefaultSelectValue,
  getDisplayValue,
  getHiddenValues,
  getSelectRootClassNames,
  isOptionDisabled,
} from './Select.utils';

/**
 * APG select-only combobox.
 *
 * DOM 포커스는 언제나 trigger(`role="combobox"`)에 남고, 목록 안의 활성 위치는
 * `aria-activedescendant` 로 알린다. option 은 탭 순서에 없는 `role="option"` 요소이며, 목록을
 * 누를 때 mousedown 기본 동작을 막아 포커스를 trigger 에서 빼앗지 않는다.
 *
 * 포커스 정책: 선택·Escape 뒤에도 포커스는 trigger 에 있다. 바깥을 눌러 닫히면 포커스는 누른 곳을
 * 따라간다(trigger 로 끌어오지 않는다). Tab 은 목록을 닫고 다음 요소로 간다.
 */
export const Select = ({
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  autoFocus = false,
  children,
  className,
  color,
  defaultOpen = false,
  defaultValue,
  disabled,
  displayEmpty = false,
  error,
  fullWidth,
  id,
  labelId,
  multiple = false,
  name,
  onBlur,
  onChange,
  onClose,
  onFocus,
  onOpen,
  open: openProp,
  placeholder,
  renderValue,
  required,
  size,
  value: valueProp,
  variant,
  ref,
  ...rest
}: SelectProps) => {
  const formControl = useFormControl();

  const resolvedColor = color ?? formControl?.color ?? 'primary';
  const resolvedDisabled = disabled ?? formControl?.disabled ?? false;
  const resolvedError = error ?? formControl?.error ?? false;
  const resolvedFullWidth = fullWidth ?? formControl?.fullWidth ?? false;
  const resolvedRequired = required ?? formControl?.required ?? false;
  const resolvedSize = size ?? formControl?.size ?? 'md';
  const resolvedVariant = variant ?? formControl?.variant ?? 'boxed';

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const listboxLabelledBy = ariaLabelledby ?? labelId;

  const [focused, setFocused] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isControlledOpen = openProp != null;
  const open = openProp ?? uncontrolledOpen;
  // disabled 는 open 보다 우선한다 — 비활성 컨트롤은 목록을 보여 주지도, 값을 바꾸지도 않는다.
  const listOpen = open && !resolvedDisabled;

  const isControlledValue = valueProp !== undefined;
  const [valueState, setValueState] = useState<unknown>(() =>
    getDefaultSelectValue(multiple, defaultValue),
  );
  const value = isControlledValue ? valueProp : valueState;

  const optionElements = useMemo(() => flattenOptionChildren(children), [children]);

  const selectedOptions = useMemo(
    () => optionElements.filter((child) => isOptionSelected(child.props.value, value, multiple)),
    [multiple, optionElements, value],
  );

  const getInitialIndex = () =>
    getInitialHighlightedIndex(optionElements, isOptionDisabled, (option) =>
      isOptionSelected(option.props.value, value, multiple),
    );

  const [highlightedIndex, setHighlightedIndex] = useState<number>(getInitialIndex);

  // 활성 위치는 목록이 **열릴 때만** 선택값으로 맞춘다. 열린 동안 값이 바뀌어도(multiple 토글)
  // 사용자가 옮겨 둔 위치를 되돌리지 않는다.
  const [prevListOpen, setPrevListOpen] = useState(listOpen);

  if (listOpen !== prevListOpen) {
    setPrevListOpen(listOpen);

    if (listOpen) {
      setHighlightedIndex(getInitialIndex());
    }
  }

  const activeOptionId =
    listOpen && optionElements[highlightedIndex] ? optionId(highlightedIndex) : undefined;

  const hiddenValues = useMemo(
    () =>
      getHiddenValues({
        multiple,
        value,
      }),
    [multiple, value],
  );

  const displayValue = useMemo(
    () =>
      getDisplayValue({
        displayEmpty,
        multiple,
        placeholder,
        renderValue,
        selectedOptions,
        value,
      }),
    [displayEmpty, multiple, placeholder, renderValue, selectedOptions, value],
  );

  useEffect(() => {
    if (!autoFocus || resolvedDisabled) {
      return;
    }

    triggerRef.current?.focus();
  }, [autoFocus, resolvedDisabled]);

  useEffect(() => {
    if (!listOpen || highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex, listOpen]);

  useEffect(() => {
    if (!listOpen) {
      return;
    }

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (rootRef.current?.contains(target)) {
        return;
      }

      if (!isControlledOpen) {
        setUncontrolledOpen(false);
      }

      onClose?.(event);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isControlledOpen, onClose, listOpen]);

  useEffect(() => {
    const labelElements = Array.from(document.getElementsByTagName('label')).filter(
      (element) => element.htmlFor === triggerId,
    );

    if (!labelElements.length) {
      return;
    }

    const handleLabelClick = (event: Event) => {
      if (resolvedDisabled) {
        return;
      }

      event.preventDefault();
      triggerRef.current?.focus();

      if (!listOpen) {
        if (!isControlledOpen) {
          setUncontrolledOpen(true);
        }

        onOpen?.(event);
      }
    };

    labelElements.forEach((labelElement) => {
      labelElement.addEventListener('click', handleLabelClick);
    });

    return () => {
      labelElements.forEach((labelElement) => {
        labelElement.removeEventListener('click', handleLabelClick);
      });
    };
  }, [triggerId, resolvedDisabled, listOpen, isControlledOpen, onOpen]);

  const handleOpen = (event?: SelectOpenCloseEvent) => {
    if (resolvedDisabled) {
      return;
    }

    if (!isControlledOpen) {
      setUncontrolledOpen(true);
    }

    onOpen?.(event);
  };

  const handleClose = (event?: SelectOpenCloseEvent) => {
    if (!isControlledOpen) {
      setUncontrolledOpen(false);
    }

    onClose?.(event);
  };

  const selectOption = (event: SelectOpenCloseEvent, child: SelectOptionElement) => {
    if (resolvedDisabled || child.props.disabled) {
      return;
    }

    const optionValue = child.props.value;

    if (multiple) {
      const currentArray = Array.isArray(value) ? value : [];
      const alreadySelected = currentArray.some((item) => isValueEqual(optionValue, item));

      const nextValue = alreadySelected
        ? currentArray.filter((item) => !isValueEqual(optionValue, item))
        : currentArray.concat(optionValue);

      if (!isControlledValue) {
        setValueState(nextValue);
      }

      onChange?.(createSyntheticChangeEvent(name, nextValue), child);
      return;
    }

    if (isValueEqual(optionValue, value)) {
      handleClose(event);
      triggerRef.current?.focus();
      return;
    }

    if (!isControlledValue) {
      setValueState(optionValue);
    }

    onChange?.(createSyntheticChangeEvent(name, optionValue), child);
    handleClose(event);
    triggerRef.current?.focus();
  };

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (listOpen) {
      handleClose(event);
      return;
    }

    handleOpen(event);
  };

  const moveHighlight = (nextIndex: number) => {
    if (nextIndex >= 0) {
      setHighlightedIndex(nextIndex);
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (resolvedDisabled) {
      return;
    }

    if (!listOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        handleOpen(event);
      }

      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        moveHighlight(
          getNextEnabledIndex(optionElements, highlightedIndex, direction, isOptionDisabled),
        );
        return;
      }

      case 'Home':
        event.preventDefault();
        moveHighlight(getFirstEnabledIndex(optionElements, isOptionDisabled));
        return;

      case 'End':
        event.preventDefault();
        moveHighlight(getLastEnabledIndex(optionElements, isOptionDisabled));
        return;

      case 'Enter':
      case ' ': {
        event.preventDefault();
        const child = optionElements[highlightedIndex];

        if (child) {
          selectOption(event, child);
        } else {
          handleClose(event);
        }

        return;
      }

      case 'Escape':
        event.preventDefault();
        handleClose(event);
        return;

      case 'Tab':
        // 기본 동작(다음 요소로 이동)은 그대로 둔다.
        handleClose(event);
        return;
    }
  };

  const handleRootBlur: React.FocusEventHandler<HTMLDivElement> = (event) => {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    setFocused(false);
    onBlur?.(event);
  };

  const handleRootFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const rootClassName = getSelectRootClassNames({
    className,
    color: resolvedColor,
    disabled: resolvedDisabled,
    // 상태 표시 우선순위: disabled > error > focused (입력 variant 와 같다).
    error: resolvedError && !resolvedDisabled,
    focused: focused && !resolvedDisabled,
    fullWidth: resolvedFullWidth,
    multiple,
    open: listOpen,
    size: resolvedSize,
    variant: resolvedVariant,
  });

  return (
    <div
      {...rest}
      className={rootClassName}
      onBlur={handleRootBlur}
      onFocus={handleRootFocus}
      ref={(node) => {
        rootRef.current = node;
        assignRef(ref, node);
      }}
    >
      {multiple ? (
        hiddenValues.map((hiddenValue, index) => (
          <input
            aria-hidden="true"
            className={selectClasses.hiddenInput}
            disabled={resolvedDisabled}
            key={`${hiddenValue}-${index}`}
            name={name}
            readOnly
            required={resolvedRequired}
            tabIndex={-1}
            type="hidden"
            value={hiddenValue}
          />
        ))
      ) : (
        <input
          aria-hidden="true"
          className={selectClasses.hiddenInput}
          disabled={resolvedDisabled}
          name={name}
          readOnly
          required={resolvedRequired}
          tabIndex={-1}
          type="hidden"
          value={hiddenValues[0] ?? ''}
        />
      )}

      <button
        aria-activedescendant={activeOptionId}
        aria-controls={listOpen ? listboxId : undefined}
        aria-describedby={ariaDescribedby}
        aria-disabled={resolvedDisabled ? 'true' : undefined}
        aria-expanded={listOpen ? 'true' : 'false'}
        aria-haspopup="listbox"
        aria-invalid={resolvedError ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={listboxLabelledBy}
        aria-required={resolvedRequired ? 'true' : undefined}
        className={selectClasses.trigger}
        disabled={resolvedDisabled}
        id={triggerId}
        name={name}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span
          className={cx(
            selectClasses.value,
            !hasDisplayValue(value, multiple) && selectClasses.placeholder,
          )}
        >
          {displayValue}
        </span>

        {!multiple ? (
          <span aria-hidden="true" className={selectClasses.icon}>
            ▾
          </span>
        ) : null}
      </button>

      {listOpen ? (
        // aria-activedescendant 패턴: DOM 포커스는 trigger 에 남으므로 listbox 는 포커스를 받지 않는다.
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus
        <div
          aria-label={listboxLabelledBy ? undefined : ariaLabel}
          aria-labelledby={listboxLabelledBy}
          aria-multiselectable={multiple ? 'true' : undefined}
          className={selectClasses.listbox}
          id={listboxId}
          onMouseDown={(event) => event.preventDefault()}
          role="listbox"
        >
          {optionElements.map((child, index) => {
            const optionValue = child.props.value;
            const selected = isOptionSelected(optionValue, value, multiple);
            const highlighted = highlightedIndex === index;
            const disabledOption = Boolean(child.props.disabled);

            return (
              // 키보드는 trigger(combobox)가 처리하고 option 은 탭 순서에도 포커스 대상에도 들지 않는다.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
              <div
                aria-disabled={disabledOption ? 'true' : undefined}
                aria-selected={selected ? 'true' : 'false'}
                className={cx(
                  selectClasses.option,
                  selected && selectClasses.optionSelected,
                  highlighted && selectClasses.optionHighlighted,
                )}
                data-value={stringifyValue(optionValue)}
                id={optionId(index)}
                key={child.key ?? index}
                onClick={(event) => selectOption(event, child)}
                onMouseEnter={() => {
                  if (!disabledOption) {
                    setHighlightedIndex(index);
                  }
                }}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
              >
                {child.props.children}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

Select.displayName = 'Select';
