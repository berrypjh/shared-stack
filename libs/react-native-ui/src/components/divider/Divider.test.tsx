/**
 * RN Divider 계약.
 *
 * `DividerSemanticProps` 는 **ui-core 소유**입니다 — 두 렌더러가 같은 축 어휘를 각자의 스타일
 * 시스템으로 옮깁니다. 여기서 검증하는 것은 그 공유 불변식의 RN 쪽 구현입니다:
 *
 * - `orientation` 미지정 = `horizontal` (web 과 같은 기본값)
 * - 두께 = `borderWidth.semantic.divider`, 색 = `color.stroke.light` (web 과 같은 토큰)
 * - 소비자 `style` 이 계산된 값을 이긴다
 *
 * **web 과 갈리는 지점**: `decorative` 가 없습니다. RN 에는 끌 native separator 시맨틱이
 * 아예 없어서 — `accessibilityRole` 유니온에 `separator` 가 없습니다 — 켜고 끌 대상이
 * 없습니다. 그래서 RN Divider 는 항상 시각 전용이고, 그 사실을 아래 접근성 검사가 고정합니다.
 */
import { createRef, type ReactElement } from 'react';
import { Text, View as RNView } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { View, ViewStyle } from 'react-native';

import { ThemeProvider } from '../../theme';

import { Divider } from './Divider';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getDivider = () => screen.getByTestId('divider');

/**
 * Divider 가 **계산한** style 만 꺼냅니다. `toHaveStyle` 은 배열을 합쳐 버려서
 * "이 축은 아예 건드리지 않았다"를 구분하지 못합니다 (Stack 과 같은 헬퍼).
 */
const computed = (): ViewStyle => {
  const style = getDivider().props.style as [ViewStyle, unknown];
  return style[0];
};

describe('루트', () => {
  it('View 를 렌더한다', async () => {
    await renderWithTheme(<Divider testID="divider" />);

    expect(getDivider()).toBeOnTheScreen();
    expect(getDivider().type).toBe('View');
  });

  it('ViewProps 를 그대로 전달한다', async () => {
    await renderWithTheme(<Divider testID="divider" nativeID="rule" pointerEvents="none" />);

    expect(getDivider().props.nativeID).toBe('rule');
    expect(getDivider().props.pointerEvents).toBe('none');
  });

  it('ref 가 호스트 View 를 가리킨다', async () => {
    const ref = createRef<View>();

    await renderWithTheme(<Divider testID="divider" ref={ref} />);

    expect(ref.current).not.toBeNull();
  });
});

describe('orientation', () => {
  /** 미지정은 `horizontal` — web 렌더러와 같은 기본값입니다. */
  it('미지정은 가로선이다', async () => {
    await renderWithTheme(<Divider testID="divider" />);

    expect(computed().borderTopWidth).toBe(T.borderWidth.semantic.divider);
    expect(computed().borderLeftWidth).toBeUndefined();
  });

  it('horizontal 은 위쪽 경계만 그린다', async () => {
    await renderWithTheme(<Divider testID="divider" orientation="horizontal" />);

    expect(computed().borderTopWidth).toBe(T.borderWidth.semantic.divider);
    expect(computed().borderLeftWidth).toBeUndefined();
  });

  /** 세로선은 형제 높이만큼 늘어납니다 — 높이를 추측하지 않습니다. */
  it('vertical 은 왼쪽 경계만 그리고 교차축으로 늘어난다', async () => {
    await renderWithTheme(<Divider testID="divider" orientation="vertical" />);

    expect(computed().borderLeftWidth).toBe(T.borderWidth.semantic.divider);
    expect(computed().borderTopWidth).toBeUndefined();
    expect(computed().alignSelf).toBe('stretch');
  });
});

