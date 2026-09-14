import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { iconButtonClasses } from './IconButton.constants';
import type { IconButtonAutoAnchorProps, IconButtonRenderableProps } from './IconButton.types';

/**
 * IconButton props가 auto-anchor인지 판별.
 * auto-anchor는 `component`를 명시하지 않고 `href`가 있는 경우다.
 * 이 경우 `IconButtonBase`는 기본적으로 anchor 렌더링 경로를 탄다.
 */
export const isAutoAnchorProps = (
  props: IconButtonRenderableProps,
): props is IconButtonAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/** IconButton 시각 상태와 추가 className → root className */
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

/** IconButton loading 상태와 label id → loading indicator */
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

/** IconButton loading 상태와 label id → loading wrapper */
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
