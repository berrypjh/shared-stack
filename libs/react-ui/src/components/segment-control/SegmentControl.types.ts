import type { ComponentPropsWithRef, ReactNode } from 'react';

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** 아이콘만 표시할 때 쓰는 aria-label */
  ariaLabel?: string;
  /** 옵션별 추가 클래스. 폰트 크기 등 옵션 고유 표시에 쓴다. */
  className?: string;
  disabled?: boolean;
};

export type SegmentControlOwnProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
};

export type SegmentControlProps<T extends string> = Omit<
  ComponentPropsWithRef<'div'>,
  keyof SegmentControlOwnProps<T> | 'children'
> &
  SegmentControlOwnProps<T>;
