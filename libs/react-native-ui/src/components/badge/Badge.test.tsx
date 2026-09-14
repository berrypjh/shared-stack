/**
 * RN Badge 계약.
 *
 * Badge 는 **overlay indicator** 다 — 앵커(`children`)를 감싸고 그 위에 알림/개수/점을 얹는다.
 * standalone status pill 이 아니다 (그 역할은 Chip 이 가진다).
 *
 * RN 에서 가장 조용하게 깨지는 두 자리를 두껍게 검사한다:
 *
 * 1. **래퍼가 앵커의 접근성을 삼키지 않는다.** 루트 `View` 에 `accessible` 을 걸면 RN 이
 *    자식 트리를 하나로 합쳐 `Pressable` 의 역할·이름·누름이 사라진다.
 * 2. **표시자가 터치를 가로채지 않는다.** 절대 배치된 View 는 `pointerEvents="none"` 이 없으면
 *    앵커 모서리의 탭을 먹는다.
 *
 * web `aria-*` 를 복사하지 않는다 — RN 은 이름 없는 것이 기본이고 `aria-hidden` 대신
 * `accessibilityElementsHidden`/`importantForAccessibility` 를 쓴다.
 */
import { type ReactElement } from 'react';
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { TextStyle, ViewStyle } from 'react-native';

import { ThemeProvider } from '../../theme';
import { IconButton } from '../icon-button';

import { Badge } from './Badge';
import * as barrel from './index';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const root = () => screen.getByTestId('badge');

/**
 * 표시자.
 *
 * `includeHiddenElements` 가 필요하다 — label 없는 dot 은 `accessibilityElementsHidden` 로
 * 접근성 트리에서 빠지고, 기본 쿼리는 그것을 "없는 것"으로 본다. 여기서 보려는 것은 접근성
 * 노출이 아니라 **렌더 여부와 그 props** 다.
 */
const indicator = () => screen.getByTestId('badge-indicator', { includeHiddenElements: true });
const queryIndicator = () =>
  screen.queryByTestId('badge-indicator', { includeHiddenElements: true });

/** Badge 가 계산한 표시자 style. 소비자 style 과 구분하려고 배열 첫 칸만 본다. */
const indicatorStyle = (): ViewStyle => {
  const style = indicator().props.style as ViewStyle | ViewStyle[];
  return Array.isArray(style) ? Object.assign({}, ...style) : style;
};

