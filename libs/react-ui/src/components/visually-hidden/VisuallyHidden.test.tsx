import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { compile } from 'sass';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { VisuallyHidden } from './VisuallyHidden';

const ROOT_CLASS = 'ui-visually-hidden';

describe('<VisuallyHidden />', () => {
  const { render } = createRenderer();

  describeConformance(<VisuallyHidden>숨은 글자</VisuallyHidden>, () => ({
    render,
    classes: { root: ROOT_CLASS },
    refInstanceof: HTMLSpanElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('root', () => {
    /**
     * `<span>` 이다 — 구문 내용(phrasing content)이라 버튼·라벨 안에 들어가 **접근 가능한
     * 이름에 기여**할 수 있다. 블록 요소면 그 자리에 넣을 수 없다.
     */
    it('span 으로 렌더링한다', () => {
      const { container } = render(<VisuallyHidden>숨은 글자</VisuallyHidden>);

      expect(container.firstChild).toHaveProperty('nodeName', 'SPAN');
    });

    it('children 을 DOM 에 그대로 둔다', () => {
      render(<VisuallyHidden>장바구니에 담기</VisuallyHidden>);

      expect(screen.getByText('장바구니에 담기')).toBeInTheDocument();
    });

    it('ref 가 루트 span 을 가리킨다', () => {
      const ref = createRef<HTMLSpanElement>();

      render(<VisuallyHidden ref={ref}>숨은 글자</VisuallyHidden>);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current).toHaveClass(ROOT_CLASS);
    });
  });

  /**
   * **이 컴포넌트의 전부다**: 시각에서만 사라지고 접근성 트리에는 남는다.
   *
   * 그래서 접근성 트리에서 지우는 수단을 **자동으로 붙이지 않는다**. 붙이는 순간 컴포넌트가
   * 아무 일도 하지 않는 것과 같아진다 — 보이지도 않고 읽히지도 않으면 그냥 지운 것이다.
   */
  describe('접근성 계약', () => {
    it('aria-hidden 을 자동으로 붙이지 않는다', () => {
      render(<VisuallyHidden data-testid="vh">숨은 글자</VisuallyHidden>);

      expect(screen.getByTestId('vh')).not.toHaveAttribute('aria-hidden');
    });

    it('hidden 속성을 쓰지 않는다', () => {
      render(<VisuallyHidden data-testid="vh">숨은 글자</VisuallyHidden>);

      expect(screen.getByTestId('vh')).not.toHaveAttribute('hidden');
    });

    /**
     * 대표 사용처: 아이콘만 있는 컨트롤에 읽을 이름을 준다.
     *
     * `aria-label` 대신 이것을 쓰는 이유는 실제 텍스트 노드라서 번역·글자 선택·검색에
     * 걸리고, 브라우저 번역기가 `aria-label` 보다 안정적으로 다루기 때문이다.
     */
    it('아이콘만 있는 버튼의 접근 가능한 이름이 된다', () => {
      render(
        <button type="button">
          <svg aria-hidden="true" focusable="false" width="16" height="16" />
          <VisuallyHidden>저장</VisuallyHidden>
        </button>,
      );

      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });

    /**
     * 보이는 글자에 덧붙는 보충 설명도 같은 방식으로 이름에 들어간다.
     *
     * 이름 계산은 텍스트 노드를 **그대로 이어 붙인다** — JSX 줄바꿈은 공백을 만들지 않으므로
     * 기대값도 붙여 적는다. 숨은 글자에 구분 기호를 직접 넣는 이유다.
     */
    it('보이는 글자와 함께 이름을 구성한다', () => {
      render(
        <button type="button">
          더 보기
          <VisuallyHidden>(2024년 매출 보고서)</VisuallyHidden>
        </button>,
      );

      expect(
        screen.getByRole('button', { name: '더 보기(2024년 매출 보고서)' }),
      ).toBeInTheDocument();
    });
  });

  describe('스타일 계약', () => {
    /** jsdom 이 색 키워드를 `rgb()` 로 정규화하므로 기대값도 그 형태로 적는다. */
    it('소비자 style 을 그대로 전달한다', () => {
      render(
        <VisuallyHidden style={{ color: 'red' }} data-testid="vh">
          숨은 글자
        </VisuallyHidden>,
      );

      expect(screen.getByTestId('vh')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
  });

  /**
   * 시각 계약 — 컴파일된 CSS 를 텍스트로 읽는다.
   *
   * jsdom 의 CSSOM 은 `clip` 과 논리 속성을 신뢰할 수 있게 다루지 못해서 계산값 대신 텍스트를
   * 본다 (`skip-link`·`switch`·`divider` 와 같은 이유).
   */
  describe('visually-hidden.scss', () => {
    const css = compile(
      path.join(path.dirname(fileURLToPath(import.meta.url)), 'visually-hidden.scss'),
    ).css.replaceAll(/\/\*[\s\S]*?\*\//g, '');

    it('컴파일된 CSS 를 실제로 읽는다', () => {
      expect(css.length).toBeGreaterThan(50);
    });

    /**
     * 접근성 트리에서 지우는 두 가지를 쓰지 않는다. `table.scss` 의 hiddenCaption 검사와
     * 같은 계약이다.
     */
    it('display:none · visibility:hidden 을 쓰지 않는다', () => {
      expect(css).not.toMatch(/display:\s*none/);
      expect(css).not.toMatch(/visibility:\s*hidden/);
    });

    /** 저장소 정본 패턴 (`form-control` 의 hiddenLabel, `table` 의 hiddenCaption). */
    it('정본 클리핑 패턴을 쓴다', () => {
      expect(css).toMatch(/position:\s*absolute/);
      expect(css).toMatch(/overflow:\s*hidden/);
      expect(css).toMatch(/white-space:\s*nowrap/);
      expect(css).toMatch(/clip:\s*rect\(0 0 0 0\)/);
      expect(css).toMatch(/clip-path:\s*inset\(50%\)/);
      expect(css).toMatch(/border:\s*0/);
    });

    /**
     * 클리핑 상수(`1px`·`-1px`·`50%`)는 **시각 디자인 값이 아니라 알고리즘 상수다.**
     * spacing 토큰으로 매핑하면 "테마가 바꿀 수 있는 값"이라는 거짓말이 된다.
     */
    it('클리핑 상수를 디자인 토큰으로 위장하지 않는다', () => {
      expect(css).not.toMatch(/var\(--ds-spacing-/);
      expect(css).not.toMatch(/var\(--ds-radius-/);
    });

    /**
     * 포커스로 드러나는 동작은 **SkipLink 의 책임이다.**
     *
     * 여기에 `:focus-within` 드러내기를 넣으면 두 컴포넌트가 같은 일을 하게 되고, 무엇보다
     * VisuallyHidden 안의 포커스 가능한 자식은 "포커스는 가는데 보이지 않는" 위험한 상태가
     * 된다. 그 용도는 SkipLink 로 보낸다.
     */
    it('포커스로 드러나는 규칙을 만들지 않는다', () => {
      expect(css).not.toContain(':focus');
      expect(css).not.toContain(':focus-within');
      expect(css).not.toContain(':focus-visible');
    });

    /** 비상호작용이고 색·면을 갖지 않는다. */
    it('색이나 면을 칠하지 않는다', () => {
      expect(css).not.toMatch(/background/);
      expect(css).not.toMatch(/box-shadow/);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    });
  });
});
