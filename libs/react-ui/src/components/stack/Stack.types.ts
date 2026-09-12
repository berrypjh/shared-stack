import type {
  StackAlign,
  StackDirection,
  StackJustify,
  StackSemanticProps,
} from '@berrypjh/ui-core';

import type { ComponentPropsWithRef } from 'react';

export type { StackAlign, StackDirection, StackJustify };

type HtmlDivProps = ComponentPropsWithRef<'div'>;

/**
 * 1차원 레이아웃 컨테이너의 prop.
 *
 * 시맨틱 어휘(`direction`·`gap`·`align`·`justify`·`wrap`)는 ui-core `StackSemanticProps` 가,
 * 나머지는 `<div>` 의 DOM prop 이 온다. 다섯 키는 `Omit` 으로 걷어내므로 같은 이름의 폐기된
 * HTML 속성(`<div align>`)과 충돌하지 않는다.
 *
 * **Box 의 visual prop 을 복제하지 않는다.** 면·여백·모서리가 필요하면 겹쳐 쓴다:
 *
 * ```tsx
 * <Box p="lg" bg="background.surface">
 *   <Stack gap="md">...</Stack>
 * </Box>
 * ```
 *
 * `component` prop 을 열지 않는다 — Box 와 같은 이유다. 상호작용 prop 도 없다.
 */
export type StackProps = StackSemanticProps & Omit<HtmlDivProps, keyof StackSemanticProps>;
