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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;

  const [focused, setFocused] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isControlledOpen = openProp != null;
  const open = openProp ?? uncontrolledOpen;

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

  const [highlightedIndex, setHighlightedIndex] = useState<number>(() =>
    getInitialHighlightedIndex(optionElements, isOptionDisabled, (option) =>
      isOptionSelected(option.props.value, value, multiple),
    ),
  );

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
    if (!open) {
      return;
    }

    const initialIndex = getInitialHighlightedIndex(optionElements, isOptionDisabled, (option) =>
      isOptionSelected(option.props.value, value, multiple),
    );

    setHighlightedIndex(initialIndex);

    const frame = window.requestAnimationFrame(() => {
      if (initialIndex >= 0) {
        optionRefs.current[initialIndex]?.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [multiple, open, optionElements, value]);

  useEffect(() => {
    if (!open) {
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
  }, [isControlledOpen, onClose, open]);

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

      if (!open) {
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
  }, [triggerId, resolvedDisabled, open, isControlledOpen, onOpen]);

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
    if (child.props.disabled) {
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
    if (open) {
      handleClose(event);
      return;
    }

    handleOpen(event);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (resolvedDisabled) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) {
        handleOpen(event);
      }

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (open) {
        handleClose(event);
      } else {
        handleOpen(event);
      }

      return;
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      handleClose(event);
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

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    child: SelectOptionElement,
    index: number,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      const nextIndex = getNextEnabledIndex(optionElements, index, 1, isOptionDisabled);

      if (nextIndex >= 0) {
        setHighlightedIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      const nextIndex = getNextEnabledIndex(optionElements, index, -1, isOptionDisabled);

      if (nextIndex >= 0) {
        setHighlightedIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      }

      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();

      const firstIndex = getFirstEnabledIndex(optionElements, isOptionDisabled);

      if (firstIndex >= 0) {
        setHighlightedIndex(firstIndex);
        optionRefs.current[firstIndex]?.focus();
      }

      return;
    }

    if (event.key === 'End') {
      event.preventDefault();

      const lastIndex = getLastEnabledIndex(optionElements, isOptionDisabled);

      if (lastIndex >= 0) {
        setHighlightedIndex(lastIndex);
        optionRefs.current[lastIndex]?.focus();
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose(event);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(event, child);
    }
  };

  const rootClassName = getSelectRootClassNames({
    className,
    color: resolvedColor,
    disabled: resolvedDisabled,
    error: resolvedError,
    focused,
    fullWidth: resolvedFullWidth,
    multiple,
    open,
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
        aria-controls={open ? listboxId : undefined}
        aria-describedby={ariaDescribedby}
        aria-disabled={resolvedDisabled ? 'true' : undefined}
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="listbox"
        aria-invalid={resolvedError ? 'true' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? labelId}
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

      {open ? (
        <div
          aria-labelledby={labelId}
          aria-multiselectable={multiple ? 'true' : undefined}
          className={selectClasses.listbox}
          id={listboxId}
          role="listbox"
        >
          {optionElements.map((child, index) => {
            const optionValue = child.props.value;
            const selected = isOptionSelected(optionValue, value, multiple);
            const highlighted = highlightedIndex === index;
            const disabledOption = Boolean(child.props.disabled);

            return (
              <button
                aria-selected={selected ? 'true' : 'false'}
                className={cx(
                  selectClasses.option,
                  selected && selectClasses.optionSelected,
                  highlighted && selectClasses.optionHighlighted,
                )}
                data-value={stringifyValue(optionValue)}
                disabled={disabledOption}
                key={child.key ?? index}
                onClick={(event) => selectOption(event, child)}
                onKeyDown={(event) => handleOptionKeyDown(event, child, index)}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                type="button"
              >
                {child.props.children}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

Select.displayName = 'Select';
