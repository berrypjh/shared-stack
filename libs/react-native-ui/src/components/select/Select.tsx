import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import { findSelectedOption, nextSingleValue, resolveDisplayNode } from './Select.selection';
import {
  resolveSelectChoiceLabelStyle,
  resolveSelectChoiceStyle,
  resolveSelectIndicatorColor,
  resolveSelectPanelStyle,
  resolveSelectTriggerStyle,
  resolveSelectValueStyle,
  selectBackdropStyle,
} from './Select.styles';
import type { SelectOption, SelectProps } from './Select.types';

/**
 * 옵션 기반 단일 선택 컨트롤.
 *
 * Pressable 트리거 + 코어 RN Modal 입니다. 새 의존성이 없고 `onRequestClose` 가 Android
 * 하드웨어 back, `onAccessibilityEscape` 가 iOS 스크린리더 escape 를 받습니다.
 *
 * 값 상태와 개폐 상태는 독립입니다 — 각각 `value !== undefined`, `open !== undefined` 로
 * controlled 를 판정합니다. 옵션은 데이터이고 값 콜백은 `onValueChange(next)` 입니다.
 *
 * 역할은 설치된 RN 이 지원하는 것만 씁니다: 트리거 `combobox`, 목록 `radiogroup`,
 * 선택지 `radio`. `ButtonBase` 는 역할을 `button` 으로 고정해서 쓸 수 없습니다.
 */
export const Select = <T extends string>({
  accessibilityLabel,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onClose,
  dismissAccessibilityLabel,
  placeholder,
  renderValue,
  variant = 'boxed',
  size,
  color,
  disabled,
  error,
  fullWidth,
  style,
  ...rest
}: SelectProps<T>) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  // 기본값은 context 해석 뒤에 둡니다 — destructuring 기본값은 상속을 가립니다.
  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const errorValue = error ?? formControl?.error ?? false;
  const sizeValue = size ?? formControl?.size ?? 'md';
  const colorValue = color ?? formControl?.color ?? 'primary';
  const fullWidthValue = fullWidth ?? formControl?.fullWidth ?? false;

  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolledValue;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : uncontrolledOpen;

  const requestOpen = () => {
    if (openProp === undefined) setUncontrolledOpen(true);
    onOpen?.();
  };

  const requestClose = () => {
    if (openProp === undefined) setUncontrolledOpen(false);
    onClose?.();
  };

  const selectedOption = findSelectedOption(options, value);
  const display = resolveDisplayNode({ selectedOption, value, placeholder, renderValue });

  /** 안정적인 문자열이 있을 때만 값을 말합니다 — 임의의 노드를 문자열로 만들지 않습니다. */
  const spokenValue =
    selectedOption?.accessibilityLabel ??
    (typeof selectedOption?.label === 'string' ? selectedOption.label : undefined);

  const chooseOption = (option: SelectOption<T>) => {
    if (option.disabled) return;

    const next = nextSingleValue(option, value);

    if (next.changed && next.value !== undefined) {
      if (valueProp === undefined) setUncontrolledValue(next.value);
      onValueChange?.(next.value);
    }

    // 같은 값을 다시 골라도 닫습니다 (web Select 와 같은 의미). disabled 는 위에서 빠집니다.
    requestClose();
  };

  const triggerStyle = resolveSelectTriggerStyle(tokens, {
    variant,
    size: sizeValue,
    color: colorValue,
    disabled: disabledValue,
    error: errorValue,
    focused: open,
  });
  const valueStyle = resolveSelectValueStyle(tokens, {
    size: sizeValue,
    disabled: disabledValue,
    empty: selectedOption === undefined,
  });

  return (
    <View {...rest} style={[fullWidthValue ? { alignSelf: 'stretch' } : null, style]}>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        accessibilityValue={spokenValue === undefined ? undefined : { text: spokenValue }}
        // 항상 boolean 으로 넘깁니다 — RN Pressable 은 non-null 일 때만
        // `accessibilityState.disabled` 를 실제 값으로 덮습니다.
        disabled={disabledValue}
        onPress={open ? requestClose : requestOpen}
        style={triggerStyle}
      >
        {typeof display === 'string' || typeof display === 'number' ? (
          <Text style={valueStyle}>{display}</Text>
        ) : (
          display
        )}
        <Text
          style={{ color: resolveSelectIndicatorColor(tokens, disabledValue) }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          ▾
        </Text>
      </Pressable>

      <Modal
        testID="select-modal"
        visible={open}
        transparent
        animationType="fade"
        // Android 하드웨어 back.
        onRequestClose={requestClose}
      >
        <Pressable
          testID="select-backdrop"
          style={selectBackdropStyle}
          onPress={requestClose}
          // 이름 없는 버튼으로 읽히지 않게 기본은 접근성 요소가 아닙니다. 소비자가 라벨을
          // 주면 그때 접근 가능한 해제 버튼이 됩니다 — 영어 기본값을 박지 않습니다.
          accessible={dismissAccessibilityLabel !== undefined}
          accessibilityRole={dismissAccessibilityLabel === undefined ? undefined : 'button'}
          accessibilityLabel={dismissAccessibilityLabel}
        >
          {/*
            패널 안의 터치를 흡수합니다. 없으면 disabled 선택지를 눌렀을 때 그 터치가
            배경까지 올라가 dismiss 가 실행되어 목록이 닫힙니다.
            `accessible={false}` 라서 접근성 트리에는 나타나지 않습니다.
          */}
          <Pressable accessible={false} onPress={() => undefined}>
            <View
              testID="select-panel"
              accessibilityRole="radiogroup"
              // iOS 스크린리더 두 손가락 문지르기.
              onAccessibilityEscape={requestClose}
              style={resolveSelectPanelStyle(tokens)}
            >
              {options.map((option) => {
                const selected = option.value === value;
                const optionDisabled = option.disabled ?? false;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={option.accessibilityLabel}
                    accessibilityState={{ checked: selected }}
                    disabled={optionDisabled}
                    onPress={() => chooseOption(option)}
                    style={resolveSelectChoiceStyle(tokens, { selected })}
                  >
                    {typeof option.label === 'string' || typeof option.label === 'number' ? (
                      <Text
                        style={resolveSelectChoiceLabelStyle(tokens, {
                          selected,
                          disabled: optionDisabled,
                        })}
                      >
                        {option.label}
                      </Text>
                    ) : (
                      option.label
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
