import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRef } from 'react';

import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { compile } from 'sass';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { Radio } from './Radio';
import { radioClasses } from './Radio.constants';

/**
 * Radio·RadioGroup 이 기대는 native `<input type="radio">`·`<fieldset>` 의 사실.
 *
 * 컴포넌트는 이 동작을 JS 로 다시 만들지 않는다. 먼저 jsdom 이 무엇을 모델링하는지 고정한다.
 * 방향키·Tab 그룹 정지는 user-event 가 재현하지만 그것은 브라우저가 아니다 — 실제 브라우저
 * 동작은 스토리 play 가 다시 본다.
 */
describe('native radio 사실 (characterization)', () => {
  const Group = ({ disabled = false }: { disabled?: boolean }) => (
    <form data-testid="form">
      <fieldset disabled={disabled}>
        <legend>배송 방법</legend>
        <label>
          <input type="radio" name="ship" value="standard" defaultChecked />
          일반
        </label>
        <label>
          <input type="radio" name="ship" value="express" />
          빠른
        </label>
        <label>
          <input type="radio" name="ship" value="pickup" />
          방문
        </label>
      </fieldset>
    </form>
  );

  const radio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name });

  it('legend 가 fieldset(group)의 이름이 된다', () => {
    rtlRender(<Group />);

    expect(screen.getByRole('group', { name: '배송 방법' })).toBeInTheDocument();
  });

  it('같은 name 끼리는 하나만 선택되고 label 클릭이 선택한다', async () => {
    rtlRender(<Group />);

    await userEvent.setup().click(screen.getByText('빠른'));

    expect(radio('빠른')).toBeChecked();
    expect(radio('일반')).not.toBeChecked();
  });

  it('FormData 는 선택된 값을 싣고 form reset 은 defaultChecked 로 되돌린다', async () => {
    rtlRender(<Group />);
    const form = screen.getByTestId<HTMLFormElement>('form');

    await userEvent.setup().click(radio('방문'));
    expect(new FormData(form).get('ship')).toBe('pickup');

    form.reset();
    expect(radio('일반')).toBeChecked();
    expect(new FormData(form).get('ship')).toBe('standard');
  });

  it('required 는 그룹 단위다 — 아무것도 선택하지 않으면 valueMissing', async () => {
    rtlRender(
      <form data-testid="form">
        <input type="radio" name="size" value="s" aria-label="S" required />
        <input type="radio" name="size" value="m" aria-label="M" />
      </form>,
    );
    const form = screen.getByTestId<HTMLFormElement>('form');

    expect(form.checkValidity()).toBe(false);
    expect(radio('M').validity.valueMissing).toBe(true);

    await userEvent.setup().click(radio('M'));
    expect(form.checkValidity()).toBe(true);
  });

  it('disabled fieldset 은 자손 radio 를 비활성으로 만든다', async () => {
    rtlRender(<Group disabled />);

    await userEvent.setup().click(screen.getByText('빠른'));

    expect(radio('빠른')).toBeDisabled();
    expect(radio('빠른')).not.toBeChecked();
  });

  it('focus 된 radio 를 Space 가 선택한다', async () => {
    rtlRender(<Group />);
    const user = userEvent.setup();

    radio('빠른').focus();
    await user.keyboard(' ');

    expect(radio('빠른')).toBeChecked();
  });

  it('ArrowDown 이 다음 radio 를 선택한다 (user-event 모델)', async () => {
    rtlRender(<Group />);
    const user = userEvent.setup();

    radio('일반').focus();
    await user.keyboard('{ArrowDown}');

    expect(radio('빠른')).toBeChecked();
    expect(radio('빠른')).toHaveFocus();
  });

  it('Tab 은 선택된 radio 에만 멈춘다 (user-event 모델)', async () => {
    rtlRender(
      <>
        <button type="button">before</button>
        <Group />
        <button type="button">after</button>
      </>,
    );
    const user = userEvent.setup();

    screen.getByRole('button', { name: 'before' }).focus();
    await user.tab();
    expect(radio('일반')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });
});

