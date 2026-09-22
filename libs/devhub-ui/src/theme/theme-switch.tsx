'use client';

import { useSyncExternalStore } from 'react';

import { SegmentControl } from '@berrypjh/react-ui';

import { Icon } from '../ui/icon';

import { applyTheme, currentTheme, subscribeTheme } from './theme';

/** 아이콘만 보이는 두 선택지. 해와 달이 모양을, `ariaLabel` 이 이름을 맡는다. */
const OPTIONS = [
  { value: 'light', label: <Icon name="sun" />, ariaLabel: '라이트' },
  { value: 'dark', label: <Icon name="moon" />, ariaLabel: '다크' },
] as const;

/** 라이트 / 다크 선택. `<html data-theme>` 를 읽고 쓴다. */
export const ThemeSwitch = () => {
  const mode = useSyncExternalStore(subscribeTheme, currentTheme);
  return (
    <SegmentControl
      aria-label="화면 테마"
      value={mode}
      onChange={applyTheme}
      options={OPTIONS}
      className="w-auto shrink-0"
    />
  );
};
