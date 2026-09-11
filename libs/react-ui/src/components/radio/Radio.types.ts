import type { AriaAttributes, ComponentPropsWithRef, ReactNode } from 'react';

import type { AccessibleNameProps } from '../../types';

/**
 * native `<input type="radio">` 의 prop 을 그대로 받는다. `type` 은 Radio 가 소유한다.
 *
 * `value` 는 필수다 — 같은 `name` 안에서 선택을 가르는 키이자 제출 값이다.
 * 접근 가능한 이름은 Checkbox 와 같은 판별 유니온으로 강제한다.
 *
 * `aria-invalid` 는 받지 않는다: ARIA 1.2 에서 radio 역할이 지원하지 않는다. 오류는
 * 그룹(`RadioGroup`)이 소유한다.
 */
export type RadioProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children' | 'value' | 'aria-label' | 'aria-labelledby' | 'aria-invalid'
> & {
  value: string;
} & (
    | {
        /** 보이는 라벨. 누르면 선택되고 그 글자가 이름이 된다. */
        children: Exclude<ReactNode, null | undefined | boolean>;
        'aria-label'?: AriaAttributes['aria-label'];
        'aria-labelledby'?: AriaAttributes['aria-labelledby'];
      }
    | ({ children?: undefined } & AccessibleNameProps)
  );
