import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { buttonClasses } from './Button.constants';
import type {
  ButtonAutoAnchorProps,
  ButtonLoadingPosition,
  ButtonRenderableProps,
} from './Button.types';

/**
 * Button의 auto-anchor props 판별.
 * auto-anchor는 `component`를 명시하지 않고 `href`가 있는 경우이며, 이때 `ButtonBase`는 anchor 렌더링 경로를 탄다.
 */
export const isAutoAnchorProps = (props: ButtonRenderableProps): props is ButtonAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/** Button loading 상태와 추가 className → root className */
export const getButtonClassNames = ({
  className,
  loading,
  loadingPosition,
}: Pick<ButtonRenderableProps, 'className' | 'loading' | 'loadingPosition'>) =>
  cx(
    buttonClasses.root,
    loading && buttonClasses.loading,
    loading && loadingPosition === 'start' && buttonClasses.loadingPositionStart,
    loading && loadingPosition === 'center' && buttonClasses.loadingPositionCenter,
    loading && loadingPosition === 'end' && buttonClasses.loadingPositionEnd,
    className,
  );

/** start icon과 loading 상태 → start icon 슬롯 */
export const getStartIcon = ({
  startIcon,
  loading,
  loadingPosition,
}: {
  startIcon?: ReactNode;
  loading: boolean;
  loadingPosition: ButtonLoadingPosition;
}) => {
  if (startIcon == null && !(loading && loadingPosition === 'start')) {
    return null;
  }

  return (
    <span className={cx(buttonClasses.icon, buttonClasses.startIcon)} aria-hidden="true">
      {startIcon ?? <span className={buttonClasses.loadingIconPlaceholder} />}
    </span>
  );
};

/** end icon과 loading 상태 → end icon 슬롯 */
export const getEndIcon = ({
  endIcon,
  loading,
  loadingPosition,
}: {
  endIcon?: ReactNode;
  loading: boolean;
  loadingPosition: ButtonLoadingPosition;
}) => {
  if (endIcon == null && !(loading && loadingPosition === 'end')) {
    return null;
  }

  return (
    <span className={cx(buttonClasses.icon, buttonClasses.endIcon)} aria-hidden="true">
      {endIcon ?? <span className={buttonClasses.loadingIconPlaceholder} />}
    </span>
  );
};

/** loading indicator와 label id → loading indicator */
export const getLoadingIndicator = ({
  children,
  labelId,
  loadingIndicator,
}: {
  children?: ReactNode;
  labelId: string;
  loadingIndicator?: ReactNode;
}) => {
  return (
    <span
      className={buttonClasses.loadingIndicator}
      role="progressbar"
      aria-labelledby={children != null ? labelId : undefined}
    >
      {loadingIndicator ?? <span className={buttonClasses.spinner} aria-hidden="true" />}
    </span>
  );
};

/** loading 상태와 label id → loader */
export const getLoader = ({
  loading,
  children,
  labelId,
  loadingIndicator,
}: {
  loading: boolean;
  children?: ReactNode;
  labelId: string;
  loadingIndicator?: ReactNode;
}) => {
  if (!loading) {
    return null;
  }

  return (
    <span className={buttonClasses.loadingWrapper}>
      {getLoadingIndicator({
        children,
        labelId,
        loadingIndicator,
      })}
    </span>
  );
};

/** content와 label id → 라벨 content */
export const getContent = ({ children, labelId }: { children?: ReactNode; labelId: string }) => {
  if (children == null) {
    return null;
  }

  return (
    <span id={labelId} className={buttonClasses.label}>
      {children}
    </span>
  );
};
