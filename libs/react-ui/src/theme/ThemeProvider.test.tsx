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
});
