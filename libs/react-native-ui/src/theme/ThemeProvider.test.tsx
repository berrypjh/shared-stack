/**
 * RN ThemeProvider 런타임 계약.
 *
 * web 은 `<div data-theme>` 래퍼 + CSS 캐스케이드로 테마를 내려보내지만 RN 에는 캐스케이드가
 * 없어 **React Context 가 유일한 전달 수단**입니다. 같은 시맨틱(모드는 소비자 소유, 기본
 * `light`)을 다른 메커니즘으로 구현합니다 — `data-theme` 을 옮기지 않습니다.
 *
 * 테마 목록은 **레지스트리에서 읽어 순회**합니다. 하드코딩한 배열을 쓰면 design-tokens 에
 * 테마가 늘어도 테스트가 조용히 통과합니다.
 */
import { Text } from 'react-native';

import type { RNTokens, ThemeName } from '@berrypjh/ui-core';
import { Native, themes } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';

// **배럴에서** 가져옵니다 — 공개 표면을 검사하는 것이지 소스 모듈을 검사하는 것이 아닙니다.
import type { ThemeProviderProps } from './index';
import { ThemeProvider, useTheme } from './index';

/** `Native` 의 namespace 키는 capitalize 입니다 (`light` → `Light`). */
const namespaceFor = (name: ThemeName): { tokens: RNTokens } => {
  const key = `${name[0].toUpperCase()}${name.slice(1)}`;
  const ns = (Native as unknown as Record<string, { tokens: RNTokens } | undefined>)[key];

  if (!ns) throw new Error(`Native namespace가 없다: ${key}`);
  return ns;
};

/** 모드와 대표 시맨틱 토큰들을 화면으로 흘려 assert 가능하게 만듭니다. */
const Probe = ({ testID = 'probe' }: { testID?: string }) => {
  const theme = useTheme();
  const t = theme.tokens;

  return (
    <Text testID={testID}>
      {[
        theme.mode,
        t.color.background.default,
        t.color.text.default,
        t.spacing.md,
        t.radius.md,
      ].join('|')}
    </Text>
  );
};

const expectedFor = (name: ThemeName) => {
  const t = namespaceFor(name).tokens;
  return [name, t.color.background.default, t.color.text.default, t.spacing.md, t.radius.md].join(
    '|',
  );
};

describe('기본 동작', () => {
  it('children 을 렌더한다', async () => {
    await render(
      <ThemeProvider>
        <Text>child</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('child')).toBeOnTheScreen();
  });

  it('mode 를 주지 않으면 light 다', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('light'));
  });

  it('기본 토큰이 Native.Light 그 객체다 — 복사본이 아니다', async () => {
    let seen: RNTokens | undefined;
    const Capture = () => {
      seen = useTheme().tokens;
      return null;
    };

    await render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(seen).toBe(Native.Light.tokens);
  });

  it('호스트 요소를 만들지 않는다 — Context 만 제공한다', async () => {
    const view = await render(
      <ThemeProvider>
        <Text testID="only">x</Text>
      </ThemeProvider>,
    );

    // Provider 가 View 를 끼우면 루트 자식이 그 View 가 됩니다.
    expect(view.toJSON()).toMatchObject({ type: 'Text' });
    expect(screen.getByTestId('only')).toBeOnTheScreen();
  });
});

describe('등록된 모든 테마', () => {
  it('레지스트리가 비어 있지 않다', () => {
    // 비면 아래 each 블록이 0건으로 조용히 통과합니다.
    expect(themes.length).toBeGreaterThan(0);
  });

  it.each(themes.map((t) => t.name))('%s 를 받아 mode 와 토큰을 내려보낸다', async (name) => {
    await render(
      <ThemeProvider mode={name}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor(name));
  });

  it.each(themes.map((t) => t.name))(
    '%s 의 토큰 트리가 해당 Native namespace 그 자체다',
    async (name) => {
      let seen: RNTokens | undefined;
      const Capture = () => {
        seen = useTheme().tokens;
        return null;
      };

      await render(
        <ThemeProvider mode={name}>
          <Capture />
        </ThemeProvider>,
      );

      expect(seen).toBe(namespaceFor(name).tokens);
    },
  );

  it('레지스트리 이름마다 Native namespace 가 존재한다', () => {
    // 매핑 누락은 컴파일(`satisfies`)이 먼저 잡지만, 생성물 쪽 결손은 여기서 잡습니다.
    for (const { name } of themes) {
      expect(() => namespaceFor(name)).not.toThrow();
    }
  });
});

describe('rerender', () => {
  it('mode 가 바뀌면 새 모드와 새 토큰을 본다 — stale memo 가 없다', async () => {
    const view = await render(
      <ThemeProvider mode="light">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('light'));

    await view.rerender(
      <ThemeProvider mode="dark">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('dark'));

    await view.rerender(
      <ThemeProvider mode="midnight">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('midnight'));
  });

  it('같은 mode 로 다시 렌더해도 값이 유지된다', async () => {
    const view = await render(
      <ThemeProvider mode="sepia">
        <Probe />
      </ThemeProvider>,
    );

    await view.rerender(
      <ThemeProvider mode="sepia">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('sepia'));
  });
});

