import { Stack } from '@berrypjh/react-native-ui';

import type { ReactNode } from 'react';

/**
 * 여러 섹션이 함께 쓰는 배치. 라이브러리 `Stack` 하나로 세웁니다.
 *
 * 간격은 spacing 토큰(`md`)에서 옵니다 — 예전에는 `StyleSheet` 가 gap 리터럴을 들고 있어서
 * 데모의 배치만 토큰 밖에 있었습니다. 색은 `palette.ts` 가 단독으로 가집니다.
 */

/** 예시를 세로로 쌓을 때. */
export const Column = ({ children }: { children: ReactNode }) => <Stack gap="md">{children}</Stack>;

/** 예시를 가로로 흘릴 때. 폭이 모자라면 줄바꿈합니다. */
export const Row = ({ children }: { children: ReactNode }) => (
  <Stack direction="row" wrap align="center" gap="md">
    {children}
  </Stack>
);
