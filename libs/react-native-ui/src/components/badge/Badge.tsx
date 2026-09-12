import { Text, View } from 'react-native';

import { useTheme } from '../../theme';

import {
  resolveBadgeIndicatorStyle,
  resolveBadgeRootStyle,
  resolveBadgeValueStyle,
} from './Badge.styles';
import type { BadgeProps } from './Badge.types';

/**
 * overlay indicator — 앵커 위에 얹는 알림/개수/점.
 *
 * standalone status pill 이 아니다. 자기 혼자 서는 태그는 Chip 의 역할이고, 두 의미를 한 API 로
 * 섞으면 어느 쪽도 제대로 못 한다.
 *
 * **앵커를 건드리지 않는 것이 이 컴포넌트의 계약이다.** RN 에서 이것이 깨지는 두 자리:
 *
 * 1. 루트 `View` 에 `accessible` 을 걸면 RN 이 자식 트리를 **하나의 요소로 합쳐** 앵커
 *    `Pressable` 의 역할·이름·누름이 사라진다. 그래서 루트에는 절대 걸지 않는다 —
 *    이름이 필요하면 **표시자**가 가진다.
 * 2. 절대 배치된 표시자는 `pointerEvents="none"` 이 없으면 앵커 모서리의 탭을 먹는다.
 *
 * 접근성은 장식과 정보를 나눈다:
 *
 * - `label` 이 있으면 표시자가 하나의 접근성 요소로 합쳐져 그 이름만 읽힌다. 화면은 `99+`,
 *   낭독은 실제 수 — 축약이 정보를 흐리지 않게 하는 유일한 통로다.
 * - `label` 이 없는 `count` 는 보이는 숫자가 그대로 읽힌다. 이름을 지어내지 않는다.
 * - `label` 이 없는 `dot` 은 읽을 것이 없어 트리에서 빼낸다 (순수 장식).
 *
 * web 의 `role="status"` 대응물(live region)을 만들지 않는다 — RN 에 교차 플랫폼 수단이 없고,
 * 낭독에 끼어드는 동작은 소비자가 고를 일이다.
 *
 * `invisible` 은 표시자를 **내지 않는다**(감추지 않는다).
 */
export const Badge = ({
  children,
  content,
  count,
  max = 99,
  variant = 'count',
  size = 'md',
  intent = 'error',
  placement = 'top-end',
  invisible = false,
  label,
  style,
  testID,
  ...rest
}: BadgeProps) => {
  const { tokens } = useTheme();

  const isDot = variant === 'dot';
  // dot 은 내용을 갖지 않으므로 존재 자체가 표시다. count 는 0 도 유효한 값이다.
  const hasValue = content != null || count != null;
  const showIndicator = !invisible && (isDot || hasValue);

  const named = label != null && label !== '';
  const decorative = !named && isDot;

  // 축약은 숫자에만 적용한다 — `content` 는 소비자가 이미 원하는 모양으로 준 것이다.
  const displayValue = content ?? (count != null && count > max ? `${max}+` : count);

  // 문자열·숫자는 토큰 타이포로 감싸고, element 는 그대로 둔다 (Avatar 의 fallback 과 같은 규약).
  const renderedValue =
    typeof displayValue === 'string' || typeof displayValue === 'number' ? (
      <Text style={resolveBadgeValueStyle(tokens, size, intent)}>{displayValue}</Text>
    ) : (
      displayValue
    );

  return (
    <View {...rest} testID={testID} style={[resolveBadgeRootStyle(), style]}>
      {children}
      {showIndicator ? (
        <View
          testID={testID == null ? undefined : `${testID}-indicator`}
          style={resolveBadgeIndicatorStyle(tokens, { variant, size, intent, placement })}
          // 앵커 모서리의 탭을 삼키지 않는다.
          pointerEvents="none"
          // 이름이 있을 때만 하나의 요소로 합친다. 루트가 아니라 여기다 — 앵커를 삼키지 않는다.
          accessible={named || undefined}
          accessibilityLabel={named ? label : undefined}
          // 읽을 것이 없는 dot 은 트리에서 빼낸다 (iOS·Android 각각의 수단이 필요하다).
          accessibilityElementsHidden={decorative || undefined}
          importantForAccessibility={decorative ? 'no-hide-descendants' : undefined}
        >
          {isDot ? null : renderedValue}
        </View>
      ) : null}
    </View>
  );
};
