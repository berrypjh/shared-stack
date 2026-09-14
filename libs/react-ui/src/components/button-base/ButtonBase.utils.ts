import type { KeyboardEventHandler, MouseEventHandler } from 'react';

import { cx } from '../../utils';

import { buttonBaseClasses } from './ButtonBase.constants';
import type {
  ButtonBaseAutoAnchorProps,
  ButtonBaseNativeButtonProps,
  ButtonBaseOwnProps,
  ButtonBaseRenderableProps,
} from './ButtonBase.types';

/**
 * auto-anchor 분기 판별.
 * auto-anchor는 `component`를 명시하지 않고 `href`가 있는 경우이며, 이때 `ButtonBase`는 anchor 렌더링 경로를 탄다.
 */
export const isAutoAnchorProps = (
  props: ButtonBaseRenderableProps,
): props is ButtonBaseAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/**
 * native button 분기 판별.
 * 명시적으로 다른 렌더링 대상이 없으면 native button을 렌더링한다.
 * - `component === 'button'`
 * - `component`가 없고 auto-anchor도 아닌 경우
 */
export const isNativeButtonProps = (
  props: ButtonBaseRenderableProps,
): props is ButtonBaseNativeButtonProps => {
  return props.component === 'button' || (props.component == null && !isAutoAnchorProps(props));
};

/** ButtonBase 시각 상태와 추가 className → root className */
export const getButtonBaseClassNames = ({
  variant = 'contained',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  className,
}: Pick<ButtonBaseOwnProps, 'variant' | 'size' | 'color' | 'fullWidth' | 'className'>) =>
  cx(
    buttonBaseClasses.root,
    `${buttonBaseClasses.root}--variant-${variant}`,
    `${buttonBaseClasses.root}--size-${size}`,
    `${buttonBaseClasses.root}--color-${color}`,
    fullWidth && `${buttonBaseClasses.root}--fullWidth`,
    className,
  );

/** non-native host용 click 핸들러 생성, disabled면 기본 동작과 전파를 막고 아니면 `onClick` 호출 */
export const createNonNativeClickHandler = <T extends HTMLElement>({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick?: MouseEventHandler<T>;
}): MouseEventHandler<T> => {
  return (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };
};

/**
 * non-native host용 keydown 핸들러 생성.
 * keyboard activation이 켜져 있으면 Space는 기본 스크롤을 막고 Enter는 click을 발생시킨다.
 * 원본 `onKeyDown`은 항상 먼저 호출하고, 다음 경우에는 그 뒤 아무것도 하지 않는다.
 * - 이미 `preventDefault()`된 경우
 * - disabled인 경우
 * - keyboard activation이 꺼진 경우
 * - 이벤트가 루트 요소 자체에서 발생하지 않은 경우
 */
export const createNonNativeKeyDownHandler = <T extends HTMLElement>({
  disabled,
  activateWithKeyboard,
  onKeyDown,
}: {
  disabled: boolean;
  activateWithKeyboard: boolean;
  onKeyDown?: KeyboardEventHandler<T>;
}): KeyboardEventHandler<T> => {
  return (event) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || disabled || !activateWithKeyboard) {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };
};

/**
 * non-native host용 keyup 핸들러 생성.
 * keyboard activation이 켜져 있으면 Space는 keyup에서 click을 발생시킨다.
 * 원본 `onKeyUp`은 항상 먼저 호출하고, 다음 경우에는 그 뒤 아무것도 하지 않는다.
 * - 이미 `preventDefault()`된 경우
 * - disabled인 경우
 * - keyboard activation이 꺼진 경우
 * - 이벤트가 루트 요소 자체에서 발생하지 않은 경우
 */
export const createNonNativeKeyUpHandler = <T extends HTMLElement>({
  disabled,
  activateWithKeyboard,
  onKeyUp,
}: {
  disabled: boolean;
  activateWithKeyboard: boolean;
  onKeyUp?: KeyboardEventHandler<T>;
}): KeyboardEventHandler<T> => {
  return (event) => {
    onKeyUp?.(event);

    if (event.defaultPrevented || disabled || !activateWithKeyboard) {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };
};
