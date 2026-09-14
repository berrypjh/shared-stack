import type { ReactNode, Ref } from 'react';
import type { Text, TextProps } from 'react-native';

/**
 * 필드 아래 보조/오류 텍스트.
 *
 * `size`는 없다 — web의 `--size-sm`/`--size-md`가 둘 다 base와 같은 margin만 지정해서
 * 시각적으로 완전히 같다. 입력과의 설명 관계도 만들지 않는다: `aria-describedby`에 해당하는
 * 교차 플랫폼 수단이 없다. `nativeID`·`accessibilityLiveRegion` 같은 네이티브 접근성 prop은
 * 그대로 전달하므로 정책은 소비자가 고른다.
 */
export type FormHelperTextProps = Omit<TextProps, 'children'> & {
  ref?: Ref<Text>;
  children?: ReactNode;

  disabled?: boolean;
  error?: boolean;
};
