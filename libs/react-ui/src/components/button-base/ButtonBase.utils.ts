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
 * Props가 auto-anchor 분기인지 판별합니다.
 *
 * auto-anchor는 `component`를 명시하지 않았고, `href`가 존재하는 경우를 의미합니다.
 * 이 경우 `ButtonBase`는 기본적으로 anchor 렌더링 경로를 탑니다.
 *
 * @param props 판별할 ButtonBase props
 * @returns auto-anchor props 여부
 */
export const isAutoAnchorProps = (
  props: ButtonBaseRenderableProps,
): props is ButtonBaseAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/**
 * Props가 native button 분기인지 판별합니다.
 *
 * 다음 두 경우를 native button으로 봅니다.
 * - `component === 'button'`
 * - `component`가 없고 auto-anchor도 아닌 경우
 *
 * 즉, 명시적으로 다른 렌더링 대상이 없으면 기본적으로 native button을 렌더링합니다.
 *
 * @param props 판별할 ButtonBase props
 * @returns native button props 여부
 */
export const isNativeButtonProps = (
  props: ButtonBaseRenderableProps,
): props is ButtonBaseNativeButtonProps => {
  return props.component === 'button' || (props.component == null && !isAutoAnchorProps(props));
};

/**
 * ButtonBase root className 문자열을 생성합니다.
 *
 * @param params ButtonBase 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
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

/**
 * non-native host용 click 핸들러를 생성합니다.
 *
 * disabled 상태에서는 기본 동작과 이벤트 전파를 막고,
 * 그렇지 않으면 전달받은 `onClick`을 호출합니다.
 *
 * @typeParam T 이벤트가 발생하는 호스트 요소 타입
 * @param options disabled 상태와 원본 onClick 핸들러
 * @returns MouseEventHandler
 */
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
 * non-native host용 keydown 핸들러를 생성합니다.
 *
 * keyboard activation이 필요한 경우:
 * - Space는 keydown에서 기본 스크롤 동작을 막습니다.
 * - Enter는 keydown에서 click을 발생시킵니다.
 *
 * 다음 조건에서는 추가 동작 없이 종료합니다.
 * - 이미 `preventDefault()` 된 경우
 * - disabled인 경우
 * - keyboard activation이 비활성화된 경우
 * - 이벤트가 현재 루트 요소 자체에서 발생한 것이 아닌 경우
 *
 * @typeParam T 이벤트가 발생하는 호스트 요소 타입
 * @param options disabled 상태, 키보드 활성화 여부, 원본 onKeyDown 핸들러
 * @returns KeyboardEventHandler
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
 * non-native host용 keyup 핸들러를 생성합니다.
 *
 * keyboard activation이 필요한 경우:
 * - Space는 keyup에서 click을 발생시킵니다.
 *
 * 다음 조건에서는 추가 동작 없이 종료합니다.
 * - 이미 `preventDefault()` 된 경우
 * - disabled인 경우
 * - keyboard activation이 비활성화된 경우
 * - 이벤트가 현재 루트 요소 자체에서 발생한 것이 아닌 경우
 *
 * @typeParam T 이벤트가 발생하는 호스트 요소 타입
 * @param options disabled 상태, 키보드 활성화 여부, 원본 onKeyUp 핸들러
 * @returns KeyboardEventHandler
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
