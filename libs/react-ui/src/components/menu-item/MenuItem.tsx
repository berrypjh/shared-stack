'use client';

import type { MouseEvent, ReactElement, ReactNode } from 'react';

import type { MenuItemProps as MenuItemSemanticProps } from '../../types';

/**
 * `<Select>` 의 declarative 슬롯 마커. 자체 렌더링 없이 `value`·`children`·`disabled`만 부모(Select)가
 * children으로 읽어 옵션으로 사용한다.
 */
export interface MenuItemProps extends MenuItemSemanticProps {
  children?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export const MenuItem = (_props: MenuItemProps): ReactElement | null => {
  return null;
};

export default MenuItem;
