import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Stack } from './Stack';
import { stackClasses } from './Stack.constants';

describe('<Stack />', () => {
  const { render } = createRenderer();

  describeConformance(<Stack>hello</Stack>, () => ({
    render,
    classes: stackClasses,
    refInstanceof: HTMLDivElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('root', () => {
    it('children을 루트 요소 내부에 렌더링해야 한다', () => {
      render(<Stack>Hello</Stack>);

      expect(screen.getByText('Hello')).toHaveTextContent('Hello');
    });

    it('div로 렌더링해야 한다', () => {
      const { container } = render(<Stack>Hello</Stack>);

      expect(container.firstChild).toHaveProperty('nodeName', 'DIV');
    });

    it('ref가 루트 div를 가리켜야 한다', () => {
      const ref = createRef<HTMLDivElement>();

      render(<Stack ref={ref}>Hello</Stack>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass(stackClasses.root);
      expect(ref.current).toBe(screen.getByText('Hello'));
    });

    it('추가 className을 루트에 병합해야 한다', () => {
      render(<Stack className="custom-stack">Hello</Stack>);

      const stack = screen.getByText('Hello');

      expect(stack).toHaveClass(stackClasses.root);
      expect(stack).toHaveClass('custom-stack');
    });

    it('native DOM 속성을 그대로 전달해야 한다', () => {
      render(
        <Stack id="shell" title="레이아웃" lang="ko" data-region="main" data-testid="stack">
          Hello
        </Stack>,
      );

      const stack = screen.getByTestId('stack');

      expect(stack).toHaveAttribute('id', 'shell');
      expect(stack).toHaveAttribute('title', '레이아웃');
      expect(stack).toHaveAttribute('lang', 'ko');
      expect(stack).toHaveAttribute('data-region', 'main');
    });
  });

  /**
   * 계약이 정한 기본값은 **두 가지뿐**이다: `display: flex` 와 세로 축.
   *
   * `flex-direction` 을 항상 내보내는 이유는 CSS 기본값이 `row` 이기 때문이다 — RN Yoga 기본값
   * (`column`)과 갈리므로 web 렌더러는 기본값에 기댈 수 없다. 나머지 축은 주지 않으면 건드리지
   * 않는다 (Box 의 "미지정은 미적용" 과 같은 규칙).
   */
  describe('기본 시맨틱', () => {
    it('display: flex 와 세로 축을 적용해야 한다', () => {
      render(<Stack>Hello</Stack>);

      expect(screen.getByText('Hello')).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
      });
    });

    it('미지정 축에는 아무 값도 주입하지 않아야 한다', () => {
      render(<Stack>Hello</Stack>);

      const stack = screen.getByText('Hello');

      expect(stack.style.gap).toBe('');
      expect(stack.style.alignItems).toBe('');
      expect(stack.style.justifyContent).toBe('');
      expect(stack.style.flexWrap).toBe('');
    });
  });

  describe('direction', () => {
    it('column 을 세로 축으로 적용해야 한다', () => {
      render(<Stack direction="column">Hello</Stack>);

      expect(screen.getByText('Hello')).toHaveStyle({ flexDirection: 'column' });
    });

    it('row 를 가로 축으로 적용해야 한다', () => {
      render(<Stack direction="row">Hello</Stack>);

      expect(screen.getByText('Hello')).toHaveStyle({ flexDirection: 'row' });
    });
  });

  describe('gap', () => {
    it('spacing 토큰을 디자인 토큰 CSS 변수로 변환해야 한다', () => {
      render(<Stack gap="md">Hello</Stack>);

      // 브라우저가 계산한 px 가 아니라 변수 참조 자체가 계약이다 — 값은 테마가 정한다.
      expect(screen.getByText('Hello').style.gap).toBe('var(--ds-spacing-md)');
    });

    it('숫자 gap 을 px 로 적용해야 한다', () => {
      render(<Stack gap={12}>Hello</Stack>);

      expect(screen.getByText('Hello').style.gap).toBe('12px');
    });

    it('숫자 0 을 적용해야 한다 — 미지정으로 취급하지 않는다', () => {
      render(<Stack gap={0}>Hello</Stack>);

      expect(screen.getByText('Hello').style.gap).toBe('0px');
    });

    it('undefined gap 은 선언을 만들지 않아야 한다', () => {
      render(<Stack gap={undefined}>Hello</Stack>);

      expect(screen.getByText('Hello').style.gap).toBe('');
    });
  });

  /** 계약 어휘(`start`·`end`)를 CSS 어휘(`flex-start`·`flex-end`)로 푸는 것은 렌더러 몫이다. */
  describe('align', () => {
    it.each([
      ['start', 'flex-start'],
      ['center', 'center'],
      ['end', 'flex-end'],
      ['stretch', 'stretch'],
    ] as const)('align=%s 를 align-items: %s 로 푼다', (align, expected) => {
      render(<Stack align={align}>Hello</Stack>);

      expect(screen.getByText('Hello').style.alignItems).toBe(expected);
    });
  });

  describe('justify', () => {
    it.each([
      ['start', 'flex-start'],
      ['center', 'center'],
      ['end', 'flex-end'],
      ['between', 'space-between'],
    ] as const)('justify=%s 를 justify-content: %s 로 푼다', (justify, expected) => {
      render(<Stack justify={justify}>Hello</Stack>);

      expect(screen.getByText('Hello').style.justifyContent).toBe(expected);
    });
  });

  describe('wrap', () => {
    it('wrap 을 켜면 줄바꿈을 허용해야 한다', () => {
      render(<Stack wrap>Hello</Stack>);

      expect(screen.getByText('Hello').style.flexWrap).toBe('wrap');
    });

    /** 명시한 `false` 는 미지정과 다르다 — `gap={0}` 과 같은 취급이다. */
    it('wrap={false} 는 nowrap 을 명시해야 한다', () => {
      render(<Stack wrap={false}>Hello</Stack>);

      expect(screen.getByText('Hello').style.flexWrap).toBe('nowrap');
    });
  });

  /**
   * 소비자 `style` 이 **마지막에 이긴다**. Stack 이 계산한 레이아웃도 덮을 수 있어야 escape
   * hatch 가 성립한다 (Box 와 같은 순서).
   */
  describe('style 우선순위', () => {
    it('소비자 style 이 계산된 레이아웃을 이겨야 한다', () => {
      render(
        <Stack direction="row" gap="md" style={{ flexDirection: 'column', gap: '1px' }}>
          Hello
        </Stack>,
      );

      const stack = screen.getByText('Hello');

      expect(stack.style.flexDirection).toBe('column');
      expect(stack.style.gap).toBe('1px');
    });

    it('소비자가 덮지 않은 선언은 그대로 남아야 한다', () => {
      render(
        <Stack direction="row" align="center" style={{ gap: '1px' }}>
          Hello
        </Stack>,
      );

      const stack = screen.getByText('Hello');

      expect(stack.style.flexDirection).toBe('row');
      expect(stack.style.alignItems).toBe('center');
      expect(stack.style.gap).toBe('1px');
    });
  });

  /**
   * 시맨틱 prop 은 **스타일로만** 드러나야 한다. DOM 속성으로 새면 `<div align>` 처럼 폐기된
   * HTML 속성이 되살아나거나 React 가 알 수 없는 속성 경고를 낸다.
   */
  describe('prop 누수', () => {
    it('시맨틱 prop 을 DOM 속성으로 내보내지 않아야 한다', () => {
      render(
        <Stack direction="row" gap="md" align="center" justify="between" wrap data-testid="stack">
          Hello
        </Stack>,
      );

      const stack = screen.getByTestId('stack');

      expect(stack.hasAttribute('direction')).toBe(false);
      expect(stack.hasAttribute('gap')).toBe(false);
      expect(stack.hasAttribute('align')).toBe(false);
      expect(stack.hasAttribute('justify')).toBe(false);
      expect(stack.hasAttribute('wrap')).toBe(false);
    });
  });

  /**
   * Stack 은 비상호작용 레이아웃 primitive 다. 시맨틱을 **지어내지 않고**, 소비자가 준 것은
   * 그대로 전달한다.
   */
  describe('접근성', () => {
    it('소비자가 준 접근성 prop 을 전달해야 한다', () => {
      render(
        <Stack
          role="group"
          aria-label="필터"
          aria-describedby="hint"
          tabIndex={-1}
          data-testid="stack"
        >
          Hello
        </Stack>,
      );

      const stack = screen.getByTestId('stack');

      expect(stack).toHaveAttribute('role', 'group');
      expect(stack).toHaveAttribute('aria-label', '필터');
      expect(stack).toHaveAttribute('aria-describedby', 'hint');
      expect(stack).toHaveAttribute('tabindex', '-1');
    });

    it('주지 않으면 역할·포커스·이름을 만들지 않아야 한다', () => {
      render(<Stack data-testid="stack">Hello</Stack>);

      const stack = screen.getByTestId('stack');

      expect(stack.hasAttribute('role')).toBe(false);
      expect(stack.hasAttribute('tabindex')).toBe(false);
      expect(stack.hasAttribute('aria-label')).toBe(false);
      expect(stack.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  /**
   * 상태 API 가 없다는 사실을 타입으로 고정한다 — `tsc -p tsconfig.spec.json` 이 확인하고,
   * 생기면 "unused directive" 로 실패한다.
   */
  describe('상호작용 API 가 없다', () => {
    it('상태 prop 을 받지 않는다', () => {
      const nodes = [
        // @ts-expect-error 레이아웃 컨테이너에 눌림 상태가 없다
        <Stack key="pressed" pressed />,
        // @ts-expect-error hover 상태를 prop 으로 두지 않는다
        <Stack key="hovered" hovered />,
        // @ts-expect-error 비활성화할 동작이 없다
        <Stack key="disabled" disabled />,
      ];

      expect(nodes).toHaveLength(3);
    });

    it('Box 의 visual prop 과 자식 자리 prop 을 받지 않는다', () => {
      const nodes = [
        // @ts-expect-error 여백·면은 Box 가 가진다
        <Stack key="p" p="md" />,
        // @ts-expect-error 같은 이유로 Box 가 가진다
        <Stack key="bg" bg="background.surface" />,
        // @ts-expect-error 자식이 얼마나 자라는지는 자식이 정한다
        <Stack key="grow" grow={1} />,
        // @ts-expect-error 2차원 배치는 Stack 의 역할이 아니다
        <Stack key="columns" columns={3} />,
      ];

      expect(nodes).toHaveLength(4);
    });
  });
});
