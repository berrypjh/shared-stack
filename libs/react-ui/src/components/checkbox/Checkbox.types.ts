import type { AriaAttributes, ComponentPropsWithRef, ReactNode } from 'react';

import type { AccessibleNameProps } from '../../types';

export type CheckboxOwnProps = {
  /**
   * 선택도 비선택도 아닌 혼합 상태. HTML attribute 가 없고 DOM property 로만 존재한다.
   * 클릭하면 브라우저가 지우지만, 다음 렌더에서 이 값이 다시 진실이 된다.
   */
  indeterminate?: boolean;

  /** 오류 상태. `aria-invalid` 로 알린다. 소비자 `aria-invalid` 가 이긴다. */
  error?: boolean;
};

/**
 * native `<input type="checkbox">` 의 prop 을 그대로 받는다. `type` 은 Checkbox 가 소유한다.
 *
 * 접근 가능한 이름을 판별 유니온으로 강제한다: 보이는 라벨(`children`)이 있으면 그 글자가
 * 이름이고, 없으면 `aria-label`·`aria-labelledby` 중 하나가 필수다.
 *
 * 보조 타입을 이름 붙여 교차시키지 않는다 — `dts-bundle-generator` 가 그 이름을 공개 선언으로
 * 끌어올린다.
 */
export type CheckboxProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children' | 'aria-label' | 'aria-labelledby'
> &
  CheckboxOwnProps &
  (
    | {
        /** 보이는 라벨. 누르면 토글되고 그 글자가 이름이 된다. */
        children: Exclude<ReactNode, null | undefined | boolean>;
        'aria-label'?: AriaAttributes['aria-label'];
        'aria-labelledby'?: AriaAttributes['aria-labelledby'];
      }
    | ({ children?: undefined } & AccessibleNameProps)
  );
