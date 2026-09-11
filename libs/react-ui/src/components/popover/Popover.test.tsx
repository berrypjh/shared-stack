import { useState } from 'react';

import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer } from '../../../test';

import { Popover } from './Popover';
import { popoverClasses } from './Popover.constants';
import { PopoverPanel } from './PopoverPanel';
import { PopoverTrigger } from './PopoverTrigger';

/** 기본 패널 질의. 기본 시맨틱에는 role 이 없어서 testid 로 찾는다. */
const panel = () => screen.queryByTestId('panel');

describe('<Popover />', () => {
  const { render } = createRenderer();

  describe('trigger', () => {
    it('열림 상태를 aria-expanded 로 알려야 한다', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('자식이 단일 element가 아니면 throw해야 한다', () => {
      const originalError = console.error;
      console.error = vi.fn();
      expect(() =>
        render(
          <Popover>
            <PopoverTrigger>{'text' as unknown as React.ReactElement}</PopoverTrigger>
          </Popover>,
        ),
      ).toThrow(/single React element child/);
      console.error = originalError;
    });

    it('컨슈머의 ref와 트리거 ref가 함께 채워져야 한다', () => {
      const consumerRef = { current: null as HTMLButtonElement | null };
      const Harness = () => (
        <Popover>
          <PopoverTrigger>
            <button ref={consumerRef as unknown as React.Ref<HTMLButtonElement>} type="button">
              Open
            </button>
          </PopoverTrigger>
        </Popover>
      );

      render(<Harness />);

      expect(consumerRef.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('컨슈머가 준 id 를 덮어쓰지 않아야 한다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button" id="my-trigger">
              Open
            </button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('id', 'my-trigger');
    });
  });

  /**
   * 트리거의 `aria-haspopup` 과 패널의 `role` 은 **하나의 출처**에서 나와야 한다.
   * 예전에는 둘이 각자 기본값(`'dialog'` / `asDialog=true`)을 가져서 라이브러리 기본값만으로도
   * 서로 어긋날 수 있었다.
   */
  describe('시맨틱 (semantics)', () => {
    it('기본은 disclosure — 트리거에 aria-haspopup 이 없고 패널에 role 이 없다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      // `aria-haspopup="true"` 는 ARIA 에서 menu 와 같은 뜻이라 generic disclosure 에 쓰면
      // 거짓말이 된다. disclosure 는 aria-expanded 만으로 표현한다.
      expect(screen.getByRole('button', { name: 'Open' })).not.toHaveAttribute('aria-haspopup');
      expect(panel()).not.toHaveAttribute('role');
    });

    it('semantics="dialog" 면 트리거와 패널이 함께 dialog 가 된다', () => {
      render(
        <Popover defaultOpen semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-label="Panel" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute(
        'aria-haspopup',
        'dialog',
      );
      expect(screen.getByRole('dialog')).toBe(panel());
    });

    it('컨슈머의 aria-haspopup 은 여전히 우선한다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button" aria-haspopup="menu">
              Open
            </button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('dialog 모드에서 접근 가능한 이름을 그대로 전달해야 한다', () => {
      render(
        <Popover defaultOpen semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-labelledby="title" data-testid="panel">
            <h2 id="title">제목</h2>
          </PopoverPanel>
        </Popover>,
      );

      expect(screen.getByRole('dialog', { name: '제목' })).toBeInTheDocument();
    });

    it('deprecated asDialog 는 계속 role="dialog" 를 적용해야 한다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel asDialog aria-label="Legacy" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(panel()).toHaveAttribute('role', 'dialog');
    });

    it('deprecated asDialog={false} 는 semantics="dialog" 를 무를 수 있어야 한다', () => {
      render(
        <Popover defaultOpen semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel asDialog={false} data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(panel()).not.toHaveAttribute('role');
    });
  });

  describe('open state', () => {
    it('uncontrolled: defaultOpen이면 panel을 즉시 렌더링해야 한다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(panel()).toHaveClass(popoverClasses.panel);
      expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('uncontrolled: 트리거 클릭으로 토글되어야 한다', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);
      expect(panel()).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await user.click(trigger);
      expect(panel()).not.toBeInTheDocument();
    });

    it('controlled: open prop으로 열림 상태를 강제해야 한다', () => {
      const { setProps } = render(
        <Popover open={false}>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(panel()).not.toBeInTheDocument();

      setProps({ open: true });

      expect(panel()).toBeInTheDocument();
    });

    it('controlled: 클릭 시 onOpenChange가 호출되어야 한다', async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <Popover open={false} onOpenChange={onOpenChange}>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  /**
   * 트리거는 컨슈머의 핸들러를 **먼저** 부르고 `defaultPrevented` 를 존중한다.
   * 이 순서가 컨슈머가 토글을 취소할 수 있는 유일한 수단이라 계약이다.
   */
  describe('trigger 이벤트 합성', () => {
    it('컨슈머 onClick 이 내부 토글보다 먼저 실행되어야 한다', async () => {
      const order: string[] = [];
      const { user } = render(
        <Popover onOpenChange={() => order.push('toggle')}>
          <PopoverTrigger>
            <button type="button" onClick={() => order.push('consumer')}>
              Open
            </button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(order).toEqual(['consumer', 'toggle']);
      expect(panel()).toBeInTheDocument();
    });

    it('컨슈머가 preventDefault 하면 토글되지 않아야 한다', async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <Popover onOpenChange={onOpenChange}>
          <PopoverTrigger>
            <button type="button" onClick={(event) => event.preventDefault()}>
              Open
            </button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(panel()).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  /**
   * `useId` 로 만든 id 는 인스턴스마다 달라야 하고 리렌더를 건너 살아남아야 한다.
   * 둘 중 하나라도 깨지면 `aria-controls` 가 엉뚱한 패널을 가리킨다.
   */
  describe('id 생성', () => {
    const TwoPopovers = () => (
      <>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">A</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel-a">A</PopoverPanel>
        </Popover>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">B</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel-b">B</PopoverPanel>
        </Popover>
      </>
    );

    it('인스턴스마다 trigger/panel id 가 달라야 한다', () => {
      render(<TwoPopovers />);

      const triggerA = screen.getByRole('button', { name: 'A' });
      const triggerB = screen.getByRole('button', { name: 'B' });

      expect(triggerA.id).not.toBe(triggerB.id);
      expect(screen.getByTestId('panel-a').id).not.toBe(screen.getByTestId('panel-b').id);
    });

    it('aria-controls 가 같은 인스턴스의 panel id 를 가리켜야 한다', () => {
      render(<TwoPopovers />);

      expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute(
        'aria-controls',
        screen.getByTestId('panel-a').id,
      );
      expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute(
        'aria-controls',
        screen.getByTestId('panel-b').id,
      );
    });

    it('리렌더를 건너 id 가 유지되어야 한다', () => {
      const { setProps } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      const panelId = panel()?.id;
      const triggerId = screen.getByRole('button', { name: 'Open' }).id;

      setProps({ onOpenChange: () => undefined });

      expect(panel()?.id).toBe(panelId);
      expect(screen.getByRole('button', { name: 'Open' }).id).toBe(triggerId);
    });
  });

  describe('panel', () => {
    it('open=false면 렌더링되지 않아야 한다', () => {
      render(
        <Popover>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(panel()).not.toBeInTheDocument();
    });

    it('className을 root에 병합해야 한다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel className="custom-panel" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(panel()).toHaveClass(popoverClasses.panel);
      expect(panel()).toHaveClass('custom-panel');
    });

    it('컨슈머 role 을 disclosure 모드에서 그대로 쓴다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel role="note" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(panel()).toHaveAttribute('role', 'note');
    });

    it('컨슈머 id 는 panelId 로 덮어써진다', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel id="mine" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      // aria-controls 가 반드시 이 id 를 가리켜야 해서 컴포넌트가 소유한다.
      expect(panel()?.id).not.toBe('mine');
      expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute(
        'aria-controls',
        panel()?.id,
      );
    });

    it('unmount 시 document 리스너를 모두 해제해야 한다', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      const registered = add.mock.calls.filter(
        ([type]) => type === 'mousedown' || type === 'keydown',
      );

      unmount();

      const released = remove.mock.calls.filter(
        ([type]) => type === 'mousedown' || type === 'keydown',
      );

      expect(registered.length).toBeGreaterThan(0);
      expect(released).toHaveLength(registered.length);

      add.mockRestore();
      remove.mockRestore();
    });
  });

  describe('dismiss', () => {
    it('panel 바깥 클릭 시 닫혀야 한다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
          <button type="button">Outside</button>
        </Popover>,
      );

      expect(panel()).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Outside' }));

      expect(panel()).not.toBeInTheDocument();
    });

    it('Escape 키로 닫혀야 한다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      expect(panel()).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(panel()).not.toBeInTheDocument();
    });

    it('panel 내부 클릭으로는 닫히지 않아야 한다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Inside' }));

      expect(panel()).toBeInTheDocument();
    });

    it('controlled 에서 Escape 는 onOpenChange(false) 만 보고해야 한다', async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <Popover open onOpenChange={onOpenChange}>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(panel()).toBeInTheDocument();
    });
  });

  /**
   * 포커스 수명주기. 단 하나의 규칙으로 정리한다:
   *
   * **닫힐 때 포커스가 패널 안에 있었다면 트리거로 되돌리고, 아니면 건드리지 않는다.**
   *
   * 이 규칙 하나가 네 경우를 모두 덮는다 — Escape(패널 안이면 복원), 트리거 클릭(이미
   * 트리거에 있으니 그대로), 바깥 클릭(사용자가 고른 컨트롤을 빼앗지 않음), 컨트롤드 외부
   * 종료(패널 안이면 복원). 정책 표도 오버레이 스택도 필요 없다.
   */
  describe('포커스 수명주기', () => {
    it('disclosure 는 열려도 포커스를 옮기지 않는다', async () => {
      const { user } = render(
        <Popover>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
        </Popover>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      expect(panel()).toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('패널 밖으로 Tab 해도 닫히지 않는다 (non-modal, 트랩 없음)', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
          <button type="button">After</button>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      await user.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(panel()).toBeInTheDocument();
    });

    it('Shift+Tab 으로 패널을 거슬러 나갈 수 있다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      await user.tab({ shift: true });

      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
      expect(panel()).toBeInTheDocument();
    });

    it('Escape 로 닫을 때 패널 안의 포커스를 트리거로 되돌려야 한다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      await user.keyboard('{Escape}');

      expect(panel()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    it('트리거에 포커스가 있을 때 Escape 는 포커스를 그대로 둔다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">Content</PopoverPanel>
        </Popover>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      trigger.focus();

      await user.keyboard('{Escape}');

      expect(panel()).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('바깥 클릭으로 닫힐 때 포커스를 빼앗지 않아야 한다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
          <button type="button">Outside</button>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      await user.click(screen.getByRole('button', { name: 'Outside' }));

      expect(panel()).not.toBeInTheDocument();
      // 사용자가 의도적으로 고른 컨트롤이다. 트리거로 되돌리면 그 의도를 뒤엎는다.
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
    });

    it('controlled 외부 종료에서도 패널 안의 포커스를 되돌려야 한다', () => {
      // 바깥 포인터가 아니라 컨슈머가 프로그래매틱하게 닫는 경우다. 포커스가 패널 안에서
      // 파괴되므로 되돌려야 한다.
      const { setProps } = render(
        <Popover open>
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      setProps({ open: false });

      expect(panel()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    it('트리거가 먼저 사라지면 분리된 노드에 focus 하지 않아야 한다', async () => {
      const Harness = () => {
        const [showTrigger, setShowTrigger] = useState(true);
        return (
          <Popover defaultOpen>
            {showTrigger ? (
              <PopoverTrigger>
                <button type="button">Open</button>
              </PopoverTrigger>
            ) : null}
            <PopoverPanel data-testid="panel">
              <button type="button" onClick={() => setShowTrigger(false)}>
                Inside
              </button>
            </PopoverPanel>
          </Popover>
        );
      };

      const { user } = render(<Harness />);

      const inside = screen.getByRole('button', { name: 'Inside' });
      inside.focus();
      await user.click(inside);

      expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();

      // 트리거가 없는 채로 닫아도 throw 하지 않아야 한다.
      await user.keyboard('{Escape}');

      expect(panel()).not.toBeInTheDocument();
    });

    it('dialog 모드는 패널 안 첫 포커스 가능 요소로 진입한다', async () => {
      const { user } = render(
        <Popover semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-label="Panel" data-testid="panel">
            <button type="button">First</button>
            <button type="button">Second</button>
          </PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    });

    it('dialog 모드에 포커스 가능한 내용이 없으면 패널 자신이 받는다', async () => {
      const { user } = render(
        <Popover semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-label="Panel" data-testid="panel">
            읽기 전용 내용
          </PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(panel()).toHaveFocus();
      expect(panel()).toHaveAttribute('tabindex', '-1');
    });

    it('dialog 모드도 Tab 을 가두지 않는다', async () => {
      const { user } = render(
        <Popover defaultOpen semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-label="Panel" data-testid="panel">
            <button type="button">Inside</button>
          </PopoverPanel>
          <button type="button">After</button>
        </Popover>,
      );

      screen.getByRole('button', { name: 'Inside' }).focus();

      await user.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(panel()).toBeInTheDocument();
    });

    it('modal 이 아니므로 aria-modal 을 붙이지 않는다', () => {
      render(
        <Popover defaultOpen semantics="dialog">
          <PopoverTrigger>
            <button type="button">Open</button>
          </PopoverTrigger>
          <PopoverPanel aria-label="Panel" data-testid="panel">
            Content
          </PopoverPanel>
        </Popover>,
      );

      expect(panel()).not.toHaveAttribute('aria-modal');
    });
  });

  /**
   * 여러 인스턴스. 한 번의 상호작용이 **무관한** 팝업의 상태를 바꾸면 안 된다.
   *
   * 전역 오버레이 스택 없이 로컬 규칙 둘로 푼다 — (1) 내 패널 안에 열린 패널이 또 있으면
   * 안쪽에게 양보한다, (2) 포커스가 **다른** 패널 안에 있으면 그쪽이 주인이다.
   * 어느 패널도 포커스를 갖지 않은 경우에만 열린 팝업이 함께 닫힌다(light-dismiss).
   */
  describe('다중 / 중첩', () => {
    const Nested = () => (
      <Popover defaultOpen>
        <PopoverTrigger>
          <button type="button">Outer</button>
        </PopoverTrigger>
        <PopoverPanel data-testid="outer">
          <Popover defaultOpen>
            <PopoverTrigger>
              <button type="button">Inner</button>
            </PopoverTrigger>
            <PopoverPanel data-testid="inner">
              <button type="button">InnerContent</button>
            </PopoverPanel>
          </Popover>
        </PopoverPanel>
      </Popover>
    );

    it('중첩: Escape 는 안쪽만 닫아야 한다', async () => {
      const { user } = render(<Nested />);

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      expect(screen.getByTestId('outer')).toBeInTheDocument();
    });

    it('중첩: 안쪽에 포커스가 있어도 안쪽만 닫는다', async () => {
      const { user } = render(<Nested />);

      screen.getByRole('button', { name: 'InnerContent' }).focus();

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inner' })).toHaveFocus();
    });

    const Siblings = () => (
      <>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">A</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel-a">
            <button type="button">InsideA</button>
          </PopoverPanel>
        </Popover>
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">B</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="panel-b">
            <button type="button">InsideB</button>
          </PopoverPanel>
        </Popover>
      </>
    );

    /**
     * 중첩에서 가장 흔한 포커스 위치는 **안쪽 트리거**다 — 방금 그것을 눌러 안쪽을 열었기
     * 때문이다. 그 트리거는 바깥 패널 **안**에 있고 안쪽 패널 **밖**에 있어서, 패널 포함
     * 여부만 보면 어느 쪽도 자기 것이라고 판단하지 못한다.
     */
    it('중첩: 안쪽 트리거에 포커스가 있으면 안쪽만 닫는다', async () => {
      const { user } = render(<Nested />);

      screen.getByRole('button', { name: 'Inner' }).focus();

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      expect(screen.getByTestId('outer')).toBeInTheDocument();
    });

    it('중첩: 바깥 트리거에 포커스가 있으면 바깥이 닫힌다', async () => {
      const { user } = render(<Nested />);

      screen.getByRole('button', { name: 'Outer' }).focus();

      await user.keyboard('{Escape}');

      // 포커스를 가진 쪽이 닫힌다. 안쪽은 바깥과 함께 사라진다.
      expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
    });

    it('형제: 포커스를 가진 쪽만 Escape 로 닫힌다', async () => {
      const { user } = render(<Siblings />);

      screen.getByRole('button', { name: 'InsideA' }).focus();

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('panel-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('panel-b')).toBeInTheDocument();
    });

    it('형제: 트리거에 포커스가 있으면 그쪽만 닫힌다', async () => {
      const { user } = render(<Siblings />);

      screen.getByRole('button', { name: 'A' }).focus();

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('panel-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('panel-b')).toBeInTheDocument();
    });

    /**
     * Escape 의 주인은 **이벤트가 어디서 났는지**로 정해진다 — `document.activeElement` 를
     * 묻지 않는다. 아래 둘은 user-event 의 포커스 해석을 변수에서 빼고 DOM 이벤트를 직접
     * 쏴서 그 메커니즘 자체를 고정한다. 예전 구현은 포커스를 추론했고, 그 추론이 jsdom 과
     * 실제 브라우저에서 갈려 중첩에서 아무것도 닫히지 않았다.
     */
    it('중첩: 안쪽 트리거에서 난 Escape 는 버블링으로 안쪽만 닫는다', () => {
      render(<Nested />);

      act(() => {
        screen
          .getByRole('button', { name: 'Inner' })
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      expect(screen.getByTestId('outer')).toBeInTheDocument();
    });

    it('팝업 안에서 난 Escape 는 document 까지 올라가지 않는다', () => {
      render(<Nested />);

      const reachedDocument = vi.fn();
      document.addEventListener('keydown', reachedDocument);

      act(() => {
        screen
          .getByRole('button', { name: 'Inner' })
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      document.removeEventListener('keydown', reachedDocument);

      // 막지 않으면 무관한 형제 팝업까지 같은 Escape 로 닫힌다.
      expect(reachedDocument).not.toHaveBeenCalled();
    });

    it('형제: 어느 쪽도 포커스가 없으면 light-dismiss 로 함께 닫힌다', async () => {
      const { user } = render(<Siblings />);

      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('panel-a')).not.toBeInTheDocument();
      expect(screen.queryByTestId('panel-b')).not.toBeInTheDocument();
    });

    it('중첩: 바깥 패널 안을 클릭하면 안쪽만 닫힌다', async () => {
      const { user } = render(
        <Popover defaultOpen>
          <PopoverTrigger>
            <button type="button">Outer</button>
          </PopoverTrigger>
          <PopoverPanel data-testid="outer">
            <button type="button">OuterContent</button>
            <Popover defaultOpen>
              <PopoverTrigger>
                <button type="button">Inner</button>
              </PopoverTrigger>
              <PopoverPanel data-testid="inner">inner</PopoverPanel>
            </Popover>
          </PopoverPanel>
        </Popover>,
      );

      await user.click(screen.getByRole('button', { name: 'OuterContent' }));

      expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      expect(screen.getByTestId('outer')).toBeInTheDocument();
    });
  });

  describe('context guard', () => {
    it('Popover 바깥의 PopoverTrigger는 throw해야 한다', () => {
      const originalError = console.error;
      console.error = vi.fn();
      const Standalone = () => (
        <PopoverTrigger>
          <button type="button">Open</button>
        </PopoverTrigger>
      );
      expect(() => render(<Standalone />)).toThrow(/within <Popover>/);
      console.error = originalError;
    });
  });
});
