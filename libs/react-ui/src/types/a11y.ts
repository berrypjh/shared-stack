import type { AriaAttributes } from 'react';

/**
 * 보이는 글자가 없는 컨트롤이 접근 가능한 이름을 갖도록 **최소 하나**를 요구한다.
 *
 * DOM 이 이름을 만드는 통로는 `aria-label` 과 `aria-labelledby` 둘뿐이다. 값 타입은 React 의
 * `AriaAttributes` 를 그대로 쓴다 — 문자열 별칭을 새로 만들면 DOM 계약과 갈라진다. 필수 쪽만
 * `NonNullable` 로 `undefined` 를 벗긴다.
 *
 * 배타적 union 이 아니다. 둘을 함께 주는 것은 유효한 DOM 사용이고(`aria-labelledby` 가 이긴다),
 * `never` 로 막으면 정상 코드를 거부하게 된다.
 *
 * RN 은 같은 불변식을 `accessibilityLabel: string` 으로 강제한다. 의미만 공유하고 prop 이름은
 * 각 렌더러의 것을 쓴다.
 */
export type AccessibleNameProps =
  | {
      'aria-label': NonNullable<AriaAttributes['aria-label']>;
      'aria-labelledby'?: AriaAttributes['aria-labelledby'];
    }
  | {
      'aria-label'?: AriaAttributes['aria-label'];
      'aria-labelledby': NonNullable<AriaAttributes['aria-labelledby']>;
    };

/**
 * 상속된 optional `aria-*` 를 **먼저 지운 뒤** union 을 교차한다.
 *
 * 지우지 않고 교차하면 `ButtonBaseProps` 가 이미 가진 optional 선언이 남아, 요구가 조용히
 * 무력해질 수 있는 자리를 만든다. 키를 재구성하는 편이 의도가 드러나고 안전하다.
 */
export type WithAccessibleName<T> = Omit<T, 'aria-label' | 'aria-labelledby'> & AccessibleNameProps;
