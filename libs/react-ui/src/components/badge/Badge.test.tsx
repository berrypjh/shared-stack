/**
 * Badge 계약.
 *
 * Badge 는 **overlay indicator** 다 — 앵커(`children`)를 감싸고 그 위에 알림/개수/점을 얹는다.
 * standalone status pill 이 아니다 (그 역할은 Chip 이 가진다).
 *
 * 세 가지가 이 컴포넌트의 존재 이유이고, 그래서 가장 두껍게 검사한다:
 *
 * 1. **앵커를 건드리지 않는다.** 래퍼가 자식의 role·이름·키보드·포인터를 바꾸면 안 된다.
 * 2. **색만으로 의미를 전달하지 않는다.** 장식(dot)과 의미 있는 정보(count·label)를 분리한다.
 * 3. **`role="status"` 를 기본으로 붙이지 않는다.** live region 은 소비자가 고를 일이다.
 */
import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { IconButton } from '../icon-button';

import { Badge } from './Badge';
import { badgeClasses } from './Badge.constants';
import * as barrel from './index';

/**
 * 표시자는 공개 이름이 없는 내부 요소라 **클래스로 찾는다** — 프로덕션 코드에 `data-testid` 를
 * 심지 않는다 (소비자 번들로 새는 테스트 전용 속성이 된다). `badgeClasses` 가 공개 계약이므로
 * 이 조회는 구현 세부에 기대지 않는다.
 */
const indicator = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`.${badgeClasses.indicator}`);

  if (!el) throw new Error('표시자가 렌더되지 않았습니다.');

  return el;
};