describe('토큰', () => {
  /**
   * RN 은 `borderWidth` 만 주면 테두리가 **검정**이 됩니다 (RN 기본값). 색을 반드시 함께
   * 줘야 어두운 테마에서 선이 튀지 않습니다.
   */
  it('색을 토큰에서 가져온다 — 하드코딩하지 않는다', async () => {
    await renderWithTheme(<Divider testID="divider" />);

    expect(computed().borderTopColor).toBe(T.color.stroke.light);
  });

  it('vertical 도 같은 색 토큰을 쓴다', async () => {
    await renderWithTheme(<Divider testID="divider" orientation="vertical" />);

    expect(computed().borderLeftColor).toBe(T.color.stroke.light);
  });

  /** 테마를 바꾸면 선 색이 따라갑니다 — 값을 굳혀 두지 않았다는 증거입니다. */
  it('테마가 바뀌면 색이 따라간다', async () => {
    await render(
      <ThemeProvider mode="dark">
        <Divider testID="divider" />
      </ThemeProvider>,
    );

    expect(computed().borderTopColor).toBe(Native.Dark.tokens.color.stroke.light);
    expect(computed().borderTopColor).not.toBe(T.color.stroke.light);
  });
});

describe('style 합성', () => {
  it('소비자 style 이 계산된 값보다 뒤에 온다', async () => {
    await renderWithTheme(<Divider testID="divider" style={{ marginVertical: 12 }} />);

    const style = getDivider().props.style as [ViewStyle, ViewStyle];

    expect(style[1]).toEqual({ marginVertical: 12 });
  });
});

describe('접근성', () => {
  /**
   * **web 과 갈리는 지점입니다.**
   *
   * RN 0.81 의 `accessibilityRole` 유니온에는 `separator` 가 없습니다. 없는 역할을
   * `as any` 로 만들어 내지 않고, 이 저장소가 쓰지 않는 bare `role` prop 으로 우회하지도
   * 않습니다 — `Badge` 가 web 의 `role="status"` 대응물을 만들지 않은 것과 같은 판단입니다.
   *
   * 내용이 없는 View 는 스크린리더가 읽을 것이 없어 그대로 지나갑니다. 그래서 별도로
   * 숨기는 prop 도 붙이지 않습니다.
   */
  it('지원하지 않는 role 을 지어내지 않는다', async () => {
    await renderWithTheme(<Divider testID="divider" />);

    expect(getDivider().props.accessibilityRole).toBeUndefined();
    expect(getDivider().props.role).toBeUndefined();
  });

  it('접근성 트리를 강제로 조작하지 않는다', async () => {
    await renderWithTheme(<Divider testID="divider" />);

    expect(getDivider().props.accessible).toBeUndefined();
    expect(getDivider().props.accessibilityElementsHidden).toBeUndefined();
    expect(getDivider().props.importantForAccessibility).toBeUndefined();
  });

  /**
   * 소비자가 필요하면 직접 줄 수 있습니다 — 막지는 않습니다.
   *
   * `includeHiddenElements` 를 켜는 이유가 곧 증거입니다: 기본 쿼리는 접근성 트리에서 숨은
   * 요소를 건너뛰는데, 이 요소가 건너뛰어졌다는 것은 prop 이 실제로 먹었다는 뜻입니다.
   */
  it('소비자가 준 접근성 prop 은 통과시킨다', async () => {
    await renderWithTheme(<Divider testID="divider" accessibilityElementsHidden />);

    const hidden = screen.getByTestId('divider', { includeHiddenElements: true });

    expect(hidden.props.accessibilityElementsHidden).toBe(true);
    expect(screen.queryByTestId('divider')).toBeNull();
  });
});

describe('비상호작용', () => {
  it('누를 수 없다 — Pressable 이 아니다', async () => {
    await renderWithTheme(
      <RNView>
        <Divider testID="divider" />
        <Text>sibling</Text>
      </RNView>,
    );

    expect(getDivider().props.onStartShouldSetResponder).toBeUndefined();
  });
});
