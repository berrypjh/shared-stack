import type { AriaAttributes, ComponentPropsWithRef, ReactNode } from 'react';

import type { AccessibleNameProps } from '../../types';

/**
 * native `<input type="checkbox" role="switch">` 의 prop 을 그대로 받는다.
 * `type`·`role` 은 Switch 가 소유한다.
 *
 * 켜짐/꺼짐은 `checked`(·`defaultChecked`)가 전한다 — 이름에 상태 문자열을 붙이지 않는다.
 * 접근 가능한 이름은 Checkbox 와 같은 판별 유니온으로 강제한다.
 *
 * 오류 API(`error`)는 두지 않는다. 설정 토글에는 검증 시맨틱이 드물고, 필요하면 native
 * `required`·`aria-invalid` 가 그대로 input 에 간다.
 */
export type SwitchProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'role' | 'children' | 'aria-label' | 'aria-labelledby'
> &
  (
    | {
        /** 보이는 라벨. 누르면 토글되고 그 글자가 이름이 된다. */
        children: Exclude<ReactNode, null | undefined | boolean>;
        'aria-label'?: AriaAttributes['aria-label'];
        'aria-labelledby'?: AriaAttributes['aria-labelledby'];
      }
    | ({ children?: undefined } & AccessibleNameProps)
  );
