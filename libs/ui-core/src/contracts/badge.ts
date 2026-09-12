/**
 * Badge 의 시맨틱 계약.
 *
 * Badge 는 **overlay indicator** 다 — 앵커 위에 얹는 알림/개수/점이고, 자기 혼자 서는
 * status pill 이 아니다. 그 역할(standalone tag/action)은 Chip 이 가지므로 두 의미를 한 API 로
 * 섞지 않는다.
 *
 * 두 렌더러가 같은 불변식을 실제로 구현해서 공유합니다:
 * - `variant`·`size`·`intent` — 같은 값 집합을 같은 토큰으로 풉니다.
 * - `placement` — 같은 **논리 방향** 어휘. 좌표는 각 렌더러가 만듭니다.
 * - `count`·`max` — 같은 절단 규칙: `count > max` 면 `{max}+` 를 보여 줍니다.
 * - `invisible` — 표시자를 렌더하지 않습니다 (감추는 것이 아니라 **내지 않습니다**).
 *
 * Badge 는 누를 수 없습니다. hover·pressed·focus·selected·disabled 가 없고 자체 이벤트도
 * 없습니다 — 누를 수 있는 알림은 소비자가 앵커를 `ButtonBase`(web)/`Pressable`(RN)로 만듭니다.
 *
 * 승격하지 않은 것:
 * - **앵커·content 슬롯**: `ReactNode` 는 렌더러 타입입니다.
 * - **접근 가능한 이름**: web `aria-label`(+`role="img"`) vs RN `accessibilityLabel`. 수단이
 *   다르고 web 에는 `aria-hidden` 이라는 별도 통로가 있습니다.
 * - **위치 좌표·스타일·쌓임 순서**: web 은 논리 `inset-*` CSS, RN 은 절대 배치 `ViewStyle`.
 * - **`max` 포맷 함수**: 규칙은 같지만 한 줄 비교라 공유 유틸로 올릴 값이 없습니다.
 */
export type BadgeVariant = 'count' | 'dot';
export type BadgeSize = 'sm' | 'md';

/**
 * 대비가 검증된 네 가지.
 *
 * `warning`·`success` 는 **일부러 없습니다.** 7개 테마 실측에서 그 면 위의 `text.contrastText`
 * 가 ember 에서 4.35·4.34 로 WCAG AA(4.5) 에 미달합니다. 기준을 낮추는 대신 어휘에서 뺐습니다.
 */
export type BadgeIntent = 'primary' | 'secondary' | 'error' | 'neutral';

/** 논리 방향입니다 — `end`/`start` 라 RTL 에서 좌우가 자동으로 뒤집힙니다. */
export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

export interface BadgeSemanticProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  intent?: BadgeIntent;
  placement?: BadgePlacement;

  /** 숫자 내용. `variant: 'dot'` 이면 무시됩니다. */
  count?: number;

  /** `count` 절단 기준. `count > max` 면 `{max}+`. */
  max?: number;

  /** 표시자를 렌더하지 않습니다. 앵커는 그대로 남습니다. */
  invisible?: boolean;
}
