import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { useTheme } from '../../theme';

import {
  resolveAvatarFallbackStyle,
  resolveAvatarImageStyle,
  resolveAvatarRootStyle,
} from './Avatar.styles';
import type { AvatarProps } from './Avatar.types';

/**
 * 정적 identity visual. `source` 가 있으면 `Image` 로, 없거나 실패하면 fallback 으로 그린다.
 *
 * `Pressable` 이 아니라 `View` 다 — 누를 수 있는 identity 컨트롤은 소비자가 `Pressable`/
 * `IconButton` 으로 감싼다. 그래서 최소 터치 타깃(`spacing.4xl`)도 얹지 않는다: 상호작용이
 * 없는 것을 48dp 로 부풀리면 레이아웃만 망가진다.
 *
 * 접근성:
 *
 * - 이미지와 fallback 은 **동시에 렌더되지 않는다**. 둘 중 하나만 트리에 있으므로 같은 정보가
 *   두 번 읽힐 수 없다.
 * - `accessibilityLabel` 을 주면 루트가 `accessible` + `image` 역할을 갖는다. RN 은 그때
 *   자식 트리를 하나의 요소로 합치므로 이니셜 글자가 따라 읽히지 않는다.
 * - 주지 않으면 역할·이름을 **지어내지 않는다**. fallback 글자는 그대로 읽히고 `Image` 는
 *   이름이 없다(RN 기본). web 의 `alt=""` 3-상태는 옮기지 않는다 — RN 은 장식이 기본이다.
 */
export const Avatar = ({
  source,
  accessibilityLabel,
  size = 'md',
  shape = 'circle',
  children,
  onError,
  style,
  testID,
  ...rest
}: AvatarProps) => {
  const { tokens } = useTheme();

  // 실패를 현재 source 에 매어 둔다 — source 가 바뀌면 effect 없이 깨끗하게 다시 시도된다.
  // 렌더 중 상태 초기화는 web `Select` 의 `prevListOpen` 과 같은 관용구다.
  const [failedSource, setFailedSource] = useState<AvatarProps['source']>(undefined);
  const [lastSource, setLastSource] = useState(source);

  if (source !== lastSource) {
    setLastSource(source);
    setFailedSource(undefined);
  }

  const showImage = source != null && failedSource !== source;
  const named = accessibilityLabel != null && accessibilityLabel !== '';

  return (
    <View
      {...rest}
      testID={testID}
      style={[resolveAvatarRootStyle(tokens, size, shape), style]}
      // 이름이 있을 때만 하나의 image 요소로 합친다. 없으면 역할을 지어내지 않는다.
      accessible={named || undefined}
      accessibilityRole={named ? 'image' : undefined}
      accessibilityLabel={named ? accessibilityLabel : undefined}
    >
      {showImage ? (
        <Image
          testID={testID == null ? undefined : `${testID}-image`}
          source={source}
          style={resolveAvatarImageStyle(tokens, size, shape)}
          resizeMode="cover"
          onError={(event) => {
            setFailedSource(source);
            onError?.(event);
          }}
        />
      ) : typeof children === 'string' || typeof children === 'number' ? (
        <Text style={resolveAvatarFallbackStyle(tokens, size)}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
