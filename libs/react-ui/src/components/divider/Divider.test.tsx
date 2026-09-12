import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { compile } from 'sass';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Divider } from './Divider';
import { dividerClasses } from './Divider.constants';

describe('<Divider />', () => {
  const { render } = createRenderer();

  describeConformance(<Divider />, () => ({
    render,
    classes: dividerClasses,
    refInstanceof: HTMLHRElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('root', () => {
    /**
     * `<hr>` 은 HTML-AAM 이 `separator` 역할로 매핑하는 native 요소다. 역할을 ARIA 로 다시
     * 적지 않는 이유이고, 이 검사가 그 전제를 고정한다.
     */
    it('hr 로 렌더링한다', () => {
      const { container } = render(<Divider />);

      expect(container.firstChild).toHaveProperty('nodeName', 'HR');
    });

    it('기본으로 separator 역할을 가진다 — role 을 직접 적지 않는다', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByRole('separator');

      expect(divider).toBe(screen.getByTestId('divider'));
      expect(divider).not.toHaveAttribute('role');
    });

    it('ref 가 루트 hr 을 가리킨다', () => {
      const ref = createRef<HTMLHRElement>();

      render(<Divider ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLHRElement);
      expect(ref.current).toHaveClass(dividerClasses.root);
    });
  });

  /**
   * 축은 계약 어휘(`horizontal`·`vertical`)이고, 시각은 modifier 클래스가 가진다.
   * ARIA 는 **필요할 때만** 적는다 — separator 의 기본 방향이 이미 horizontal 이다.
   */
  describe('orientation', () => {
    it('미지정은 horizontal 이다', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');

      expect(divider).toHaveClass(dividerClasses.horizontal);
      expect(divider).not.toHaveClass(dividerClasses.vertical);
    });

    it('horizontal 에는 aria-orientation 을 적지 않는다 — separator 의 기본값이다', () => {
      render(<Divider orientation="horizontal" data-testid="divider" />);

      expect(screen.getByTestId('divider')).not.toHaveAttribute('aria-orientation');
    });

    it('vertical 은 aria-orientation 으로 기본값을 뒤집는다', () => {
      render(<Divider orientation="vertical" data-testid="divider" />);

      const divider = screen.getByTestId('divider');

      expect(divider).toHaveClass(dividerClasses.vertical);
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  /**
   * 시각 구분과 시맨틱 구분은 **다른 결정**이다.
   *
   * 저장소의 기존 구분선은 전부 시각 장식(카드 테두리·행 경계)이다. 그 용도에는 접근성 트리에
   * separator 를 하나 더 만들 이유가 없다. `role="presentation"` 은 native 시맨틱만 끄고
   * 요소는 남긴다 — `aria-hidden` 과 달리 소비자가 얹은 내용까지 숨기지 않는다.
   */
  describe('decorative', () => {
    it('기본은 시맨틱이다', () => {
      render(<Divider data-testid="divider" />);

      expect(screen.getByTestId('divider')).not.toHaveAttribute('role', 'presentation');
    });

    it('decorative 는 native separator 시맨틱을 끈다', () => {
      render(<Divider decorative data-testid="divider" />);

      expect(screen.getByTestId('divider')).toHaveAttribute('role', 'presentation');
      expect(screen.queryByRole('separator')).toBeNull();
    });

    /** 역할이 없으면 방향을 적을 대상도 없다. */
    it('decorative + vertical 은 aria-orientation 을 적지 않는다', () => {
      render(<Divider decorative orientation="vertical" data-testid="divider" />);

      const divider = screen.getByTestId('divider');

      expect(divider).toHaveClass(dividerClasses.vertical);
      expect(divider).not.toHaveAttribute('aria-orientation');
    });
  });

  describe('스타일 계약', () => {
    it('소비자 style 이 계산된 값보다 뒤에 온다', () => {
      render(<Divider style={{ marginBlock: '4px' }} data-testid="divider" />);

      expect(screen.getByTestId('divider')).toHaveStyle({ marginBlock: '4px' });
    });

    it('비상호작용이다 — 포커스 가능한 속성을 만들지 않는다', () => {
      render(<Divider data-testid="divider" />);

      const divider = screen.getByTestId('divider');

      expect(divider).not.toHaveAttribute('tabindex');
      expect(divider).not.toHaveAttribute('onclick');
    });
  });

  /**
   * 시각 계약 — 컴파일된 CSS 를 텍스트로 읽는다.
   *
   * jsdom 의 CSSOM 은 논리 속성과 `@media` 를 신뢰할 수 있게 다루지 못해서 계산값 대신
   * 텍스트를 본다 (`skip-link`·`switch` 와 같은 이유).
   */
  describe('divider.scss', () => {
    const css = compile(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'divider.scss'),
    ).css.replaceAll(/\/\*[\s\S]*?\*\//g, '');

    const ruleBody = (selector: string): string => {
      const index = css.indexOf(selector);
      if (index === -1) return '';
      const open = css.indexOf('{', index);
      return css.slice(open + 1, css.indexOf('}', open));
    };

    const mediaBody = (query: string): string => {
      const start = css.indexOf(`@media ${query}`);
      if (start === -1) return '';
      const open = css.indexOf('{', start);
      let depth = 0;
      for (let i = open; i < css.length; i += 1) {
        if (css[i] === '{') depth += 1;
        if (css[i] === '}') {
          depth -= 1;
          if (depth === 0) return css.slice(open + 1, i);
        }
      }
      return '';
    };

    it('컴파일된 CSS 를 실제로 읽는다', () => {
      expect(css.length).toBeGreaterThan(100);
    });

    /** UA 기본 `<hr>` 은 margin 과 inset border 를 갖는다. 그것을 지우고 선을 직접 그린다. */
    it('UA 기본 hr 스타일을 지운다', () => {
      const base = ruleBody('.ui-divider {');

      expect(base).toMatch(/border:\s*0/);
      expect(base).toMatch(/margin:\s*0/);
    });

    /**
     * 선은 `background-color` 가 아니라 **border** 로 그린다.
     *
     * forced-colors 는 저자 색을 시스템 색으로 갈아끼운다. 1px 배경으로 그린 선은 그 모드에서
     * 배경색과 같아져 사라질 수 있지만 border 는 남는다.
     */
    it('선을 border 로 그린다 — background 로 그리지 않는다', () => {
      expect(css).toMatch(/border-block-start:/);
      expect(css).toMatch(/border-inline-start:/);
      expect(css).not.toMatch(/background(-color)?:/);
    });

    /** 물리 방향(top/left)이 아니라 논리 속성이라 RTL 에서 저절로 뒤집힌다. */
    it('논리 속성만 쓴다', () => {
      expect(css).not.toMatch(/border-top:/);
      expect(css).not.toMatch(/border-left:/);
    });

    it('두께와 색을 토큰에서 가져온다 — 하드코딩하지 않는다', () => {
      expect(css).toContain('var(--ds-semantic-border-divider)');
      expect(css).toContain('var(--ds-stroke-light)');
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css).not.toMatch(/\brgba?\(/);
      expect(css).not.toMatch(/\b1px\b/);
    });

    /**
     * forced-colors 대응. `table.scss` 와 같은 전략이다 — 그 모드에서만 `CanvasText` 로
     * 선을 되살린다. `forced-color-adjust: none` 은 쓰지 않는다 (사용자 팔레트를 끄는 셈).
     */
    it('forced-colors 에서 선을 CanvasText 로 되살린다', () => {
      const forced = mediaBody('(forced-colors: active)');

      expect(forced).toContain('CanvasText');
      expect(css).not.toMatch(/forced-color-adjust:\s*none/);
    });

    /** 비상호작용이다 — 상태 선택자를 만들지 않는다. */
    it('상호작용 상태 규칙이 없다', () => {
      for (const selector of [':hover', ':focus', ':focus-visible', ':active', ':disabled']) {
        expect(css).not.toContain(selector);
      }
    });
  });
});