const queryIndicator = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.${badgeClasses.indicator}`);

const value = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`.${badgeClasses.value}`);

  if (!el) throw new Error('값 요소가 렌더되지 않았습니다.');

  return el;
};

describe('<Badge />', () => {
  const { render } = createRenderer();

  /**
   * `polymorphicProp` 은 제외한다 — Badge 는 `component` prop 을 열지 않는다. 루트는 위치
   * 기준(`position: relative`)을 만드는 래퍼일 뿐이고, 바꿀 이유가 생기면 그때 계약을 다시 본다.
   */
  describeConformance(<Badge count={1}>anchor</Badge>, () => ({
    render,
    classes: badgeClasses,
    refInstanceof: HTMLSpanElement,
    only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
  }));

  describe('루트', () => {
    it('span 래퍼로 앵커를 감싸고 기본 클래스를 유지한다', () => {
      const { container } = render(
        <Badge data-testid="badge" count={1}>
          anchor
        </Badge>,
      );

      expect(container.firstChild).toHaveProperty('nodeName', 'SPAN');
      expect(screen.getByTestId('badge')).toHaveClass(badgeClasses.root);
      expect(screen.getByTestId('badge')).toHaveTextContent('anchor');
    });

    it('ref 가 루트 래퍼를 가리킨다', () => {
      const ref = createRef<HTMLSpanElement>();

      render(
        <Badge ref={ref} data-testid="badge" count={1}>
          anchor
        </Badge>,
      );

      expect(ref.current).toBe(screen.getByTestId('badge'));
    });

    it('Badge 전용 prop 을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <Badge
          data-testid="badge"
          count={5}
          max={9}
          variant="count"
          size="sm"
          intent="error"
          placement="top-start"
          label="읽지 않음 5개"
        >
          anchor
        </Badge>,
      );

      const attributes = screen.getByTestId('badge').getAttributeNames();

      for (const own of ['count', 'max', 'variant', 'size', 'intent', 'placement', 'label']) {
        expect(attributes).not.toContain(own);
      }
    });

    /**
     * **기본값이 중립이어야 한다.** `role="status"` 는 live region 이라 값이 바뀔 때마다
     * 스크린리더가 말을 끊고 끼어든다. 알림 배지가 그것을 원하는지는 소비자가 정할 일이다.
     */
    it('role="status" 를 기본으로 붙이지 않는다', () => {
      render(
        <Badge data-testid="badge" count={3}>
          anchor
        </Badge>,
      );

      expect(screen.getByTestId('badge')).not.toHaveAttribute('role');
      expect(indicator()).not.toHaveAttribute('role', 'status');
      expect(screen.queryByRole('status')).toBeNull();
    });
  });

  describe('앵커 보존 (회귀 방지)', () => {
    it('자식의 role 과 접근 가능한 이름을 바꾸지 않는다', () => {
      render(
        <Badge count={3}>
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      // 래퍼가 감쌌어도 버튼은 그대로 버튼이고 이름도 그대로다.
      expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument();
    });

    it('자식이 계속 클릭을 받는다', async () => {
      const onClick = vi.fn();
      const { user } = render(
        <Badge count={3}>
          <IconButton aria-label="알림" onClick={onClick}>
            🔔
          </IconButton>
        </Badge>,
      );

      await user.click(screen.getByRole('button', { name: '알림' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('자식이 계속 포커스를 받는다 — 래퍼가 탭 순서를 가로채지 않는다', () => {
      render(
        <Badge data-testid="badge" count={3}>
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      const button = screen.getByRole('button', { name: '알림' });
      button.focus();

      expect(button).toHaveFocus();
      // 래퍼는 포커스 대상이 아니다.
      expect(screen.getByTestId('badge')).not.toHaveAttribute('tabindex');
    });

    /**
     * overlay 가 앵커 위에 절대 배치되므로 **포인터를 삼킬 수 있다.** 표시자는 CSS 로
     * `pointer-events: none` 을 갖는다 — 그 규칙이 컴파일된 CSS 에 있는지는
     * `forcedColors.test.ts` 가 아니라 여기서 보는 것이 맞지만, jsdom 은 specificity 를
     * 계산하지 않으므로 **선언 자체**를 인라인 스타일이 아닌 클래스로 확인한다.
     */
    it('표시자가 포인터를 가로채지 않는다', () => {
      render(
        <Badge count={3}>
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      // 클래스가 붙어 있어야 CSS 의 pointer-events 규칙이 적용된다.
      expect(indicator()).toHaveClass(badgeClasses.indicator);
      // 표시자 자체가 버튼을 품지 않는다 — 앵커와 형제다.
      expect(indicator().querySelector('button')).toBeNull();
    });

    it('표시자가 앵커의 형제다 — 앵커 안으로 들어가지 않는다', () => {
      render(
        <Badge count={3}>
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      const button = screen.getByRole('button', { name: '알림' });

      expect(button.contains(indicator())).toBe(false);
      expect(indicator().parentElement).toHaveClass(badgeClasses.root);
    });

    it('Badge 내부에 button·Pressable 대체물을 만들지 않는다', () => {
      render(<Badge count={3}>anchor</Badge>);

      // 앵커가 없어도 Badge 스스로는 어떤 상호작용 요소도 만들지 않는다.
      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  describe('count', () => {
    it('숫자를 표시자에 렌더한다', () => {
      render(<Badge count={3}>anchor</Badge>);

      expect(indicator()).toHaveTextContent('3');
    });

    it('count=0 을 렌더한다 — 0 을 미지정으로 취급하지 않는다', () => {
      render(<Badge count={0}>anchor</Badge>);

      expect(indicator()).toHaveTextContent('0');
    });

    it('content 가 count 를 이긴다', () => {
      render(
        <Badge count={3} content="NEW">
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveTextContent('NEW');
      expect(indicator()).not.toHaveTextContent('3');
    });

    it('count·content 둘 다 없으면 표시자를 내지 않는다', () => {
      render(<Badge>anchor</Badge>);

      expect(queryIndicator()).toBeNull();
    });
  });

  describe('max', () => {
    it('기본 max 는 99 다', () => {
      render(<Badge count={100}>anchor</Badge>);

      expect(indicator()).toHaveTextContent('99+');
    });

    it('count 가 max 이하면 그대로 보여 준다', () => {
      render(
        <Badge count={9} max={9}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveTextContent('9');
    });

    it('count 가 max 를 넘으면 {max}+ 로 줄인다', () => {
      render(
        <Badge count={10} max={9}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveTextContent('9+');
    });

    it('max 는 content 에 적용되지 않는다 — 숫자 규칙이다', () => {
      render(
        <Badge content="1000" max={9}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveTextContent('1000');
    });
  });

  describe('dot', () => {
    it('dot 은 내용을 렌더하지 않는다', () => {
      render(
        <Badge variant="dot" count={3}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveClass(badgeClasses.variantDot);
      expect(indicator()).toBeEmptyDOMElement();
    });

    it('dot 은 count 없이도 나타난다', () => {
      render(<Badge variant="dot">anchor</Badge>);

      expect(indicator()).toBeInTheDocument();
    });
  });

  describe('invisible', () => {
    it('표시자를 렌더하지 않는다 — 감추는 것이 아니라 내지 않는다', () => {
      render(
        <Badge count={3} invisible>
          anchor
        </Badge>,
      );

      // DOM 에 없으므로 AT 로도, 스타일로도 새지 않는다.
      expect(queryIndicator()).toBeNull();
      expect(screen.getByText('anchor')).toBeInTheDocument();
    });

    it('invisible 이어도 앵커는 그대로다', () => {
      render(
        <Badge count={3} invisible>
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument();
    });
  });

  describe('placement', () => {
    it('기본값은 top-end 다', () => {
      render(<Badge count={1}>anchor</Badge>);

      expect(indicator()).toHaveClass(badgeClasses.placementTopEnd);
    });

    it.each([
      ['top-end', badgeClasses.placementTopEnd],
      ['top-start', badgeClasses.placementTopStart],
      ['bottom-end', badgeClasses.placementBottomEnd],
      ['bottom-start', badgeClasses.placementBottomStart],
    ] as const)('placement=%s 에 %s 클래스를 준다', (placement, expected) => {
      render(
        <Badge count={1} placement={placement}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveClass(expected);
    });
  });

  describe('size', () => {
    it('기본값은 md 다', () => {
      render(<Badge count={1}>anchor</Badge>);

      expect(indicator()).toHaveClass(badgeClasses.sizeMd);
    });

    it.each([
      ['sm', badgeClasses.sizeSm],
      ['md', badgeClasses.sizeMd],
    ] as const)('size=%s 에 %s 클래스를 준다', (size, expected) => {
      render(
        <Badge count={1} size={size}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveClass(expected);
    });
  });

  describe('intent', () => {
    it('기본값은 error 다 — 알림 배지의 가장 흔한 쓰임이다', () => {
      render(<Badge count={1}>anchor</Badge>);

      expect(indicator()).toHaveClass(badgeClasses.intentError);
    });

    it.each([
      ['primary', badgeClasses.intentPrimary],
      ['secondary', badgeClasses.intentSecondary],
      ['error', badgeClasses.intentError],
      ['neutral', badgeClasses.intentNeutral],
    ] as const)('intent=%s 에 %s 클래스를 준다', (intent, expected) => {
      render(
        <Badge count={1} intent={intent}>
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveClass(expected);
    });
  });

  /**
   * 장식과 의미 있는 정보를 분리한다.
   *
   * `label` 이 유일한 "의미 있는 정보" 통로다. 이름을 **지어내지 않는다** — `99+` 를
   * "99개 이상" 으로 자동 번역하지도, count 로 문장을 만들지도 않는다 (Avatar 와 같은 원칙).
   */
  describe('접근성', () => {
    it('label 을 주면 표시자가 role="img" + aria-label 로 이름을 갖는다', () => {
      render(
        <Badge count={137} label="읽지 않은 알림 137개">
          anchor
        </Badge>,
      );

      const named = screen.getByRole('img', { name: '읽지 않은 알림 137개' });

      expect(named).toBe(indicator());
    });

    /**
     * **시각 축약과 낭독 내용이 갈리는 지점이다.** 화면은 `99+`, 스크린리더는 실제 수를 담은
     * `label` 을 읽는다 — "구십구 플러스" 는 정보가 아니다. 그래서 label 이 있으면 시각 글자를
     * 트리에서 감춰 중복·모호한 낭독을 막는다.
     */
    it('label 이 있으면 축약된 시각 글자를 트리에서 감춘다', () => {
      render(
        <Badge count={137} label="읽지 않은 알림 137개">
          anchor
        </Badge>,
      );

      expect(indicator()).toHaveTextContent('99+');
      expect(value()).toHaveAttribute('aria-hidden', 'true');
    });

    it('label 이 없는 count 는 보이는 글자가 그대로 읽힌다', () => {
      render(<Badge count={3}>anchor</Badge>);

      // 이름을 지어내지 않는다. 보이는 것이 읽히는 것이다.
      expect(indicator()).not.toHaveAttribute('role');
      expect(indicator()).not.toHaveAttribute('aria-label');
      expect(indicator()).not.toHaveAttribute('aria-hidden');
    });

    /**
     * 이름 없는 dot 은 **순수 장식**이다. 읽을 것이 없는데 트리에 남기면 스크린리더가
     * 빈 요소를 지나가며 잡음을 만든다. 색만으로 상태를 말하는 것도 막는다 — 의미가 있으면
     * `label` 을 주어야 한다.
     */
    it('label 없는 dot 은 접근성 트리에서 감춘다', () => {
      render(<Badge variant="dot">anchor</Badge>);

      expect(indicator()).toHaveAttribute('aria-hidden', 'true');
    });

    it('label 을 준 dot 은 이름을 갖는다 — 색이 유일한 통로가 아니다', () => {
      render(
        <Badge variant="dot" label="읽지 않은 알림 있음">
          anchor
        </Badge>,
      );

      expect(screen.getByRole('img', { name: '읽지 않은 알림 있음' })).toBe(indicator());
    });

    it('label 이 앵커의 이름을 덮지 않는다', () => {
      render(
        <Badge count={3} label="읽지 않은 알림 3개">
          <IconButton aria-label="알림">🔔</IconButton>
        </Badge>,
      );

      // 두 이름이 각자 남는다. 래퍼가 자식 이름을 재작성하지 않는다.
      expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: '읽지 않은 알림 3개' })).toBeInTheDocument();
    });
  });

  describe('공개 배럴', () => {
    it('컴포넌트와 클래스만 내보낸다', () => {
      expect(Object.keys(barrel).sort()).toEqual(['Badge', 'badgeClasses']);
    });
  });
});
