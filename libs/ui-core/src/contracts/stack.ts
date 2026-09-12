import type { BoxSpacingValue } from './box';

/**
 * Stack 의 시맨틱 계약 — **1차원 배치 축**만 가집니다.
 *
 * Box 와는 합성 관계이지 계승 관계가 아닙니다. Box 가 면·여백·모서리(`p`·`m`·`bg`·`radius`)를
 * 가지고 Stack 은 자식을 한 축으로 흘리는 규칙만 가집니다. 그래서 `BoxProps` 를 extends 하지
 * 않습니다 — 둘 다 필요하면 소비자가 겹쳐 씁니다.
 *
 * 두 렌더러가 구현해야 하는 불변식:
 *
 * - **`direction` 미지정은 `column`**. 이것을 계약이 못박는 이유는 두 플랫폼의 기본값이
 *   **갈리기 때문**입니다 — CSS `flex-direction` 기본값은 `row`, RN Yoga 기본값은 `column`.
 *   web 렌더러는 세로 축을 명시해야 하고, 기본값에 기대면 안 됩니다. 이름이 "Stack" 인 것도
 *   세로 쌓기가 기본이라는 뜻입니다.
 * - **어휘는 정규화된 이름**입니다. `start`·`end`·`between` 을 각 렌더러가 자기 표현으로
 *   풉니다 (web `flex-start`/`flex-end`/`space-between`, RN 동일 문자열). 렌더러 표현을
 *   계약에 그대로 올리지 않습니다 — Box 의 spacing 토큰과 같은 방식입니다.
 * - **나머지 미지정은 양 플랫폼 flexbox 기본값과 같습니다**: `align` 은 `stretch`,
 *   `justify` 는 `start`, `wrap` 은 `false`. 세 값 모두 web/RN 기본값이 일치해서 계약이
 *   따로 뒤집을 이유가 없습니다.
 * - **`gap`** 은 Box 와 **같은 값 도메인**입니다 (`BoxSpacingValue`). 토큰 이름이면 해석된
 *   토큰 값, `number` 면 렌더러의 기본 길이 단위(web = px, RN = density-independent pixel).
 *   `0` 은 "미지정" 이 아니라 "간격 없음" 입니다.
 *
 * Stack 은 **비상호작용** 입니다. hover·pressed·focus·selected·disabled 가 없고, 접근성
 * 역할도 지어내지 않습니다 — 목록이면 소비자가 그 시맨틱을 줍니다.
 *
 * 승격하지 않은 것:
 * - **자식 자리 prop** (`grow`·`shrink`·`basis`·`order`·`alignSelf`): 컨테이너가 아니라
 *   자식이 정합니다. Stack 은 축만 정합니다.
 * - **2차원 배치** (`columns`·`rows`): Stack 의 역할이 아닙니다. 이 저장소에는 `grid-cols`·
 *   `grid-template`·`numColumns` 사용처가 **하나도 없어서** Grid 계약을 두지 않습니다.
 * - **반응형 객체**: 브레이크포인트 어휘가 두 플랫폼에 공통으로 없습니다. web 전용이면
 *   `react-ui` 가 가집니다.
 * - **슬롯·스타일·접근성 prop**: `children`·`className`·`style`·`testID`·`accessibilityRole`
 *   전부 렌더러 소유입니다.
 */
export type StackDirection = 'column' | 'row';

/**
 * 교차 축 정렬.
 *
 * `baseline` 은 **DEFER 입니다 — 실격이 아닙니다.** 양 플랫폼이 지원하고 뜻도 같습니다.
 * V1 에서 빼는 이유는 union 멤버 **추가는 non-breaking 이고 제거는 breaking** 이라서,
 * 소비 근거가 렌더러 구현으로 확인된 뒤에 넣는 편이 싸기 때문입니다.
 */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** 주축 분배. `space-around`·`space-evenly` 는 소비처가 없어 V1 에 두지 않습니다. */
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface StackSemanticProps {
  /** 미지정은 `column` 입니다. 두 플랫폼의 기본값이 갈리므로 렌더러가 명시해야 합니다. */
  direction?: StackDirection;

  /** 자식 사이 간격. Box 와 같은 값 도메인이고, `0` 은 미지정과 다릅니다. */
  gap?: BoxSpacingValue;

  /** 교차 축 정렬. 미지정은 `stretch` 입니다. */
  align?: StackAlign;

  /** 주축 분배. 미지정은 `start` 입니다. */
  justify?: StackJustify;

  /** 줄바꿈 허용. 미지정은 `false` 입니다. */
  wrap?: boolean;
}