describe('<Radio />', () => {
  const { render } = createRenderer();

  const radio = (name = 'probe') => screen.getByRole<HTMLInputElement>('radio', { name });

  // Checkbox 와 같은 배분이다: className 은 루트 label, 나머지 prop 과 ref 는 native input.
  describeConformance(<Radio value="a" aria-label="probe" />, () => ({
    render,
    classes: radioClasses,
    refInstanceof: HTMLInputElement,
    only: ['rootClass', 'refForwarding'],
  }));

  describe('구조', () => {
    it('label 루트 안에 native radio 를 렌더한다', () => {
      render(<Radio value="standard">일반 배송</Radio>);

      expect(radio('일반 배송')).toHaveAttribute('type', 'radio');
      expect(radio('일반 배송')).toHaveClass(radioClasses.input);
      expect(radio('일반 배송').closest('label')).toHaveClass(radioClasses.root);
      expect(screen.getByText('일반 배송')).toHaveClass(radioClasses.label);
    });

    it('보이는 라벨이 없으면 라벨 요소 없이 aria 이름을 쓴다', () => {
      const { container } = render(<Radio value="a" aria-label="probe" />);

      expect(container.querySelector(`.${radioClasses.label}`)).toBeNull();
      expect(radio()).toHaveAccessibleName('probe');
    });

    it('type 은 Radio 가 소유한다', () => {
      render(<Radio value="a" aria-label="probe" {...({ type: 'checkbox' } as object)} />);

      expect(radio()).toHaveAttribute('type', 'radio');
    });

    it('className·style 은 루트로, 나머지 native prop 은 input 으로 간다', () => {
      render(
        <Radio
          value="a"
          aria-label="probe"
          className="extra"
          style={{ marginTop: 4 }}
          data-testid="probe"
        />,
      );

      expect(radio().closest('label')).toHaveClass('extra');
      expect(radio().closest('label')).toHaveStyle({ marginTop: '4px' });
      expect(screen.getByTestId('probe')).toBe(radio());
    });

    it('ref 는 native input 을 가리킨다', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Radio value="a" aria-label="probe" ref={ref} />);

      expect(ref.current).toBe(radio());
    });

    it('이름·value 없이는 컴파일되지 않는다', () => {
      // @ts-expect-error — 보이는 라벨도 aria 이름도 없다.
      void (<Radio value="a" />);
      // @ts-expect-error — value 는 필수다.
      void (<Radio aria-label="probe" />);
      // @ts-expect-error — type 은 Radio 가 소유한다.
      void (<Radio value="a" aria-label="probe" type="checkbox" />);
      void (<Radio value="a">일반</Radio>);
    });
  });

  describe('native 전달', () => {
    it('name·value·required·form·disabled 를 input 에 전달한다', () => {
      render(
        <Radio aria-label="probe" name="ship" value="express" required form="order" disabled />,
      );

      expect(radio()).toHaveAttribute('name', 'ship');
      expect(radio()).toHaveAttribute('value', 'express');
      expect(radio()).toBeRequired();
      expect(radio()).toHaveAttribute('form', 'order');
      expect(radio()).toBeDisabled();
    });

    it('aria-describedby 를 input 에 전달한다', () => {
      render(
        <>
          <span id="ship-help">1~2일 걸립니다</span>
          <Radio value="a" aria-label="probe" aria-describedby="ship-help" />
        </>,
      );

      expect(radio()).toHaveAccessibleDescription('1~2일 걸립니다');
    });

    it('controlled 면 checked prop 이 진실이고 onChange 는 native 이벤트를 받는다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <Radio value="a" aria-label="probe" checked={false} onChange={onChange} />,
      );

      await user.click(radio());

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toBe(radio());
      expect(radio()).not.toBeChecked();
    });

    it('uncontrolled 면 defaultChecked 로 시작한다', () => {
      render(<Radio value="a" aria-label="probe" defaultChecked />);

      expect(radio()).toBeChecked();
    });

    it('보이는 라벨을 누르면 선택되고, 다시 눌러도 해제되지 않는다', async () => {
      const { user } = render(<Radio value="a">일반</Radio>);

      await user.click(screen.getByText('일반'));
      await user.click(screen.getByText('일반'));

      expect(radio('일반')).toBeChecked();
    });

    it('같은 name 의 Radio 끼리 FormData·form reset 이 native 그대로 동작한다', async () => {
      const { user } = render(
        <form data-testid="form">
          <Radio name="ship" value="standard" defaultChecked>
            일반
          </Radio>
          <Radio name="ship" value="express">
            빠른
          </Radio>
        </form>,
      );
      const form = screen.getByTestId<HTMLFormElement>('form');

      await user.click(screen.getByText('빠른'));
      expect(new FormData(form).get('ship')).toBe('express');
      expect(radio('일반')).not.toBeChecked();

      form.reset();
      expect(radio('일반')).toBeChecked();
    });
  });
});

/**
 * 스타일 계약 — Checkbox 와 같은 방식으로 컴파일된 CSS 텍스트를 읽는다.
 * 실제 브라우저에서의 포커스·방향키는 스토리 play 가 본다.
 */
describe('radio.scss', () => {
  const css = compile(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'radio.scss'),
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
    expect(css).not.toMatch(/\.ui-radio--(checked|disabled|focused)/);
  });

  it('Checkbox 와 같은 선택 컨트롤 토큰을 쓰고 모양만 둥글다', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/);
    for (const token of [
      '--ds-selection-control-checked',
      '--ds-selection-control-indicator',
      '--ds-field-border',
      '--ds-border-primary-color',
      '--ds-border-disabled-color',
      '--ds-background-disable',
      '--ds-radius-rounded',
    ]) {
      expect(css).toContain(`var(${token})`);
    }
  });

  it('hover 는 hover 가능한 포인터에서만 적용한다', () => {
    const hover = mediaBody('(hover: hover)');

    expect(hover).toContain(':hover');
    expect(css.replace(hover, '')).not.toContain(':hover');
  });

  it('reduced-motion 은 전환만 끄고 포커스 표시는 건드리지 않는다', () => {
    const reduced = mediaBody('(prefers-reduced-motion: reduce)');

    expect(reduced).toMatch(/transition:\s*none/);
    expect(reduced).not.toContain('outline');
  });
});
