import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { buttonClasses } from './Button.constants';
import type {
  ButtonAutoAnchorProps,
  ButtonLoadingPosition,
  ButtonRenderableProps,
} from './Button.types';

/**
 * Button 컴포넌트에서 auto-anchor props인지 판별합니다.
 *
 * auto-anchor는 `component`를 명시하지 않았고, `href`가 존재하는 경우를 의미합니다.
 * 이 경우 `ButtonBase`는 기본적으로 anchor 렌더링 경로를 탑니다.
 *
 * @param props 판별할 Button props
 * @returns auto-anchor props 여부
 */
export const isAutoAnchorProps = (props: ButtonRenderableProps): props is ButtonAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/**
 * Button root className 문자열을 생성합니다.
 *
 * @param params Button 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
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

/**
 * Button start icon을 생성합니다.
 *
 * @param params Button start icon과 loading 상태
 * @returns start icon
 */
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

/**
 * Button end icon을 생성합니다.
 *
 * @param params Button end icon과 loading 상태
 * @returns end icon
 */
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

/**
 * Button loading indicator를 생성합니다.
 *
 * @param params Button loading indicator와 label id
 * @returns loading indicator
 */
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

/**
 * Button loader를 생성합니다.
 *
 * @param params Button loading 상태와 label id
 * @returns loader
 */
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

/**
 * Button content를 생성합니다.
 *
 * @param params Button content와 label id
 * @returns content
 */
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
