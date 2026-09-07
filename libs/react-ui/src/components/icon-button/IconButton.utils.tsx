import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { iconButtonClasses } from './IconButton.constants';
import type { IconButtonAutoAnchorProps, IconButtonRenderableProps } from './IconButton.types';

/**
 * IconButton 컴포넌트에서 auto-anchor props인지 판별합니다.
 *
 * auto-anchor는 `component`를 명시하지 않았고, `href`가 존재하는 경우를 의미합니다.
 * 이 경우 `IconButtonBase`는 기본적으로 anchor 렌더링 경로를 탑니다.
 *
 * @param props 판별할 IconButton props
 * @returns auto-anchor props 여부
 */
export const isAutoAnchorProps = (
  props: IconButtonRenderableProps,
): props is IconButtonAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/**
 * IconButton root className 문자열을 생성합니다.
 *
 * @param params IconButton 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
export const getIconButtonClassNames = ({
  className,
  color,
  size,
  edge,
  disabled,
  loading,
}: Pick<
  IconButtonRenderableProps,
  'className' | 'color' | 'size' | 'edge' | 'disabled' | 'loading'
>) =>
  cx(
    iconButtonClasses.root,
    (disabled || loading === true) && iconButtonClasses.disabled,
    loading === true && iconButtonClasses.loading,
    edge === 'start' && iconButtonClasses.edgeStart,
    edge === 'end' && iconButtonClasses.edgeEnd,
    color === 'primary' && iconButtonClasses.colorPrimary,
    color === 'secondary' && iconButtonClasses.colorSecondary,
    size === 'sm' && iconButtonClasses.sizeSm,
    size === 'md' && iconButtonClasses.sizeMd,
    size === 'lg' && iconButtonClasses.sizeLg,
    className,
  );

/**
 * IconButton loading indicator를 생성합니다.
 *
 * @param params IconButton loading 상태와 label id
 * @returns loading indicator
 */
export const getLoadingIndicator = ({
  loading,
  loadingId,
  loadingIndicator,
}: {
  loading: boolean | null;
  loadingId: string;
  loadingIndicator?: ReactNode;
}) => {
  return (
    <span
      className={iconButtonClasses.loadingIndicator}
      role="progressbar"
      aria-labelledby={loading === true ? loadingId : undefined}
    >
      {loadingIndicator ?? <span className={iconButtonClasses.spinner} aria-hidden="true" />}
    </span>
  );
};

/**
 * IconButton loading wrapper를 생성합니다.
 *
 * @param params IconButton loading 상태와 label id
 * @returns loading wrapper
 */
export const getLoadingWrapper = ({
  loading,
  loadingId,
  loadingIndicator,
}: {
  loading: boolean | null;
  loadingId: string;
  loadingIndicator?: ReactNode;
}) => {
  if (typeof loading !== 'boolean') {
    return null;
  }

  return (
    <span className={iconButtonClasses.loadingWrapper}>
      {loading
        ? getLoadingIndicator({
            loading,
            loadingId,
            loadingIndicator,
          })
        : null}
    </span>
  );
};
