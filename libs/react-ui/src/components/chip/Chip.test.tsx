/**
 * Chip 계약.
 *
 * 두 모드만 있다:
 *
 * 1. **passive** — `<span>`. 포커스 대상이 아니고 상태가 없다.
 * 2. **interactive** — `onClick` 을 주면 native `<button type="button">`. `selected` 를 함께
 *    주면 `aria-pressed` toggle 이 된다.
 *
 * `div role="button"` 으로 native button 을 재구현하지 않는다 — Enter/Space·disabled·폼 밖
 * 클릭 동작을 브라우저가 이미 옳게 한다.
 *
 * `selected`·`disabled` 는 타입 수준에서 **interactive 에만** 허용된다. 누를 수 없는 것에 선택
 * 시각을 주면 시맨틱 없는 상태가 되고, 그것이 이 컴포넌트에서 가장 쉽게 잘못되는 자리다.
 */
import { createRef } from 'react';

import { screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { applyComponentStyles } from '../../../test/componentStyles';

import { Chip } from './Chip';
import { chipClasses } from './Chip.constants';
import * as barrel from './index';

describe('<Chip />', () => {
  const { render } = createRenderer();

  describe('passive 모드', () => {
    /**
     * `refInstanceof` 가 `HTMLSpanElement` 다 — passive 루트는 span 이다. interactive 루트는
     * button 이라 아래에서 따로 본다. 한 conformance 호출로는 두 루트를 덮을 수 없다.
     */
    describeConformance(<Chip>태그</Chip>, () => ({
      render,
      classes: chipClasses,
      refInstanceof: HTMLSpanElement,
      only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
    }));

    it('span 으로 렌더한다 — button 이 아니다', () => {
      const { container } = render(<Chip>태그</Chip>);

      expect(container.firstChild).toHaveProperty('nodeName', 'SPAN');
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('포커스 대상이 아니다', () => {
      render(<Chip data-testid="chip">태그</Chip>);

      const chip = screen.getByTestId('chip');

      expect(chip).not.toHaveAttribute('tabindex');
      expect(chip).not.toHaveAttribute('aria-pressed');
      expect(chip).not.toHaveAttribute('aria-disabled');
    });

    it('라벨을 렌더한다', () => {
      render(<Chip>디자인 시스템</Chip>);

      expect(screen.getByText('디자인 시스템')).toBeInTheDocument();
    });

    it('interactive 클래스를 붙이지 않는다', () => {
      render(<Chip data-testid="chip">태그</Chip>);

      expect(screen.getByTestId('chip')).not.toHaveClass(chipClasses.interactive);
    });

    it('ref 가 루트 span 을 가리킨다', () => {
      const ref = createRef<HTMLSpanElement>();

      render(
        <Chip ref={ref} data-testid="chip">
          태그
        </Chip>,
      );

      expect(ref.current).toBe(screen.getByTestId('chip'));
    });
  });

  describe('interactive 모드', () => {
    describeConformance(<Chip onClick={() => undefined}>필터</Chip>, () => ({
      render,
      classes: chipClasses,
      refInstanceof: HTMLButtonElement,
      only: ['mergeClassName', 'propsSpread', 'refForwarding', 'rootClass'],
    }));

    it('native button 으로 렌더한다', () => {
      render(<Chip onClick={() => undefined}>필터</Chip>);

      const button = screen.getByRole('button', { name: '필터' });

      expect(button).toHaveProperty('nodeName', 'BUTTON');
      // 폼 안에서 submit 으로 동작하지 않아야 한다.
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass(chipClasses.interactive);
    });

    it('클릭을 전달한다', async () => {
      const onClick = vi.fn();
      const { user } = render(<Chip onClick={onClick}>필터</Chip>);

      await user.click(screen.getByRole('button', { name: '필터' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Enter 로 활성화된다 — native button 동작이다', async () => {
      const onClick = vi.fn();
      const { user } = render(<Chip onClick={onClick}>필터</Chip>);

      screen.getByRole('button').focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Space 로 활성화된다 — native button 동작이다', async () => {
      const onClick = vi.fn();
      const { user } = render(<Chip onClick={onClick}>필터</Chip>);

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('탭으로 포커스를 받는다', async () => {
      const { user } = render(<Chip onClick={() => undefined}>필터</Chip>);

      await user.tab();

      expect(screen.getByRole('button', { name: '필터' })).toHaveFocus();
    });

    it('ref 가 루트 button 을 가리킨다', () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <Chip ref={ref} onClick={() => undefined}>
          필터
        </Chip>,
      );

      expect(ref.current).toBe(screen.getByRole('button'));
    });

    it('Chip 전용 prop 을 DOM 속성으로 흘리지 않는다', () => {
      render(
        <Chip data-testid="chip" onClick={() => undefined} size="sm" variant="filled" selected>
          필터
        </Chip>,
      );

      const attributes = screen.getByTestId('chip').getAttributeNames();

      for (const own of ['size', 'variant', 'selected', 'leading']) {
        expect(attributes).not.toContain(own);
      }
    });

    it('중첩 상호작용 요소를 만들지 않는다', () => {
      render(
        <Chip onClick={() => undefined} leading={<span>◆</span>}>
          필터
        </Chip>,
      );

      // button 안에 button 이 생기면 키보드·스크린리더가 둘 다 깨진다.
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button').querySelectorAll('button')).toHaveLength(0);
    });
  });

  describe('selected (toggle)', () => {
    it('selected 를 주면 aria-pressed toggle 이 된다', () => {
      render(
        <Chip onClick={() => undefined} selected>
          필터
        </Chip>,
      );

      expect(screen.getByRole('button', { name: '필터', pressed: true })).toBeInTheDocument();
    });

    it('selected=false 도 aria-pressed 를 단다 — toggle 임을 알린다', () => {
      render(
        <Chip onClick={() => undefined} selected={false}>
          필터
        </Chip>,
      );

      expect(screen.getByRole('button', { name: '필터', pressed: false })).toBeInTheDocument();
    });

    /**
     * `selected` 를 주지 않으면 toggle 이 아니라 단순 action chip 이다. 없는 토글 시맨틱을
     * 지어내면 스크린리더가 "누름 안 됨" 을 읽어 상태가 있다고 오해하게 만든다.
     */
    it('selected 가 없으면 aria-pressed 를 달지 않는다', () => {
      render(<Chip onClick={() => undefined}>실행</Chip>);

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
    });

    it('selected 클래스가 시각 상태를 표시한다', () => {
      render(
        <Chip data-testid="chip" onClick={() => undefined} selected>
          필터
        </Chip>,
      );

      expect(screen.getByTestId('chip')).toHaveClass(chipClasses.selected);
    });
  });

  describe('disabled', () => {
    it('native disabled 를 단다', () => {
      render(
        <Chip onClick={() => undefined} disabled>
          필터
        </Chip>,
      );

      expect(screen.getByRole('button', { name: '필터' })).toBeDisabled();
    });

    it('클릭을 실제로 차단한다', async () => {
      const onClick = vi.fn();
      const { user } = render(
        <Chip onClick={onClick} disabled>
          필터
        </Chip>,
      );

      await user.click(screen.getByRole('button', { name: '필터' }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('키보드 활성화도 차단한다', async () => {
      const onClick = vi.fn();
      const { user } = render(
        <Chip onClick={onClick} disabled>
          필터
        </Chip>,
      );

      await user.tab();
      await user.keyboard('{Enter}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('탭 순서에서 빠진다 — native disabled 동작이다', async () => {
      const { user } = render(
        <>
          <Chip onClick={() => undefined} disabled>
            비활성
          </Chip>
          <button type="button">다음</button>
        </>,
      );

      await user.tab();

      expect(screen.getByRole('button', { name: '다음' })).toHaveFocus();
    });

    it('disabled 여도 selected 를 계속 알린다', () => {
      render(
        <Chip onClick={() => undefined} selected disabled>
          필터
        </Chip>,
      );

      const button = screen.getByRole('button', { name: '필터' });

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('size · variant', () => {
    it('기본값은 md · outlined 다', () => {
      render(<Chip data-testid="chip">태그</Chip>);

      const chip = screen.getByTestId('chip');

      expect(chip).toHaveClass(chipClasses.sizeMd);
      expect(chip).toHaveClass(chipClasses.variantOutlined);
    });

    it.each([
      ['sm', chipClasses.sizeSm],
      ['md', chipClasses.sizeMd],
    ] as const)('size=%s 에 %s 클래스를 준다', (size, expected) => {
      render(
        <Chip data-testid="chip" size={size}>
          태그
        </Chip>,
      );

      expect(screen.getByTestId('chip')).toHaveClass(expected);
    });

    it.each([
      ['outlined', chipClasses.variantOutlined],
      ['filled', chipClasses.variantFilled],
    ] as const)('variant=%s 에 %s 클래스를 준다', (variant, expected) => {
      render(
        <Chip data-testid="chip" variant={variant}>
          태그
        </Chip>,
      );

      expect(screen.getByTestId('chip')).toHaveClass(expected);
    });
  });

  describe('leading 슬롯', () => {
    it('라벨 앞에 렌더한다', () => {
      render(
        <Chip data-testid="chip" leading={<span data-testid="icon">◆</span>}>
          태그
        </Chip>,
      );

      const chip = screen.getByTestId('chip');
      const leading = screen.getByTestId('icon');

      expect(chip).toContainElement(leading);
      // DOM 순서가 곧 낭독 순서다. 비트마스크라 플래그만 확인한다.
      const position = leading.compareDocumentPosition(screen.getByText('태그'));

      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    /**
     * interactive 모드에서 접근 가능한 이름은 **내용에서 계산된다.** 글리프가 트리에 남으면
     * 이름이 "◆ 필터" 로 오염되므로 leading 슬롯은 `aria-hidden` 이다.
     */
    it('leading 이 접근 가능한 이름을 오염시키지 않는다', () => {
      render(
        <Chip onClick={() => undefined} leading={<span>◆</span>}>
          필터
        </Chip>,
      );

      expect(screen.getByRole('button', { name: '필터' })).toBeInTheDocument();
    });

    it('leading 이 없으면 슬롯을 렌더하지 않는다', () => {
      render(<Chip data-testid="chip">태그</Chip>);

      expect(screen.getByTestId('chip').querySelector(`.${chipClasses.leading}`)).toBeNull();
    });
  });

  /**
   * 상태 색이 서로 배타적인지 본다.
   *
   * jsdom 은 specificity 를 계산하지 않으므로 `getComputedStyle` 로 "이긴 색" 을 묻지 않는다.
   * 대신 **셀렉터 매칭**만 쓴다 — 상태 규칙이 배타적이면 어떤 조합에서도 매칭되는 규칙이
   * 정확히 하나이고, 그러면 결과가 선언 순서에 좌우되지 않는다 (`componentStyles` docstring).
   */
  describe('상태 규칙 배타성', () => {
    beforeAll(() => {
      applyComponentStyles('chip/chip.scss');
    });

    it('selected 와 평상시 규칙이 동시에 매칭되지 않는다', () => {
      render(
        <Chip data-testid="chip" onClick={() => undefined} selected>
          필터
        </Chip>,
      );

      const chip = screen.getByTestId('chip');

      expect(chip.matches(`.${chipClasses.selected}`)).toBe(true);
      // 평상시 면 규칙은 `:not(.is-selected)` 로 배제되어야 한다.
      expect(chip.matches(`.${chipClasses.interactive}:not(.${chipClasses.selected})`)).toBe(false);
    });
  });

  describe('공개 배럴', () => {
    it('컴포넌트와 클래스만 내보낸다', () => {
      expect(Object.keys(barrel).sort()).toEqual(['Chip', 'chipClasses']);
    });
  });
});
