import { themes } from '@berrypjh/ui-core';

import type { ReactNode } from 'react';

import { ThemeProvider } from '../src/theme/ThemeProvider';

/**
 * 등록된 **모든 테마**를 세로로 쌓아 한 스크린샷에 담는 갤러리.
 *
 * 테마 이름을 손으로 적지 않고 `themes` 레지스트리를 순회한다 — 목록을 박아 두면
 * design-tokens 에 테마가 늘어도 갤러리만 조용히 낡아 새 테마가 커버리지에서 빠진다.
 *
 * 이 파일은 `.storybook/` 에 있다. `tsconfig.storybook.json` 이 타입을 검사하고
 * `tsconfig.lib.json` 은 `.storybook/**` 를 **제외**하므로, 스토리 전용 헬퍼가 패키지
 * 산출물로 새어 나갈 수 없다.
 *
 * 갤러리를 쓰는 story 는 `parameters.disableThemeDecorator: true` 를 함께 켜야 한다 —
 * 바깥 데코레이터가 한 테마로 덮으면 테마별 비교가 되지 않는다.
 */
export const themeGalleryParameters = {
  layout: 'padded',
  disableThemeDecorator: true,
} as const;

export const ThemeGallery = ({ children }: { children: (theme: string) => ReactNode }) => (
  <div style={{ display: 'grid', gap: '24px' }}>
    {themes.map(({ name }) => (
      <ThemeProvider
        key={name}
        mode={name}
        style={{
          display: 'grid',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--ds-radius-md)',
          background: 'var(--ds-background-default)',
          color: 'var(--ds-text-default)',
        }}
      >
        <strong style={{ fontSize: 'var(--ds-body-small-strong-font-size)' }}>{name}</strong>
        {children(name)}
      </ThemeProvider>
    ))}
  </div>
);