describe('Provider 가드', () => {
  it('Provider 밖에서 useTheme 을 쓰면 던진다 — 조용한 fallback 이 없다', async () => {
    await expect(render(<Probe />)).rejects.toThrow(
      'useTheme must be used within <ThemeProvider>.',
    );
  });

  it('던지는 것이지 기본 테마를 지어내는 것이 아니다', async () => {
    // fallback 이 생기면 이 렌더가 성공해 버립니다.
    await expect(render(<Probe />)).rejects.toThrow(/ThemeProvider/);
  });
});

describe('중첩 Provider', () => {
  it('각 소비자는 가장 가까운 테마를 본다', async () => {
    await render(
      <ThemeProvider mode="light">
        <Probe testID="outer" />
        <ThemeProvider mode="dark">
          <Probe testID="inner" />
        </ThemeProvider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('outer')).toHaveTextContent(expectedFor('light'));
    expect(screen.getByTestId('inner')).toHaveTextContent(expectedFor('dark'));
  });

  it('안쪽 범위를 벗어나면 바깥 값이 그대로다 — 누수가 없다', async () => {
    await render(
      <ThemeProvider mode="frost">
        <ThemeProvider mode="ember">
          <Probe testID="inner" />
        </ThemeProvider>
        <Probe testID="after" />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('inner')).toHaveTextContent(expectedFor('ember'));
    expect(screen.getByTestId('after')).toHaveTextContent(expectedFor('frost'));
  });
});

describe('tokensByMode', () => {
  /** 완전한 맵이어야 합니다 — Partial 로 좁히면 타입이 거부합니다. */
  const customMap = {
    light: { ...Native.Light.tokens, spacing: { ...Native.Light.tokens.spacing, md: 999 } },
    dark: Native.Dark.tokens,
    sepia: Native.Sepia.tokens,
    amber: Native.Amber.tokens,
    ember: Native.Ember.tokens,
    frost: Native.Frost.tokens,
    midnight: Native.Midnight.tokens,
  } satisfies Record<ThemeName, RNTokens>;

  /** `toHaveTextContent` 는 문자열을 정규식으로 읽습니다 — `|` 를 넣지 말고 전체를 비교합니다. */
  const expectedForCustom = (name: ThemeName) => {
    const t = customMap[name];
    return [name, t.color.background.default, t.color.text.default, t.spacing.md, t.radius.md].join(
      '|',
    );
  };

  it('소비자가 준 맵에서 토큰을 고른다', async () => {
    await render(
      <ThemeProvider tokensByMode={customMap}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe').props.children).toBe(expectedForCustom('light'));
  });

  it('맵을 바꾸면 새 토큰을 본다', async () => {
    const view = await render(
      <ThemeProvider tokensByMode={customMap}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe').props.children).toBe(expectedForCustom('light'));

    await view.rerender(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('light'));
  });

  it('같은 맵 안에서 mode 를 바꿔도 따라간다', async () => {
    const view = await render(
      <ThemeProvider mode="light" tokensByMode={customMap}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe').props.children).toBe(expectedForCustom('light'));

    await view.rerender(
      <ThemeProvider mode="dark" tokensByMode={customMap}>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('probe')).toHaveTextContent(expectedFor('dark'));
  });
});

/**
 * 타입 수준 계약. jest 는 타입을 지우므로 이 블록은 `tsc -b` 가 검증합니다.
 *
 * `tokensByMode` 는 **완전한** 맵이어야 합니다. `Partial` 이나 `Record<string, …>` 로 넓히면
 * 빠진 테마가 런타임에 `undefined` 토큰으로 흘러 화면에서 터집니다.
 */
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type ThemeProviderSurface = [
  Expect<Equal<ThemeProviderProps['mode'], ThemeName | undefined>>,
  Expect<Equal<ThemeProviderProps['tokensByMode'], Record<ThemeName, RNTokens> | undefined>>,

  // `Partial` 은 거부됩니다 — 빠진 테마가 컴파일에서 걸립니다.
  Expect<
    Equal<
      Partial<Record<ThemeName, RNTokens>> extends NonNullable<ThemeProviderProps['tokensByMode']>
        ? true
        : false,
      false
    >
  >,

  // **한계**: 소비자가 자기 변수를 `Record<string, RNTokens>` 로 넓혀 두면 구조적으로
  // 대입 가능해서 타입이 막지 못합니다. 그때는 등록된 테마를 순회하는 런타임 테스트가
  // 유일한 방어선입니다.
  Expect<
    Equal<
      Record<string, RNTokens> extends NonNullable<ThemeProviderProps['tokensByMode']>
        ? true
        : false,
      true
    >
  >,
];

/** `ThemeProviderProps` 는 배럴로 공개됩니다 — 다른 컴포넌트 배럴과 같은 관례입니다. */
export const propsTypeIsPublic = (props: ThemeProviderProps) => props.mode;
