import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { fabClasses } from './Fab.constants';
import type { FabAutoAnchorProps, FabRenderableProps } from './Fab.types';

/**
 * Fab 컴포넌트에서 auto-anchor props인지 판별합니다.
 *
 * auto-anchor는 `component`를 명시하지 않았고, `href`가 존재하는 경우를 의미합니다.
 * 이 경우 `FabBase`는 기본적으로 anchor 렌더링 경로를 탑니다.
 *
 * @param props 판별할 Fab props
 * @returns auto-anchor props 여부
 */
export const isAutoAnchorProps = (props: FabRenderableProps): props is FabAutoAnchorProps => {
  return props.component == null && 'href' in props && props.href != null;
};

/**
 * Fab root className 문자열을 생성합니다.
 *
 * @param params Fab 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
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

/**
 * Fab content를 생성합니다.
 *
 * @param params Fab children과 icon
 * @returns content
 */
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
