import { Pressable } from 'react-native';

import type { PressableStateCallbackType } from 'react-native';

import { useTheme } from '../../theme';

import type { ButtonBaseProps } from './ButtonBase.types';

/**
 * Button·Fab·IconButton이 공유하는 Pressable 동작 원시. 내부 전용입니다.
 *
 * 이 디렉터리에는 `index.ts`를 두지 않습니다. `components/<name>/index.ts`는 공개 컴포넌트
 * 표시이고, 카탈로그 생성 테스트가 그 배럴의 export가 모두 소비자 카탈로그에 실렸는지
 * 검사합니다. 형제 컴포넌트는 `../button-base/ButtonBase`로 직접 import 합니다.
 *
 * 담당 범위는 Pressable 호스트, button 시맨틱, disabled 강제, ref/prop 전달, style 우선순위뿐입니다.
 * 라벨·아이콘·로딩·shape은 각 컴포넌트가 가집니다. pressed 시각 표현도 없습니다 — 정확한
 * `pressed`를 넘기는 데까지가 책임입니다.
 *
 * style 우선순위:
 * 1. 구조 style (정렬) — 덮어쓸 수 있습니다.
 * 2. 소비자 style
 * 3. 최소 터치 타깃 — 맨 뒤라서 덮어쓸 수 없습니다.
 */
export const ButtonBase = ({ disabled = false, style, children, ...rest }: ButtonBaseProps) => {
  const { tokens } = useTheme();
  const minTouchTarget = tokens.spacing['4xl'];

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      // 항상 boolean으로 넘깁니다. RN Pressable은 `disabled`가 non-null일 때만
      // `accessibilityState.disabled`와 `aria-disabled`를 실제 값으로 덮습니다.
      disabled={disabled}
      style={({ pressed }) => [
        { alignItems: 'center', justifyContent: 'center' },
        typeof style === 'function' ? style({ pressed: pressed && !disabled }) : style,
        { minWidth: minTouchTarget, minHeight: minTouchTarget },
      ]}
    >
      {typeof children === 'function'
        ? ({ pressed }: PressableStateCallbackType) => children({ pressed: pressed && !disabled })
        : children}
    </Pressable>
  );
};
