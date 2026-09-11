import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Box } from './Box';
import { boxClasses } from './Box.constants';
import type { ColorToken } from './Box.types';

describe('<Box />', () => {
  const { render } = createRenderer();

  describeConformance(<Box>hello</Box>, () => ({
    render,
    classes: boxClasses,
    refInstanceof: HTMLDivElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('ref', () => {
    it('ref가 루트 div를 가리켜야 한다', () => {
      const ref = createRef<HTMLDivElement>();

      render(<Box ref={ref}>Hello</Box>);

      // 래퍼가 아니라 실제 렌더된 루트여야 한다.
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass(boxClasses.root);
      expect(ref.current).toBe(screen.getByText('Hello'));
    });
  });

  describe('root', () => {
    it('children을 루트 요소 내부에 렌더링해야 한다', () => {
      render(<Box>Hello</Box>);

      const box = screen.getByText('Hello');

      expect(box).toHaveClass(boxClasses.root);
      expect(box).toHaveTextContent('Hello');
    });

    it('추가 className을 루트에 적용해야 한다', () => {
      render(<Box className="custom-box">Hello</Box>);

      expect(screen.getByText('Hello')).toHaveClass(boxClasses.root);
      expect(screen.getByText('Hello')).toHaveClass('custom-box');
    });

    it('기본적으로 div로 렌더링해야 한다', () => {
      const { container } = render(<Box>Hello</Box>);

      expect(container.firstChild).toHaveProperty('nodeName', 'DIV');
    });
  });

  describe('spacing', () => {
    it('숫자 p 값을 px 단위 padding으로 적용해야 한다', () => {
      render(<Box p={12}>Hello</Box>);

      expect(screen.getByText('Hello')).toHaveStyle({
        paddingTop: '12px',
        paddingRight: '12px',
        paddingBottom: '12px',
        paddingLeft: '12px',
      });
    });

    it('축약 padding보다 방향별 padding이 우선해야 한다', () => {
      render(
        <Box p={12} px={16} pt={20}>
          Hello
        </Box>,
      );

      expect(screen.getByText('Hello')).toHaveStyle({
        paddingTop: '20px',
        paddingRight: '16px',
        paddingBottom: '12px',
        paddingLeft: '16px',
      });
    });

    it('숫자 m 값을 px 단위 margin으로 적용해야 한다', () => {
      render(<Box m={8}>Hello</Box>);

      expect(screen.getByText('Hello')).toHaveStyle({
        marginTop: '8px',
        marginRight: '8px',
        marginBottom: '8px',
        marginLeft: '8px',
      });
    });

    it('축약 margin보다 방향별 margin이 우선해야 한다', () => {
      render(
        <Box m={8} my={10} ml={14}>
          Hello
        </Box>,
      );

      expect(screen.getByText('Hello')).toHaveStyle({
        marginTop: '10px',
        marginRight: '8px',
        marginBottom: '10px',
        marginLeft: '14px',
      });
    });

    it('spacing 토큰을 디자인 토큰 CSS 변수로 변환해야 한다', () => {
      render(
        <Box p="md" mt="lg">
          Hello
        </Box>,
      );

      // 브라우저가 계산한 px가 아니라 변수 참조 자체가 계약이다 — 값은 테마가 정한다.
      const box = screen.getByText('Hello');

      expect(box.style.paddingTop).toBe('var(--ds-spacing-md)');
      expect(box.style.paddingLeft).toBe('var(--ds-spacing-md)');
      expect(box.style.marginTop).toBe('var(--ds-spacing-lg)');
    });

    it('숫자 0을 적용해야 한다 — 미지정으로 취급하지 않는다', () => {
      render(
        <Box p={0} m={0}>
          Hello
        </Box>,
      );

      const box = screen.getByText('Hello');

      expect(box.style.paddingTop).toBe('0px');
      expect(box.style.paddingRight).toBe('0px');
      expect(box.style.paddingBottom).toBe('0px');
      expect(box.style.paddingLeft).toBe('0px');
      expect(box.style.marginTop).toBe('0px');
    });
  });

  describe('visuals', () => {
    it('숫자 radius 값을 px 단위 border-radius로 적용해야 한다', () => {
      render(<Box radius={24}>Hello</Box>);

      expect(screen.getByText('Hello')).toHaveStyle({
        borderRadius: '24px',
      });
    });

    it('radius 토큰을 디자인 토큰 CSS 변수로 변환해야 한다', () => {
      render(<Box radius="md">Hello</Box>);

      expect(screen.getByText('Hello').style.borderRadius).toBe('var(--ds-radius-md)');
    });

    it('숫자 radius 0을 적용해야 한다', () => {
      render(<Box radius={0}>Hello</Box>);

      expect(screen.getByText('Hello').style.borderRadius).toBe('0px');
    });

    it('bg 토큰을 디자인 토큰 CSS 변수로 변환해야 한다', () => {
      render(<Box bg="background.surface">Hello</Box>);

      // 점 경로가 대시로 평탄화된다. 값 해석은 CSS 캐스케이드가 맡는다.
      expect(screen.getByText('Hello').style.backgroundColor).toBe('var(--ds-background-surface)');
    });

    /**
     * 계약을 어긴 `bg` 는 **조용히 무의미한 CSS 변수가 된다** — 막지 않는 것이 의도다.
     *
     * 경로 검증은 타입이 한다 (`ColorToken` 은 color 트리의 leaf 경로다). 타입을 우회해 들어온
     * 값에 대해 web 은 이름을 평탄화해 넘기기만 하고, 브라우저는 정의되지 않은 변수를 만나
     * 그 선언을 버린다 — 배경이 칠해지지 않을 뿐 아무것도 깨지지 않는다.
     *
     * 같은 입력에서 **RN 은 던진다** (`getToken` 의 엄격 실패. `ui-core/src/tokens/getToken.test.ts`).
     * 갈리는 이유는 수단이 다르기 때문이다: RN 은 렌더 시점에 토큰 트리를 실제로 조회해서
     * 결손이 `undefined` 인 채로 색 자리까지 흘러가지만, web 은 조회하지 않고 이름만 넘긴다.
     *
     * 대칭을 만들려고 web 에 런타임 검증을 더하지 말 것 — 타입이 이미 막는 입력을 위해
     * 모든 소비자 번들이 비용을 내게 된다. 이 테스트는 그 결정을 고정한다.
     */
    it('타입을 우회한 bg 는 검증하지 않고 그대로 변수로 내보낸다', () => {
      render(<Box bg={'nonsense.path' as ColorToken}>Hello</Box>);

      expect(screen.getByText('Hello').style.backgroundColor).toBe('var(--ds-nonsense-path)');
    });

    it('style prop이 계산된 스타일을 덮어쓸 수 있어야 한다', () => {
      render(
        <Box p={12} style={{ paddingTop: '40px', marginLeft: '24px' }}>
          Hello
        </Box>,
      );

      expect(screen.getByText('Hello')).toHaveStyle({
        paddingTop: '40px',
        paddingRight: '12px',
        paddingBottom: '12px',
        paddingLeft: '12px',
        marginLeft: '24px',
      });
    });

    it('style prop이 토큰으로 계산된 값도 덮어써야 한다', () => {
      render(
        <Box
          p="md"
          bg="background.surface"
          style={{ backgroundColor: 'rgb(1, 2, 3)', paddingTop: '40px' }}
        >
          Hello
        </Box>,
      );

      const box = screen.getByText('Hello');

      // 토큰이라고 특별 대우하지 않는다 — 소비자 style이 마지막이다.
      expect(box.style.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(box.style.paddingTop).toBe('40px');
      // 덮지 않은 축은 토큰 변수 그대로 남는다.
      expect(box.style.paddingLeft).toBe('var(--ds-spacing-md)');
    });
  });

  describe('html props', () => {
    it('일반 div props를 루트에 전달해야 한다', () => {
      render(
        <Box data-testid="box" title="box title">
          Hello
        </Box>,
      );

      const box = screen.getByTestId('box');

      expect(box).toHaveAttribute('title', 'box title');
      expect(box).toHaveTextContent('Hello');
    });

    it('role과 ARIA prop을 그대로 전달해야 한다 — 시맨틱을 지어내지 않는다', () => {
      render(
        <Box data-testid="box" role="region" aria-label="사용자 프로필" aria-describedby="desc">
          Hello
        </Box>,
      );

      const box = screen.getByRole('region', { name: '사용자 프로필' });

      expect(box).toHaveAttribute('aria-describedby', 'desc');
      expect(box).toBe(screen.getByTestId('box'));
    });

    it('기본적으로 중립이어야 한다 — role이나 ARIA를 스스로 붙이지 않는다', () => {
      render(<Box data-testid="box">Hello</Box>);

      const box = screen.getByTestId('box');

      expect(box).not.toHaveAttribute('role');
      expect(box.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
    });

    it('Box 토큰 prop을 DOM 속성으로 흘리지 않아야 한다', () => {
      render(
        <Box data-testid="box" p="md" px={4} mt="lg" bg="background.surface" radius="md">
          Hello
        </Box>,
      );

      const attributes = screen.getByTestId('box').getAttributeNames();

      // 토큰 prop은 style로만 나가야 한다. 하나라도 새면 React가 unknown attribute로 흘린 것이다.
      for (const token of ['p', 'px', 'mt', 'bg', 'radius']) {
        expect(attributes).not.toContain(token);
      }

      expect([...attributes].sort()).toEqual(['class', 'data-testid', 'style']);
    });
  });
});
