import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { screen } from '@testing-library/react';
import { compile } from 'sass';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { SkipLink } from './SkipLink';
import { skipLinkClasses } from './SkipLink.constants';

describe('<SkipLink />', () => {
  const { render } = createRenderer();

  describeConformance(<SkipLink targetId="main">본문으로 건너뛰기</SkipLink>, () => ({
    render,
    classes: skipLinkClasses,
    refInstanceof: HTMLAnchorElement,
    skip: ['polymorphicProp'],
  }));

  describe('root', () => {
    it('a 요소로 children을 렌더링해야 한다', () => {
      render(<SkipLink targetId="main">본문으로 건너뛰기</SkipLink>);

      const link = screen.getByRole('link', { name: '본문으로 건너뛰기' });

      expect(link.tagName.toLowerCase()).toBe('a');
      expect(link).toHaveClass(skipLinkClasses.root);
    });

    it('targetId로 href를 구성해야 한다', () => {
      render(<SkipLink targetId="main-content">Skip</SkipLink>);

      expect(screen.getByRole('link', { name: 'Skip' })).toHaveAttribute('href', '#main-content');
    });

    it('추가 props가 root에 전달되어야 한다', () => {
      render(
        <SkipLink targetId="main" data-testid="skip" aria-label="본문 이동">
          Skip
        </SkipLink>,
      );

      const link = screen.getByTestId('skip');

      expect(link).toHaveAttribute('aria-label', '본문 이동');
    });
  });

  /**
   * `href` 는 `targetId` 를 **그대로** 이어 붙인다. 인코딩도 검증도 없다 — 그 사실이
   * 계약이라 못박는다. 03 에서 인코딩을 넣는다면 이 검사가 먼저 깨져서 드러난다.
   */
  describe('href 계약', () => {
    it('targetId 를 인코딩하지 않고 그대로 이어 붙인다', () => {
      render(
        <SkipLink targetId="a b" data-testid="spaced">
          Skip
        </SkipLink>,
      );

      expect(screen.getByTestId('spaced')).toHaveAttribute('href', '#a b');
    });

    it('빈 targetId 면 fragment 만 남는다', () => {
      render(
        <SkipLink targetId="" data-testid="empty">
          Skip
        </SkipLink>,
      );

      expect(screen.getByTestId('empty')).toHaveAttribute('href', '#');
    });

    it('컨슈머가 href 를 넣어도 targetId 가 이긴다', () => {
      render(
        <SkipLink targetId="main" {...({ href: '/elsewhere' } as object)} data-testid="forced">
          Skip
        </SkipLink>,
      );

      // 타입은 `href` 를 Omit 하지만 런타임 우선순위도 같은 방향이어야 한다.
      expect(screen.getByTestId('forced')).toHaveAttribute('href', '#main');
    });

    it('인스턴스끼리 간섭하지 않는다', () => {
      render(
        <>
          <SkipLink targetId="m1">본문</SkipLink>
          <SkipLink targetId="m2">내비게이션</SkipLink>
        </>,
      );

      expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
        '#m1',
        '#m2',
      ]);
    });

    it('네이티브 anchor 라 기본으로 탭 순서에 있다', () => {
      render(
        <SkipLink targetId="main" data-testid="link">
          Skip
        </SkipLink>,
      );

      const link = screen.getByTestId('link');

      // tabindex 를 달지 않는다 — href 있는 anchor 는 이미 tabbable 이다.
      expect(link).not.toHaveAttribute('tabindex');
      link.focus();
      expect(link).toHaveFocus();
    });
  });

  /**
   * SkipLink 는 **CSS 가 곧 동작**이다 — 포커스 전까지 숨고 포커스에서 드러나는 것이
   * 이 컴포넌트의 전부다. JSX 에는 그 계약이 없으므로 컴파일된 CSS 를 직접 읽는다.
   *
   * jsdom CSSOM 은 논리 속성과 `clip` 을 신뢰할 수 없게 다뤄서 계산값 대신 텍스트를 본다
   * (`forcedColors.test.ts` 와 같은 이유).
   */
  describe('시각 계약 (컴파일된 CSS)', () => {
    const css = compile(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'skip-link.scss'),
    ).css;

    const ruleBody = (selector: string): string => {
      const index = css.indexOf(selector);
      if (index === -1) return '';
      const open = css.indexOf('{', index);
      return css.slice(open + 1, css.indexOf('}', open));
    };

    it('컴파일된 CSS 를 실제로 읽는다', () => {
      expect(css.length).toBeGreaterThan(100);
    });

    it('기본 상태는 시각적으로 숨는다', () => {
      const base = ruleBody('.ui-skip-link {');

      expect(base).toMatch(/inline-size:\s*1px/);
      expect(base).toMatch(/block-size:\s*1px/);
      expect(base).toMatch(/overflow:\s*hidden/);
      expect(base).toMatch(/clip:\s*rect\(0 0 0 0\)/);
    });

    it('포커스 상태는 논리 속성으로 드러난다', () => {
      const focused = ruleBody('.ui-skip-link:focus,');

      // RTL 에서도 따라가야 해서 left/top 이 아니라 논리 속성이다.
      expect(focused).toMatch(/inset-inline-start:/);
      expect(focused).toMatch(/inset-block-start:/);
      expect(focused).toMatch(/inline-size:\s*auto/);
      expect(focused).toMatch(/clip:\s*auto/);
      expect(focused).toMatch(/z-index:\s*50/);
    });

    it('색·간격·타이포를 토큰에서만 가져온다', () => {
      // 하드코딩된 hex/rgb 가 없어야 한다.
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css).not.toMatch(/\brgba?\(/);
      expect(ruleBody('.ui-skip-link:focus,')).toMatch(/var\(--ds-body-small-strong-font-size\)/);
    });

    /**
     * 포커스 표시는 `outline` 이 담당한다.
     *
     * forced-colors(Windows 고대비) 모드는 저자 색을 시스템 색으로 갈아끼우고 `box-shadow`
     * 를 **지운다**(CSS Color Adjust 1). 그래서 그림자로만 그린 포커스 링은 그 모드에서
     * 통째로 사라진다 — WCAG 2.4.7 위반이다. 살아남는 것은 `outline` 이라,
     * `.ui-button:focus-visible` 과 같은 전략을 쓴다: outline 과 그림자를 **함께** 선언해
     * 그림자가 지워져도 outline 이 남게 한다. 그 덕에 이 시트에는 forced-colors 전용
     * 블록이 필요 없다.
     */
    it('포커스 상태가 outline 을 선언한다', () => {
      const focused = ruleBody('.ui-skip-link:focus,');

      expect(focused).toMatch(/outline:\s*var\(--ds-border-primary-width\) solid/);
      expect(focused).toMatch(/outline-offset:/);
    });

    it('포커스 표시를 outline: none 으로 지우지 않는다', () => {
      expect(css).not.toMatch(/outline:\s*none/);
    });

    /**
     * `:focus` 와 `:focus-visible` 을 **둘 다** 유지한다.
     *
     * `:focus-visible` 만 두면 브라우저 휴리스틱이 "보이는 포커스"로 치지 않은 경우
     * — 프로그래매틱 `focus()`, 일부 스크린리더/키보드 조합 — 에 bypass link 가 포커스를
     * 가진 채로 계속 숨어 있게 된다. 우회 수단이 조용히 사라지는 쪽이 잉여 노출보다 나쁘다.
     */
    it(':focus 와 :focus-visible 을 모두 노출한다', () => {
      expect(css).toContain('.ui-skip-link:focus,');
      expect(css).toContain('.ui-skip-link:focus-visible');
    });
  });
});
