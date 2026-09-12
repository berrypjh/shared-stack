/**
 * RN Avatar 계약.
 *
 * Avatar 는 **정적 identity visual** 이다 — `Pressable` 이 아니고 최소 터치 타깃도 적용하지
 * 않는다. 누를 수 있는 identity 컨트롤은 소비자가 `Pressable`/`IconButton` 으로 감싼다.
 *
 * web `alt` 를 그대로 옮기지 않는다. RN 이미지는 **이름 없는 것이 기본** 이라 web 의
 * `alt=""`(명시적 장식) 3-상태가 필요 없다. `accessibilityLabel` 유무만으로 갈린다:
 * 주면 루트가 하나의 `image` 요소로 합쳐지고, 없으면 fallback 글자가 그대로 읽힌다.
 */
import { type ReactElement } from 'react';
import { type ImageStyle, type TextStyle, View, type ViewStyle } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../theme';

import { Avatar } from './Avatar';
import * as barrel from './index';

const T = Native.Light.tokens;
const SOURCE = { uri: 'https://example.test/avatar.png' };

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const root = () => screen.getByTestId('avatar');

/** Avatar 가 계산한 루트 style. 소비자 style 과 구분하려고 배열 첫 칸만 본다. */
const rootStyle = (): ViewStyle => (root().props.style as [ViewStyle, unknown])[0];

describe('루트', () => {
  it('View 를 렌더하고 Pressable 이 아니다', async () => {
    await show(<Avatar testID="avatar">길동</Avatar>);

    expect(root()).toBeOnTheScreen();
    // 정적 visual 이라 누름 역할이 없다.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('ViewProps 를 루트로 전달한다', async () => {
    await show(
      <Avatar testID="avatar" pointerEvents="none">
        길동
      </Avatar>,
    );

    expect(root().props.pointerEvents).toBe('none');
  });

  it('최소 터치 타깃을 적용하지 않는다 — 상호작용이 없다', async () => {
    await show(<Avatar testID="avatar" size="sm" />);

    const style = rootStyle();

    expect(style.minWidth).toBeUndefined();
    expect(style.minHeight).toBeUndefined();
    // sm 은 24 다. 터치 타깃(48)으로 부풀려지지 않는다.
    expect(style.width).toBe(T.spacing.xl);
  });
});

describe('이미지', () => {
  it('source 를 주면 Image 를 렌더한다', async () => {
    await show(<Avatar testID="avatar" source={SOURCE} accessibilityLabel="홍길동" />);

    const image = screen.getByTestId('avatar-image');

    expect(image.props.source).toEqual(SOURCE);
  });

  it('이미지가 보이는 동안 fallback 을 렌더하지 않는다 — 중복 낭독 방지', async () => {
    await show(
      <Avatar testID="avatar" source={SOURCE} accessibilityLabel="홍길동">
        길동
      </Avatar>,
    );

    expect(screen.getByTestId('avatar-image')).toBeOnTheScreen();
    expect(screen.queryByText('길동')).toBeNull();
  });

  it('이미지를 shape 에 맞춰 잘라낸다', async () => {
    await show(<Avatar testID="avatar" source={SOURCE} shape="circle" />);

    const image = screen.getByTestId('avatar-image');

    // Android 는 루트 overflow 만으로 모서리가 남아서 이미지에도 직접 준다.
    expect((image.props.style as ImageStyle).borderRadius).toBe(T.radius.rounded);
    expect(image.props.resizeMode).toBe('cover');
  });
});

describe('접근성', () => {
  it('accessibilityLabel 을 주면 루트가 하나의 image 요소가 된다', async () => {
    await show(
      <Avatar testID="avatar" source={SOURCE} accessibilityLabel="홍길동">
        길동
      </Avatar>,
    );

    expect(screen.getByRole('image', { name: '홍길동' })).toBe(root());
    expect(root().props.accessible).toBe(true);
  });

  it('label 이 없으면 루트에 역할과 이름을 지어내지 않는다', async () => {
    await show(<Avatar testID="avatar" source={SOURCE} />);

    expect(screen.queryByRole('image')).toBeNull();
    expect(root().props.accessibilityLabel).toBeUndefined();
  });

  it('label 이 없으면 fallback 글자가 그대로 읽힌다', async () => {
    await show(<Avatar testID="avatar">길동</Avatar>);

    // 루트가 트리를 합치지 않으므로 보이는 글자가 유일한 정보다.
    expect(root().props.accessible).not.toBe(true);
    expect(screen.getByText('길동')).toBeOnTheScreen();
  });

  it('선택·비활성 상태를 알리지 않는다', async () => {
    await show(
      <Avatar testID="avatar" accessibilityLabel="홍길동">
        길동
      </Avatar>,
    );

    const state = root().props.accessibilityState;

    expect(state?.selected).toBeUndefined();
    expect(state?.disabled).toBeUndefined();
  });
});

