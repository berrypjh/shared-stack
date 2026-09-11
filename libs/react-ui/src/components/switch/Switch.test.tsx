import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { act, createRef } from 'react';

import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { compile } from 'sass';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { FormControl } from '../form-control';

import { Switch } from './Switch';
import { switchClasses } from './Switch.constants';

/**
 * Switch 가 기대는 native `<input type="checkbox" role="switch">` 의 사실.
 *
 * role 만 switch 로 바꾸고 나머지(checked·Space·label 클릭·폼)는 native checkbox 가 소유한다.
 * 먼저 jsdom 이 그 조합을 모델링하는지 고정한다.
 */
describe('native switch 사실 (characterization)', () => {
  it('switch 역할로 드러나고 감싸는 label 이 이름이 된다', () => {
    rtlRender(
      <label>
        <input type="checkbox" role="switch" />
        알림 받기
      </label>,
    );

    expect(screen.getByRole('switch', { name: '알림 받기' })).not.toBeChecked();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('label 클릭과 Space 가 native 로 토글한다', async () => {
    rtlRender(
      <label>
        <input type="checkbox" role="switch" />
        알림 받기
      </label>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('알림 받기'));
    expect(screen.getByRole('switch')).toBeChecked();

    await user.keyboard(' ');
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('FormData·required·form reset 은 checkbox 그대로다', async () => {
    rtlRender(
      <form data-testid="form">
        <input type="checkbox" role="switch" name="alerts" value="on" aria-label="알림" required />
      </form>,
    );
    const form = screen.getByTestId<HTMLFormElement>('form');

    expect(form.checkValidity()).toBe(false);
    await userEvent.setup().click(screen.getByRole('switch'));
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get('alerts')).toBe('on');

    form.reset();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('dir=rtl 은 역할·상태·키보드를 바꾸지 않는다', async () => {
    rtlRender(
      <div dir="rtl">
        <input type="checkbox" role="switch" aria-label="알림" />
      </div>,
    );
    const user = userEvent.setup();

    await user.tab();
    await user.keyboard(' ');

    expect(screen.getByRole('switch', { name: '알림' })).toBeChecked();
  });

  it('서버 markup 은 role 과 checked 를 attribute 로 쓴다', () => {
    const markup = renderToString(<input type="checkbox" role="switch" defaultChecked readOnly />);

    expect(markup).toContain('role="switch"');
    expect(markup).toContain('checked=""');
  });
});

describe('<Switch />', () => {
  const { render } = createRenderer();

  const control = (name = 'probe') => screen.getByRole<HTMLInputElement>('switch', { name });

  // Checkbox 와 같은 배분이다: className 은 루트 label, 나머지 prop 과 ref 는 native input.
  describeConformance(<Switch aria-label="probe" />, () => ({
    render,
    classes: switchClasses,
    refInstanceof: HTMLInputElement,
    only: ['rootClass', 'refForwarding'],
  }));

  describe('구조', () => {
    it('label 루트 안에 role=switch 인 native checkbox 를 렌더한다', () => {
      render(<Switch>알림 받기</Switch>);

      expect(control('알림 받기')).toHaveAttribute('type', 'checkbox');
      expect(control('알림 받기')).toHaveAttribute('role', 'switch');
      expect(control('알림 받기')).toHaveClass(switchClasses.input);
      expect(control('알림 받기').closest('label')).toHaveClass(switchClasses.root);
      expect(screen.getByText('알림 받기')).toHaveClass(switchClasses.label);
      expect(screen.queryByRole('checkbox')).toBeNull();
    });

    it('이름에 상태 문자열을 붙이지 않는다 — 상태는 checked 가 전한다', () => {
      render(<Switch defaultChecked>알림 받기</Switch>);

      expect(control('알림 받기')).toHaveAccessibleName('알림 받기');
      expect(control('알림 받기')).toBeChecked();
    });

    it('보이는 라벨이 없으면 라벨 요소 없이 aria 이름을 쓴다', () => {
      const { container } = render(<Switch aria-label="probe" />);

      expect(container.querySelector(`.${switchClasses.label}`)).toBeNull();
      expect(control()).toHaveAccessibleName('probe');
    });

    it('type·role 은 Switch 가 소유한다', () => {
      render(<Switch aria-label="probe" {...({ type: 'radio', role: 'checkbox' } as object)} />);

      expect(control()).toHaveAttribute('type', 'checkbox');
      expect(control()).toHaveAttribute('role', 'switch');
    });

    it('className·style 은 루트로, 나머지 native prop 은 input 으로 간다', () => {
      render(
        <Switch
          aria-label="probe"
          className="extra"
          style={{ marginTop: 4 }}
          data-testid="probe"
        />,
      );

      expect(control().closest('label')).toHaveClass('extra');
      expect(control().closest('label')).toHaveStyle({ marginTop: '4px' });
      expect(screen.getByTestId('probe')).toBe(control());
    });

    it('ref 는 native input 을 가리킨다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Switch aria-label="probe" ref={ref} />);

      expect(ref.current).toBe(control());
    });

    it('이름 없이는 컴파일되지 않고 type·role 을 받지 않는다', () => {
      // @ts-expect-error — 보이는 라벨도 aria 이름도 없다.
      void (<Switch />);
      // @ts-expect-error — type 은 Switch 가 소유한다.
      void (<Switch aria-label="probe" type="radio" />);
      // @ts-expect-error — role 은 Switch 가 소유한다.
      void (<Switch aria-label="probe" role="checkbox" />);
      void (<Switch>알림 받기</Switch>);
    });
  });

  describe('값은 native 가 소유한다', () => {
    it('controlled 면 checked prop 이 진실이고 onChange 는 native 이벤트를 받는다', async () => {
      const onChange = vi.fn();
      const { user } = render(<Switch aria-label="probe" checked={false} onChange={onChange} />);

      await user.click(control());

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toBe(control());
      expect(control()).not.toBeChecked();
    });

    it('controlled prop 갱신이 반영된다', () => {
      const { setProps } = render(
        <Switch aria-label="probe" checked={false} onChange={() => undefined} />,
      );

      setProps({ checked: true });

      expect(control()).toBeChecked();
    });

    it('uncontrolled 면 defaultChecked 로 시작해 native 가 토글한다', async () => {
      const { user } = render(<Switch aria-label="probe" defaultChecked />);

      expect(control()).toBeChecked();
      await user.click(control());
      expect(control()).not.toBeChecked();
    });

    it('포커스를 받고 Space 로 토글된다', async () => {
      const { user } = render(<Switch aria-label="probe" />);

      await user.tab();
      expect(control()).toHaveFocus();
      await user.keyboard(' ');

      expect(control()).toBeChecked();
    });

    it('보이는 라벨을 누르면 토글된다', async () => {
      const { user } = render(<Switch>알림 받기</Switch>);

      await user.click(screen.getByText('알림 받기'));

      expect(control('알림 받기')).toBeChecked();
    });
  });

  describe('폼', () => {
    it('name·value·required·form 을 input 에 전달한다', () => {
      render(<Switch aria-label="probe" name="alerts" value="on" required form="settings" />);

      expect(control()).toHaveAttribute('name', 'alerts');
      expect(control()).toHaveAttribute('value', 'on');
      expect(control()).toBeRequired();
      expect(control()).toHaveAttribute('form', 'settings');
    });

    it('FormData 와 form reset 이 native 그대로 동작한다', async () => {
      const { user } = render(
        <form data-testid="form">
          <Switch name="alerts" value="on">
            알림 받기
          </Switch>
        </form>,
      );
      const form = screen.getByTestId<HTMLFormElement>('form');

      await user.click(screen.getByText('알림 받기'));
      expect(new FormData(form).get('alerts')).toBe('on');

      form.reset();
      expect(control('알림 받기')).not.toBeChecked();
      expect(new FormData(form).get('alerts')).toBeNull();
    });

    it('disabled 면 바뀌지 않고 onChange 도 부르지 않는다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <Switch disabled onChange={onChange}>
          알림 받기
        </Switch>,
      );

      await user.click(screen.getByText('알림 받기'));

      expect(control('알림 받기')).toBeDisabled();
      expect(control('알림 받기')).not.toBeChecked();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('aria-labelledby·aria-describedby 를 input 에 전달한다', () => {
      render(
        <>
          <span id="alerts-title">알림</span>
          <span id="alerts-help">새 댓글이 달리면 알려 줍니다</span>
          <Switch aria-labelledby="alerts-title" aria-describedby="alerts-help" />
        </>,
      );

      expect(control('알림')).toHaveAccessibleDescription('새 댓글이 달리면 알려 줍니다');
    });
  });

  describe('FormControl', () => {
    it('disabled 를 상속하고 명시 prop 이 이긴다', () => {
      render(
        <FormControl disabled>
          <Switch aria-label="inherits" />
          <Switch aria-label="explicit" disabled={false} />
        </FormControl>,
      );

      expect(control('inherits')).toBeDisabled();
      expect(control('explicit')).toBeEnabled();
    });

    it('required 는 상속하지 않는다 — Checkbox 와 같은 결정이다', () => {
      render(
        <FormControl required>
          <Switch aria-label="probe" />
        </FormControl>,
      );

      expect(control()).not.toBeRequired();
    });
  });

  describe('SSR', () => {
    it('hydration 이 경고 없이 끝나고 상태가 맞다', async () => {
      const ui = <Switch aria-label="probe" defaultChecked />;
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      let root: Root | undefined;

      expect(container.innerHTML).toContain('role="switch"');

      await act(async () => {
        root = hydrateRoot(container, ui);
      });

      expect(error).not.toHaveBeenCalled();
      expect(container.querySelector('input')?.checked).toBe(true);

      act(() => root?.unmount());
      error.mockRestore();
      container.remove();
    });
  });
});

/**
 * 스타일 계약 — 컴파일된 CSS 텍스트를 읽는다. 실제 브라우저에서의 thumb 위치(LTR/RTL)와
 * 포커스는 스토리 play 가 본다.
 */
describe('switch.scss', () => {
  const css = compile(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'switch.scss'),
  ).css.replaceAll(/\/\*[\s\S]*?\*\//g, '');

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

  it('상태를 native 선택자로만 표현한다 — JS 상태 클래스가 없다', () => {
    for (const selector of [':checked', ':disabled', ':focus-visible']) {
      expect(css).toContain(selector);
    }
    expect(css).not.toMatch(/\.ui-switch--(checked|on|off|disabled|focused)/);
  });

  it('선택 컨트롤 토큰의 트랙·면·표시자를 쓰고 색을 하드코딩하지 않는다', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/);
    for (const token of [
      '--ds-selection-control-track-off',
      '--ds-selection-control-checked',
      '--ds-selection-control-indicator',
      '--ds-background-disable',
      '--ds-border-primary-color',
    ]) {
      expect(css).toContain(`var(${token})`);
    }
  });

  it('thumb 이동은 논리 속성이다 — 물리 방향을 하드코딩하지 않는다 (RTL)', () => {
    expect(css).toMatch(/margin-inline-start/);
    expect(css).not.toMatch(/(^|[\s;{])(left|right|margin-left|margin-right):/);
    expect(css).not.toMatch(/translateX\(/);
  });

  it('reduced-motion 은 전환만 끄고 포커스 표시는 건드리지 않는다', () => {
    const reduced = mediaBody('(prefers-reduced-motion: reduce)');

    expect(reduced).toMatch(/transition:\s*none/);
    expect(reduced).not.toContain('outline');
  });
});
