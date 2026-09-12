import type { AvatarSemanticProps, AvatarShape, AvatarSize } from '@berrypjh/ui-core';

import type { ReactNode, Ref } from 'react';
import type {
  ImageErrorEventData,
  ImageSourcePropType,
  NativeSyntheticEvent,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

export type { AvatarShape, AvatarSize };

/** 파일 내부 조립용. 배럴로 내보내지 않는다 — RN 은 `*OwnProps` 를 공개하지 않는 관례다. */
type AvatarOwnProps = {
  /** 이미지 출처. 없거나 로드에 실패하면 `children` 이 대신 그려진다. */
  source?: ImageSourcePropType;

  /**
   * 접근 가능한 이름.
   *
   * 주면 루트가 `image` 역할을 가진 **하나의** 접근성 요소로 합쳐진다 — 이미지든 이니셜이든
   * 이 이름만 읽히므로 중복 낭독이 없다. 주지 않으면 역할·이름을 지어내지 않고, fallback
   * 글자가 그대로 읽힌다.
   *
   * web 의 `alt=""` 같은 "명시적 장식" 3-상태는 없다. RN 이미지는 이름 없는 것이 기본이라
   * 장식이 이미 기본값이다.
   */
  accessibilityLabel?: string;

  /** 이미지 로드 실패 시 그릴 것. 보통 이니셜이나 아이콘. 문자열·숫자는 토큰 타이포로 감싼다. */
  children?: ReactNode;

  /**
   * 이미지 로드 실패 알림. **`Image` 의 이벤트다.**
   *
   * Avatar 는 이 이벤트를 fallback 전환에 쓰지만 삼키지는 않는다.
   */
  onError?: (event: NativeSyntheticEvent<ImageErrorEventData>) => void;

  /**
   * 호스트 `View`. `ViewProps` 에는 `ref` 필드가 없어서 공개 컴포넌트마다 직접 선언한다
   * (Box·Button·Select 등과 같은 규약).
   */
  ref?: Ref<View>;

  style?: StyleProp<ViewStyle>;
};

/**
 * 정적 identity visual.
 *
 * 시맨틱 어휘(`size`·`shape`)는 ui-core `AvatarSemanticProps` 가, 나머지는 `ViewProps` 에서 온다.
 * `Pressable` 이 아니라 `View` 다 — 누를 수 있는 identity 컨트롤은 소비자가 `Pressable`/
 * `IconButton` 으로 감싼다. 그래서 상호작용 prop 도, 최소 터치 타깃도 없다.
 */
export type AvatarProps = AvatarSemanticProps &
  AvatarOwnProps &
  Omit<ViewProps, keyof AvatarOwnProps | keyof AvatarSemanticProps>;
