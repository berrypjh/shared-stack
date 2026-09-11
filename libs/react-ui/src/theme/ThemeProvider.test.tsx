import { themes } from '@berrypjh/ui-core';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../test';

import { ThemeProvider } from './ThemeProvider';
import { themeProviderClasses } from './ThemeProvider.constants';

describe('<ThemeProvider />', () => {
  const { render } = createRenderer();

  describeConformance(<ThemeProvider>hello</ThemeProvider>, () => ({
    render,
    classes: themeProviderClasses,
    refInstanceof: HTMLDivElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('root', () => {
    it('children을 렌더링해야 한다', () => {
      render(
        <ThemeProvider>
          <button type="button">hello</button>
        </ThemeProvider>,
      );

      expect(screen.getByRole('button', { name: 'hello' })).toBeInTheDocument();
    });

    it('기본 mode는 light 이어야 한다', () => {
      render(<ThemeProvider>content</ThemeProvider>);

      const root = screen.getByText('content');

      expect(root).toHaveClass(themeProviderClasses.root);
      expect(root).toHaveAttribute('data-theme', 'light');
    });

    it('전달한 mode를 data-theme에 적용해야 한다', () => {
      render(<ThemeProvider mode="dark">content</ThemeProvider>);

      const root = screen.getByText('content');

      expect(root).toHaveAttribute('data-theme', 'dark');
    });

    it('className을 root class와 함께 병합해야 한다', () => {
      render(<ThemeProvider className="custom-theme-provider">content</ThemeProvider>);

      const root = screen.getByText('content');

      expect(root).toHaveClass(themeProviderClasses.root);
      expect(root).toHaveClass('custom-theme-provider');
    });

    it('style을 root element에 적용해야 한다', () => {
      render(
        <ThemeProvider style={{ padding: '12px', backgroundColor: 'rgb(0, 0, 0)' }}>
          content
        </ThemeProvider>,
      );

      const root = screen.getByText('content');

      expect(root).toHaveStyle({
        padding: '12px',
        backgroundColor: 'rgb(0, 0, 0)',
      });
    });

    it('추가 div props를 root element에 전달해야 한다', () => {
      render(
        <ThemeProvider aria-label="theme root" id="theme-provider-root">
          content
        </ThemeProvider>,
      );

      const root = screen.getByLabelText('theme root');

      expect(root).toHaveAttribute('id', 'theme-provider-root');
      expect(root).toHaveClass(themeProviderClasses.root);
    });
  });

  /**
   * web은 Context가 아니라 `data-theme` DOM 스코프로 테마를 내려보낸다. 그래서 중첩의 계약은
   * "안쪽이 자기 scope를 새로 연다"는 **구조**다 — 실제 값 선택은 CSS 캐스케이드가 하고,
   * 그것은 브라우저 몫이라 jsdom에서 검증하지 않는다. RN은 같은 시맨틱을 Context로 구현한다.
   */
  describe('중첩', () => {
    it('중첩하면 안쪽이 자기 data-theme scope를 연다', () => {
      render(
        <ThemeProvider mode="light" data-testid="outer">
          <ThemeProvider mode="dark" data-testid="inner">
            content
          </ThemeProvider>
        </ThemeProvider>,
      );

      const outer = screen.getByTestId('outer');
      const inner = screen.getByTestId('inner');

      expect(outer).toHaveAttribute('data-theme', 'light');
      expect(inner).toHaveAttribute('data-theme', 'dark');
      expect(inner).toHaveClass(themeProviderClasses.root);
      // 안쪽은 바깥을 대체하지 않고 그 안에 중첩된다 — 캐스케이드가 성립하는 조건이다.
      expect(outer).toContainElement(inner);
    });
  });

  /**
   * 레지스트리 `selector` ↔ Provider 가 내보내는 `data-theme` 의 대응.
   *
   * 테마는 두 곳에서 만난다. design-tokens 는 `themes[].selector` 아래에 CSS 변수를 생성하고,
   * ThemeProvider 는 `data-theme={mode}` 를 단다. **둘을 잇는 것은 이름 규약뿐이다** —
   * selector 가 바뀌거나 Provider 가 다른 속성을 달면 CSS 가 더 이상 매칭되지 않는데
   * 타입도 DOM 도 기존 테스트도 아무 말을 하지 않는다. 테마가 조용히 적용되지 않을 뿐이고,
   * 그 증상은 Storybook 토글이 이름만 바뀌고 화면은 그대로인 모습으로 나타난다.
   *
   * 그래서 "Provider 가 만든 루트가 그 테마의 selector 에 실제로 매칭되는가" 를 본다.
   * 목록은 레지스트리에서 읽는다 — 하드코딩하면 테마가 늘어도 조용히 통과한다.
   */
  describe('레지스트리 selector 대응', () => {
    /** `light` 는 base 라 `:root` 에 실린다 — 요소 selector 가 아니라 따로 본다. */
    const scoped = themes.filter((theme) => theme.selector !== ':root');

    it('검사할 테마를 찾는다', () => {
      // 수집이 조용히 비면 아래 each 가 0건으로 통과한다.
      expect(themes.length).toBeGreaterThan(0);
      expect(scoped.length).toBeGreaterThan(0);
    });

    it.each(scoped.map((theme) => [theme.name, theme.selector]))(
      '%s 루트가 생성 CSS 의 selector 에 매칭된다',
      (name, selector) => {
        render(
          <ThemeProvider mode={name} data-testid="root">
            content
          </ThemeProvider>,
        );

        expect(screen.getByTestId('root').matches(selector)).toBe(true);
      },
    );

    it('light 는 base selector(:root) 를 쓰지만 Provider 는 그래도 data-theme 을 단다', () => {
      render(
        <ThemeProvider mode="light" data-testid="root">
          content
        </ThemeProvider>,
      );

      expect(themes.find((theme) => theme.name === 'light')?.selector).toBe(':root');
      expect(screen.getByTestId('root')).toHaveAttribute('data-theme', 'light');
    });
  });
});
