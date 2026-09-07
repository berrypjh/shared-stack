import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { formHelperTextClasses } from './FormHelperText.constants';
import type { FormHelperTextOwnProps } from './FormHelperText.types';

/**
 * FormHelperText 루트 엘리먼트에 적용할 클래스 이름 문자열을 생성합니다.
 *
 * 상태값과 옵션에 따라 대응하는 modifier 클래스를 조건부로 조합하고,
 * 마지막에 외부에서 전달된 `className`을 함께 병합합니다.
 *
 * @param params 클래스 이름 생성에 사용할 FormHelperText 상태 및 옵션
 * @param params.className 추가로 병합할 사용자 정의 클래스 이름
 * @param params.disabled 비활성화 여부
 * @param params.error 에러 상태 여부
 * @param params.size 헬퍼 텍스트 크기
 * @returns 병합된 클래스 이름 문자열
 */
export const getFormHelperTextClassNames = ({
  className,
  disabled,
  error,
  size,
}: Pick<FormHelperTextOwnProps, 'disabled' | 'error' | 'size'> & {
  className?: string;
}) =>
  cx(
    formHelperTextClasses.root,
    disabled && formHelperTextClasses.disabled,
    error && formHelperTextClasses.error,
    size === 'sm' && formHelperTextClasses.sizeSm,
    size === 'md' && formHelperTextClasses.sizeMd,
    className,
  );

export const getFormHelperTextContent = ({ children }: { children?: ReactNode }) => {
  if (children === ' ') {
    return <span aria-hidden="true">{'\u200B'}</span>;
  }

  return children;
};