describe('fallback', () => {
  it('source 가 없으면 fallback 을 렌더한다', async () => {
    await show(<Avatar testID="avatar">길동</Avatar>);

    expect(screen.queryByTestId('avatar-image')).toBeNull();
    expect(screen.getByText('길동')).toBeOnTheScreen();
  });

  it('문자열 fallback 을 토큰 타이포로 감싼다', async () => {
    await show(<Avatar testID="avatar">길동</Avatar>);

    const style = screen.getByText('길동').props.style as TextStyle;

    expect(style.color).toBe(T.color.text.default);
    expect(style.fontSize).toBe(T.typography.body.smallStrong.fontSize);
  });

  it('element fallback 은 그대로 렌더한다 — Text 로 감싸지 않는다', async () => {
    await show(
      <Avatar testID="avatar">
        <View testID="inner" />
      </Avatar>,
    );

    expect(screen.getByTestId('inner')).toBeOnTheScreen();
  });

  it('fallback 이 없으면 빈 루트로 남는다', async () => {
    await show(<Avatar testID="avatar" />);

    expect(screen.queryByTestId('avatar-image')).toBeNull();
    expect(root()).toBeOnTheScreen();
  });
});

describe('이미지 실패', () => {
  it('error 가 나면 fallback 으로 바꾼다', async () => {
    await show(
      <Avatar testID="avatar" source={SOURCE} accessibilityLabel="홍길동">
        길동
      </Avatar>,
    );

    await fireEvent(screen.getByTestId('avatar-image'), 'error');

    expect(screen.queryByTestId('avatar-image')).toBeNull();
    expect(screen.getByText('길동')).toBeOnTheScreen();
  });

  it('소비자 onError 를 삼키지 않는다', async () => {
    const onError = jest.fn();

    await show(<Avatar testID="avatar" source={SOURCE} onError={onError} />);
    await fireEvent(screen.getByTestId('avatar-image'), 'error');

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('source 가 바뀌면 실패 상태를 초기화하고 다시 시도한다', async () => {
    const { rerender } = await show(
      <Avatar testID="avatar" source={SOURCE}>
        길동
      </Avatar>,
    );

    await fireEvent(screen.getByTestId('avatar-image'), 'error');
    expect(screen.queryByTestId('avatar-image')).toBeNull();

    const next = { uri: 'https://example.test/next.png' };
    await rerender(
      <ThemeProvider>
        <Avatar testID="avatar" source={next}>
          길동
        </Avatar>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('avatar-image').props.source).toEqual(next);
  });
});

describe('size', () => {
  it('기본값은 md 다', async () => {
    await show(<Avatar testID="avatar" />);

    expect(rootStyle().width).toBe(T.spacing['2xl']);
    expect(rootStyle().height).toBe(T.spacing['2xl']);
  });

  it.each([
    ['sm', T.spacing.xl],
    ['md', T.spacing['2xl']],
    ['lg', T.spacing['4xl']],
  ] as const)('size=%s 는 %s 를 쓴다', async (size, expected) => {
    await show(<Avatar testID="avatar" size={size} />);

    expect(rootStyle().width).toBe(expected);
    expect(rootStyle().height).toBe(expected);
  });
});

describe('shape', () => {
  it('기본값은 circle 이다', async () => {
    await show(<Avatar testID="avatar" />);

    expect(rootStyle().borderRadius).toBe(T.radius.rounded);
  });

  it.each([
    ['circle', T.radius.rounded],
    ['rounded', T.radius.md],
  ] as const)('shape=%s 는 %s 를 쓴다', async (shape, expected) => {
    await show(<Avatar testID="avatar" shape={shape} />);

    expect(rootStyle().borderRadius).toBe(expected);
  });
});

describe('style', () => {
  it('소비자 style 이 계산된 값을 이긴다', async () => {
    await show(<Avatar testID="avatar" style={{ width: 100 }} />);

    const style = root().props.style as [ViewStyle, ViewStyle];

    expect(style[0].width).toBe(T.spacing['2xl']);
    expect(style[1]).toEqual({ width: 100 });
  });
});

describe('공개 배럴', () => {
  it('Avatar 만 내보낸다', async () => {
    expect(Object.keys(barrel)).toEqual(['Avatar']);
  });
});
