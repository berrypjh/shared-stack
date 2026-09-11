import type { AriaAttributes, ComponentPropsWithRef, ReactNode } from 'react';

import type { AccessibleNameProps } from '../../types';

export type RadioGroupOwnProps = {
  /** 모든 Radio 가 공유할 native `name`. 없으면 그룹마다 고유한 값을 만든다. */
  name?: string;

  /** 선택된 값. 주면 controlled 다 (`value !== undefined`). */
  value?: string;

  /** uncontrolled 초기값. 이후 선택은 브라우저가 가지고 form reset 이 이 값으로 되돌린다. */
  defaultValue?: string;

  /** 선택이 바뀔 때 새 값으로 불린다. 이미 선택된 것을 다시 누르면 불리지 않는다. */
  onValueChange?: (value: string) => void;

  /** 하나는 골라야 한다. native `required` 로 모든 Radio 에 간다. */
  required?: boolean;

  /** 오류 상태. 선택지 경계를 바꾼다. 설명은 `aria-describedby` 로 잇는다. */
  error?: boolean;

  children?: ReactNode;
};

/**
 * native `<fieldset>` 의 prop 을 그대로 받는다. `disabled` 는 native fieldset 전파다.
 *
 * 그룹 이름은 판별 유니온으로 강제한다: 보이는 `label`(→ `<legend>`) 이 있으면 그것이 이름이고,
 * 없으면 `aria-label`·`aria-labelledby` 중 하나가 필수다.
 */
export type RadioGroupProps = Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'defaultValue' | 'aria-label' | 'aria-labelledby'
> &
  RadioGroupOwnProps &
  (
    | {
        /** 보이는 그룹 라벨. `<legend>` 로 그려져 그룹 이름이 된다. */
        label: Exclude<ReactNode, null | undefined | boolean>;
        'aria-label'?: AriaAttributes['aria-label'];
        'aria-labelledby'?: AriaAttributes['aria-labelledby'];
      }
    | ({ label?: undefined } & AccessibleNameProps)
  );
