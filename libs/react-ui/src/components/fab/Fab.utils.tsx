import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { fabClasses } from './Fab.constants';
import type { FabAutoAnchorProps, FabRenderableProps } from './Fab.types';

/**
 * Fab props가 auto-anchor인지 판별.
 * auto-anchor는 `component`를 명시하지 않고 `href`가 있는 경우다.
 * 이 경우 `FabBase`는 기본적으로 anchor 렌더링 경로를 탄다.
 */
export const isAutoAnchorProps = (props: FabRenderableProps): props is FabAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/** Fab 시각 상태와 추가 className → root className */
export const getFabClassNames = ({
  className,
  color,
  size,
  shape,
}: Pick<FabRenderableProps, 'className' | 'color' | 'size' | 'shape'>) =>
  cx(
    fabClasses.root,
    shape === 'circular' && fabClasses.circular,
    shape === 'extended' && fabClasses.extended,
    size === 'sm' && fabClasses.sizeSm,
    size === 'md' && fabClasses.sizeMd,
    size === 'lg' && fabClasses.sizeLg,
    color === 'primary' && fabClasses.colorPrimary,
    color === 'secondary' && fabClasses.colorSecondary,
    className,
  );

/** Fab children과 icon → content */
export const getFabContent = ({ children, icon }: { children?: ReactNode; icon?: ReactNode }) => {
  return (
    <span className={fabClasses.content}>
      {icon != null ? (
        <span className={fabClasses.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children != null ? <span className={fabClasses.label}>{children}</span> : null}
    </span>
  );
};
