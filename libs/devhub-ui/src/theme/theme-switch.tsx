'use client';

import { useSyncExternalStore } from 'react';

import { SegmentControl } from '@berrypjh/react-ui';

import { Icon } from '../ui/icon';

import {
  applyTheme,
  currentTheme,
  DEFAULT_THEME_PAIR,
  subscribeTheme,
  type ThemeMode,
  type ThemePair,
} from './theme';

/** 아이콘만 보이는 두 선택지. 해와 달이 모양을, `ariaLabel` 이 이름을 맡는다. */
const OPTIONS = [
  { value: 'light', label: <Icon name="sun" />, ariaLabel: '라이트' },
  { value: 'dark', label: <Icon name="moon" />, ariaLabel: '다크' },
] as const;

/**
 * 라이트 / 다크 선택. `<html data-theme>` 를 읽고 쓴다. 고르는 것은 색 모드이고, 모드마다 쓸 토큰 테마는
 * `themePair`(기본 `light` · `dark`)가 정한다.
 */
export const ThemeSwitch = ({ themePair = DEFAULT_THEME_PAIR }: { themePair?: ThemePair }) => {
  const mode = useSyncExternalStore(subscribeTheme, () => currentTheme(themePair));
  return (
    <SegmentControl
      aria-label="화면 테마"
      value={mode}
      onChange={(next: ThemeMode) => applyTheme(next, themePair)}
      options={OPTIONS}
      className="w-auto shrink-0"
    />
  );
};