describe('루트', () => {
  it('View 래퍼로 앵커를 감싼다', async () => {
    await show(
      <Badge testID="badge" count={1}>
        <IconButton accessibilityLabel="알림" icon="🔔" />
      </Badge>,
    );

    expect(root()).toBeOnTheScreen();
    expect(indicator()).toBeOnTheScreen();
  });

  it('ViewProps 를 루트로 전달한다', async () => {
    await show(
      <Badge testID="badge" count={1} pointerEvents="box-none">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(root().props.pointerEvents).toBe('box-none');
  });

  it('Pressable 이 아니다 — 자체 누름을 만들지 않는다', async () => {
    await show(<Badge testID="badge" count={1} />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('앵커 보존 (회귀 방지)', () => {
  it('래퍼가 앵커의 역할과 이름을 삼키지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3}>
        <IconButton accessibilityLabel="알림" icon="🔔" />
      </Badge>,
    );

    // 루트에 accessible 을 걸면 이 조회가 실패한다 — RN 이 자식 트리를 하나로 합친다.
    expect(screen.getByRole('button', { name: '알림' })).toBeOnTheScreen();
  });

  it('루트를 하나의 접근성 요소로 합치지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3} label="읽지 않은 알림 3개">
        <IconButton accessibilityLabel="알림" icon="🔔" />
      </Badge>,
    );

    expect(root().props.accessible).not.toBe(true);
    expect(root().props.accessibilityLabel).toBeUndefined();
  });

  it('앵커가 계속 누름을 받는다', async () => {
    const onPress = jest.fn();

    await show(
      <Badge testID="badge" count={3}>
        <IconButton accessibilityLabel="알림" icon="🔔" onPress={onPress} />
      </Badge>,
    );
    await fireEvent.press(screen.getByRole('button', { name: '알림' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('표시자가 터치를 가로채지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(indicator().props.pointerEvents).toBe('none');
  });

  it('label 이 앵커의 이름을 덮지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3} label="읽지 않은 알림 3개">
        <IconButton accessibilityLabel="알림" icon="🔔" />
      </Badge>,
    );

    // 두 이름이 각자 남는다.
    expect(screen.getByRole('button', { name: '알림' })).toBeOnTheScreen();
    expect(screen.getByLabelText('읽지 않은 알림 3개')).toBe(indicator());
  });
});

describe('count', () => {
  it('숫자를 표시자에 렌더한다', async () => {
    await show(
      <Badge testID="badge" count={3}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('count=0 을 렌더한다 — 0 을 미지정으로 취급하지 않는다', async () => {
    await show(
      <Badge testID="badge" count={0}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('0')).toBeOnTheScreen();
  });

  it('content 가 count 를 이긴다', async () => {
    await show(
      <Badge testID="badge" count={3} content="NEW">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('NEW')).toBeOnTheScreen();
    expect(screen.queryByText('3')).toBeNull();
  });

  it('count·content 둘 다 없으면 표시자를 내지 않는다', async () => {
    await show(
      <Badge testID="badge">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(queryIndicator()).toBeNull();
  });

  it('숫자를 토큰 타이포로 감싼다', async () => {
    await show(
      <Badge testID="badge" count={3}>
        <Text>anchor</Text>
      </Badge>,
    );

    const style = screen.getByText('3').props.style as TextStyle;

    expect(style.color).toBe(T.color.text.contrastText);
    expect(style.fontSize).toBe(T.typography.body.small.fontSize);
  });
});

describe('max', () => {
  it('기본 max 는 99 다', async () => {
    await show(
      <Badge testID="badge" count={100}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('99+')).toBeOnTheScreen();
  });

  it('count 가 max 이하면 그대로 보여 준다', async () => {
    await show(
      <Badge testID="badge" count={9} max={9}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('9')).toBeOnTheScreen();
  });

  it('count 가 max 를 넘으면 {max}+ 로 줄인다', async () => {
    await show(
      <Badge testID="badge" count={10} max={9}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('9+')).toBeOnTheScreen();
  });

  it('max 는 content 에 적용되지 않는다', async () => {
    await show(
      <Badge testID="badge" content="1000" max={9}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByText('1000')).toBeOnTheScreen();
  });
});

describe('dot', () => {
  it('dot 은 내용을 렌더하지 않는다', async () => {
    await show(
      <Badge testID="badge" variant="dot" count={3}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(indicator()).toBeOnTheScreen();
    expect(screen.queryByText('3')).toBeNull();
  });

  it('dot 은 count 없이도 나타난다', async () => {
    await show(
      <Badge testID="badge" variant="dot">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(indicator()).toBeOnTheScreen();
  });

  it('dot 은 지름만 갖는 정사각이다', async () => {
    await show(<Badge testID="badge" variant="dot" size="md" />);

    const style = indicatorStyle();

    expect(style.width).toBe(T.spacing.md);
    expect(style.height).toBe(T.spacing.md);
    expect(style.paddingHorizontal).toBe(0);
  });
});

describe('invisible', () => {
  it('표시자를 렌더하지 않는다 — 감추는 것이 아니라 내지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3} invisible>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(queryIndicator()).toBeNull();
    expect(screen.getByText('anchor')).toBeOnTheScreen();
  });

  it('invisible 이어도 앵커는 그대로다', async () => {
    await show(
      <Badge testID="badge" count={3} invisible>
        <IconButton accessibilityLabel="알림" icon="🔔" />
      </Badge>,
    );

    expect(screen.getByRole('button', { name: '알림' })).toBeOnTheScreen();
  });
});

describe('placement', () => {
  it('기본값은 top-end 다', async () => {
    await show(<Badge testID="badge" count={1} size="md" />);

    const style = indicatorStyle();
    const half = -T.spacing.xl / 2;

    expect(style.top).toBe(half);
    expect(style.end).toBe(half);
  });

  it.each(['top-end', 'top-start', 'bottom-end', 'bottom-start'] as const)(
    'placement=%s 는 논리 방향으로 배치한다',
    async (placement) => {
      await show(<Badge testID="badge" count={1} placement={placement} />);

      const style = indicatorStyle() as Record<string, unknown>;
      const [block, inline] = placement.split('-');

      // 물리 left/right 가 아니라 start/end 를 쓴다 — RTL 에서 자동으로 뒤집힌다.
      expect(style[block]).toBeDefined();
      expect(style[inline]).toBeDefined();
      expect(style.left).toBeUndefined();
      expect(style.right).toBeUndefined();
    },
  );
});

describe('size', () => {
  it('기본값은 md 다', async () => {
    await show(<Badge testID="badge" count={1} />);

    expect(indicatorStyle().minWidth).toBe(T.spacing.xl);
  });

  it.each([
    ['sm', T.spacing.lg],
    ['md', T.spacing.xl],
  ] as const)('size=%s 는 %s 를 최소 너비로 쓴다', async (size, expected) => {
    await show(<Badge testID="badge" count={1} size={size} />);

    expect(indicatorStyle().minWidth).toBe(expected);
    expect(indicatorStyle().height).toBe(expected);
  });
});

describe('intent', () => {
  it('기본값은 error 다', async () => {
    await show(<Badge testID="badge" count={1} />);

    expect(indicatorStyle().backgroundColor).toBe(T.color.background.error);
  });

  it.each([
    ['primary', T.color.background.primary],
    ['secondary', T.color.background.secondary],
    ['error', T.color.background.error],
    ['neutral', T.color.background.grey],
  ] as const)('intent=%s 는 %s 면을 쓴다', async (intent, expected) => {
    await show(<Badge testID="badge" count={1} intent={intent} />);

    expect(indicatorStyle().backgroundColor).toBe(expected);
  });

  it('neutral 만 전경이 다르다 — grey 위에서는 contrastText 가 대비를 잃는다', async () => {
    await show(
      <Badge testID="badge" count={1} intent="neutral">
        <Text>anchor</Text>
      </Badge>,
    );

    const style = screen.getByText('1').props.style as TextStyle;

    expect(style.color).toBe(T.color.text.default);
  });
});

describe('접근성', () => {
  it('label 을 주면 표시자가 이름을 갖는다', async () => {
    await show(
      <Badge testID="badge" count={137} label="읽지 않은 알림 137개">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByLabelText('읽지 않은 알림 137개')).toBe(indicator());
    expect(indicator().props.accessible).toBe(true);
  });

  /**
   * 시각 축약(`99+`)과 낭독 내용이 갈리는 자리다. label 이 있으면 표시자가 하나의 접근성
   * 요소로 합쳐지므로 숫자 `Text` 가 따로 읽히지 않는다 — web 의 `aria-hidden` 과 같은 효과를
   * RN 방식으로 얻는다.
   */
  it('label 이 있으면 축약된 숫자가 따로 읽히지 않는다', async () => {
    await show(
      <Badge testID="badge" count={137} label="읽지 않은 알림 137개">
        <Text>anchor</Text>
      </Badge>,
    );

    // 화면에는 축약이 남는다.
    expect(screen.getByText('99+')).toBeOnTheScreen();
    // 표시자가 합쳐진 요소라 그 안의 Text 는 별도 이름이 되지 않는다.
    expect(indicator().props.accessible).toBe(true);
  });

  it('label 이 없으면 역할·이름을 지어내지 않는다', async () => {
    await show(
      <Badge testID="badge" count={3}>
        <Text>anchor</Text>
      </Badge>,
    );

    expect(indicator().props.accessible).not.toBe(true);
    expect(indicator().props.accessibilityLabel).toBeUndefined();
  });

  /** 이름 없는 dot 은 순수 장식이다. 읽을 것이 없으므로 트리에서 빼낸다. */
  it('label 없는 dot 은 접근성 트리에서 감춘다', async () => {
    await show(
      <Badge testID="badge" variant="dot">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(indicator().props.accessibilityElementsHidden).toBe(true);
    expect(indicator().props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('label 을 준 dot 은 이름을 갖는다 — 색이 유일한 통로가 아니다', async () => {
    await show(
      <Badge testID="badge" variant="dot" label="읽지 않은 알림 있음">
        <Text>anchor</Text>
      </Badge>,
    );

    expect(screen.getByLabelText('읽지 않은 알림 있음')).toBe(indicator());
    expect(indicator().props.accessibilityElementsHidden).toBeFalsy();
  });

  it('선택·비활성 상태를 알리지 않는다', async () => {
    await show(
      <Badge testID="badge" count={1} label="알림 1개">
        <Text>anchor</Text>
      </Badge>,
    );

    const state = indicator().props.accessibilityState;

    expect(state?.selected).toBeUndefined();
    expect(state?.disabled).toBeUndefined();
  });
});

describe('style', () => {
  it('소비자 style 이 루트에 적용된다', async () => {
    await show(<Badge testID="badge" count={1} style={{ marginTop: 8 }} />);

    const style = root().props.style as [ViewStyle, ViewStyle];

    expect(style[1]).toEqual({ marginTop: 8 });
  });
});

describe('공개 배럴', () => {
  it('Badge 만 내보낸다', async () => {
    expect(Object.keys(barrel)).toEqual(['Badge']);
  });
});
