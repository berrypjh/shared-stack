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

import { Checkbox } from './Checkbox';
import { checkboxClasses } from './Checkbox.constants';

/**
 * Checkbox 가 기대는 native `<input type="checkbox">` 의 사실.
 *
 * 컴포넌트는 이 동작을 JS 로 다시 만들지 않는다 — 그래서 먼저 테스트 환경(jsdom)이 이 사실을
 * 실제로 모델링하는지 고정한다. 여기서 깨지면 아래 컴포넌트 테스트의 근거가 사라진다.
 */
describe('native checkbox 사실 (characterization)', () => {
  it('indeterminate 는 attribute 가 아니라 DOM property 다', () => {
    const input = document.createElement('input');
    input.type = 'checkbox';

    input.indeterminate = true;

    expect(input.indeterminate).toBe(true);
    expect(input.hasAttribute('indeterminate')).toBe(false);
    expect(input.matches(':indeterminate')).toBe(true);
  });

  it('클릭하면 브라우저가 indeterminate 를 지우고 checked 를 뒤집는다', async () => {
    rtlRender(<input type="checkbox" aria-label="probe" />);
    const input = screen.getByRole<HTMLInputElement>('checkbox');
    input.indeterminate = true;

    await userEvent.setup().click(input);

    expect(input.indeterminate).toBe(false);
    expect(input.checked).toBe(true);
  });

  it('감싸는 label 을 클릭하면 토글되고 그 글자가 이름이 된다', async () => {
    rtlRender(
      <label>
        <input type="checkbox" />
        약관 동의
      </label>,
    );

    await userEvent.setup().click(screen.getByText('약관 동의'));

    expect(screen.getByRole('checkbox', { name: '약관 동의' })).toBeChecked();
  });

  it('disabled 면 label 클릭으로 바뀌지 않는다', async () => {
    rtlRender(
      <label>
        <input type="checkbox" disabled />
        약관 동의
      </label>,
    );

    await userEvent.setup().click(screen.getByText('약관 동의'));

    expect(screen.getByRole('checkbox', { name: '약관 동의' })).not.toBeChecked();
  });

  it('Space 로 토글된다', async () => {
    rtlRender(<input type="checkbox" aria-label="probe" />);
    const user = userEvent.setup();

    await user.tab();
    await user.keyboard(' ');

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('form reset 은 defaultChecked 로 되돌리고 FormData 는 checked 일 때만 값을 싣는다', async () => {
    rtlRender(
      <form data-testid="form">
        <input type="checkbox" name="terms" value="yes" aria-label="probe" />
      </form>,
    );
    const form = screen.getByTestId<HTMLFormElement>('form');

    expect(new FormData(form).get('terms')).toBeNull();

    await userEvent.setup().click(screen.getByRole('checkbox'));
    expect(new FormData(form).get('terms')).toBe('yes');

    form.reset();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('서버 markup 은 checked 를 attribute 로 쓴다', () => {
    const markup = renderToString(<input type="checkbox" defaultChecked readOnly />);

    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('checked=""');
  });
});

describe('<Checkbox />', () => {
  const { render } = createRenderer();

  const box = () => screen.getByRole<HTMLInputElement>('checkbox');

  // className 은 루트 label 로, 나머지 prop 과 ref 는 native input 으로 간다. 그래서
  // "className 과 data-* 가 같은 요소에 있다"를 전제하는 두 항목은 여기 해당하지 않는다.
  describeConformance(<Checkbox aria-label="probe" />, () => ({
    render,
    classes: checkboxClasses,
    refInstanceof: HTMLInputElement,
    only: ['rootClass', 'refForwarding'],
  }));

  describe('구조', () => {
    it('label 루트 안에 native checkbox 를 렌더한다', () => {
      render(<Checkbox>약관 동의</Checkbox>);

      expect(box().tagName).toBe('INPUT');
      expect(box()).toHaveAttribute('type', 'checkbox');
      expect(box()).toHaveClass(checkboxClasses.input);
      expect(box().closest('label')).toHaveClass(checkboxClasses.root);
      expect(screen.getByText('약관 동의')).toHaveClass(checkboxClasses.label);
    });

    it('보이는 라벨이 없으면 라벨 요소를 그리지 않고 aria 이름을 쓴다', () => {
      const { container } = render(<Checkbox aria-label="약관 동의" />);

      expect(container.querySelector(`.${checkboxClasses.label}`)).toBeNull();
      expect(box()).toHaveAccessibleName('약관 동의');
    });

    it('type 은 Checkbox 가 소유한다', () => {
      render(<Checkbox aria-label="probe" {...({ type: 'radio' } as object)} />);

      expect(box()).toHaveAttribute('type', 'checkbox');
    });

    it('className·style 은 루트로, 나머지 native prop 은 input 으로 간다', () => {
      render(
        <Checkbox
          aria-label="probe"
          className="extra"
          style={{ marginTop: 4 }}
          data-testid="probe"
          title="hint"
        />,
      );
      const root = box().closest('label');

      expect(root).toHaveClass('extra');
      expect(root).toHaveStyle({ marginTop: '4px' });
      expect(screen.getByTestId('probe')).toBe(box());
      expect(box()).toHaveAttribute('title', 'hint');
    });

    it('접근 가능한 이름 없이는 컴파일되지 않는다', () => {
      // @ts-expect-error — 보이는 라벨도 aria 이름도 없다.
      void (<Checkbox />);
      // @ts-expect-error — type 은 Checkbox 가 소유한다.
      void (<Checkbox aria-label="probe" type="radio" />);
      void (<Checkbox>약관 동의</Checkbox>);
      void (<Checkbox aria-labelledby="terms-title" />);
    });
  });

  describe('값은 native 가 소유한다', () => {
    it('controlled 면 checked prop 이 진실이고 onChange 는 native 이벤트를 받는다', async () => {
      const onChange = vi.fn();
      const { user } = render(<Checkbox aria-label="probe" checked={false} onChange={onChange} />);

      await user.click(box());

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toBe(box());
      expect(box()).not.toBeChecked();
    });

    it('controlled prop 갱신이 반영된다', () => {
      const { setProps } = render(
        <Checkbox aria-label="probe" checked={false} onChange={() => undefined} />,
      );

      setProps({ checked: true });

      expect(box()).toBeChecked();
    });

    it('uncontrolled 면 defaultChecked 로 시작해 native 가 토글한다', async () => {
      const { user } = render(<Checkbox aria-label="probe" defaultChecked />);

      expect(box()).toBeChecked();
      await user.click(box());
      expect(box()).not.toBeChecked();
    });

    it('Space 로 토글된다', async () => {
      const { user } = render(<Checkbox aria-label="probe" />);

      await user.tab();
      expect(box()).toHaveFocus();
      await user.keyboard(' ');

      expect(box()).toBeChecked();
    });
  });

  describe('폼', () => {
    it('name·value·required·form 을 input 에 전달한다', () => {
      render(<Checkbox aria-label="probe" name="terms" value="yes" required form="signup" />);

      expect(box()).toHaveAttribute('name', 'terms');
      expect(box()).toHaveAttribute('value', 'yes');
      expect(box()).toBeRequired();
      expect(box()).toHaveAttribute('form', 'signup');
    });

    it('FormData 와 form reset 이 native 그대로 동작한다', async () => {
      const { user } = render(
        <form data-testid="form">
          <Checkbox name="terms" value="yes">
            약관 동의
          </Checkbox>
        </form>,
      );
      const form = screen.getByTestId<HTMLFormElement>('form');

      await user.click(screen.getByText('약관 동의'));
      expect(new FormData(form).get('terms')).toBe('yes');

      form.reset();
      expect(box()).not.toBeChecked();
      expect(new FormData(form).get('terms')).toBeNull();
    });

    it('disabled 면 바뀌지 않고 onChange 도 부르지 않는다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <Checkbox disabled onChange={onChange}>
          약관 동의
        </Checkbox>,
      );

      await user.click(screen.getByText('약관 동의'));

      expect(box()).toBeDisabled();
      expect(box()).not.toBeChecked();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('라벨과 이름', () => {
    it('보이는 라벨을 누르면 토글되고 그 글자가 이름이 된다', async () => {
      const { user } = render(<Checkbox>약관 동의</Checkbox>);

      await user.click(screen.getByText('약관 동의'));

      expect(screen.getByRole('checkbox', { name: '약관 동의' })).toBeChecked();
    });

    it('aria-labelledby·aria-describedby 를 input 에 전달한다', () => {
      render(
        <>
          <span id="terms-title">약관</span>
          <span id="terms-help">필수 항목입니다</span>
          <Checkbox aria-labelledby="terms-title" aria-describedby="terms-help" />
        </>,
      );

      expect(box()).toHaveAccessibleName('약관');
      expect(box()).toHaveAccessibleDescription('필수 항목입니다');
    });
  });

  describe('error', () => {
    it('error 면 aria-invalid 를 말한다', () => {
      render(<Checkbox aria-label="probe" error />);

      expect(box()).toHaveAttribute('aria-invalid', 'true');
    });

    it('error 가 아니면 aria-invalid 를 달지 않는다', () => {
      render(<Checkbox aria-label="probe" />);

      expect(box()).not.toHaveAttribute('aria-invalid');
    });

    it('소비자 aria-invalid 가 이긴다', () => {
      render(<Checkbox aria-label="probe" error aria-invalid={false} />);

      expect(box()).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('FormControl', () => {
    it('disabled·error 를 상속한다', () => {
      render(
        <FormControl disabled error>
          <Checkbox aria-label="probe" />
        </FormControl>,
      );

      expect(box()).toBeDisabled();
      expect(box()).toHaveAttribute('aria-invalid', 'true');
    });

    it('명시 prop 이 FormControl 을 이긴다', () => {
      render(
        <FormControl disabled error>
          <Checkbox aria-label="probe" disabled={false} error={false} />
        </FormControl>,
      );

      expect(box()).toBeEnabled();
      expect(box()).not.toHaveAttribute('aria-invalid');
    });

    /**
     * 그룹의 "필수"는 적어도 하나를 고르라는 뜻이고, native `required` 는 이 체크박스 자체를
     * 체크하라는 뜻이다. 둘을 이어 붙이면 그룹 안의 모든 체크박스가 필수가 된다.
     */
    it('required 는 상속하지 않는다', () => {
      render(
        <FormControl required>
          <Checkbox aria-label="probe" />
        </FormControl>,
      );

      expect(box()).not.toBeRequired();
    });
  });

  describe('indeterminate', () => {
    it('DOM property 로 적용되고 attribute 는 생기지 않는다', () => {
      render(<Checkbox aria-label="probe" indeterminate />);

      expect(box().indeterminate).toBe(true);
      expect(box()).not.toHaveAttribute('indeterminate');
      expect(box()).toBePartiallyChecked();
    });

    it('prop 이 false 로 바뀌면 property 도 내려간다', () => {
      const { setProps } = render(<Checkbox aria-label="probe" indeterminate />);

      setProps({ indeterminate: false });

      expect(box().indeterminate).toBe(false);
    });

    it('prop 이 진실이다 — 클릭으로 지워져도 다시 렌더하면 되돌아온다', async () => {
      const { user, setProps } = render(<Checkbox aria-label="probe" indeterminate />);

      await user.click(box());
      expect(box().indeterminate).toBe(false);

      setProps({ title: 'rerender' });
      expect(box().indeterminate).toBe(true);
    });

    it('외부 object ref 와 callback ref 를 깨지 않는다', () => {
      const objectRef = createRef<HTMLInputElement>();
      const callbackRef = vi.fn();

      render(
        <>
          <Checkbox aria-label="object" indeterminate ref={objectRef} />
          <Checkbox aria-label="callback" ref={callbackRef} />
        </>,
      );

      expect(objectRef.current).toBe(screen.getByRole('checkbox', { name: 'object' }));
      expect(objectRef.current?.indeterminate).toBe(true);
      expect(callbackRef).toHaveBeenCalledWith(screen.getByRole('checkbox', { name: 'callback' }));
    });
  });

  describe('SSR', () => {
    it('서버 markup 에 가짜 indeterminate attribute 가 없다', () => {
      const markup = renderToString(<Checkbox aria-label="probe" indeterminate />);

      expect(markup).toContain('type="checkbox"');
      expect(markup).not.toContain('indeterminate');
    });

    it('hydration 이 경고 없이 끝나고 mount 뒤 property 가 맞다', async () => {
      const ui = <Checkbox aria-label="probe" indeterminate defaultChecked />;
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      let root: Root | undefined;

      await act(async () => {
        root = hydrateRoot(container, ui);
      });

      expect(error).not.toHaveBeenCalled();
      expect(container.querySelector('input')?.indeterminate).toBe(true);
      expect(container.querySelector('input')?.checked).toBe(true);

      act(() => root?.unmount());
      error.mockRestore();
      container.remove();
    });
  });
});

/**
 * 스타일 계약. jsdom 은 레이아웃·포커스 링을 그리지 않으므로 컴파일된 CSS 텍스트를 읽는다
 * (`forcedColors.test.ts`·`inputVariantStates.test.ts` 와 같은 방식). 실제 브라우저에서의
 * 포커스 표시는 스토리의 play 가 본다.
 */
describe('checkbox.scss', () => {
  const css = compile(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'checkbox.scss'),
  ).css.replaceAll(/\/\*[\s\S]*?\*\//g, '');

  /** `@media <query> { … }` 본문. 중괄호 깊이를 세어 잘라낸다. */
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
    for (const selector of [':checked', ':indeterminate', ':disabled', ':focus-visible']) {
      expect(css).toContain(selector);
    }
    expect(css).not.toMatch(/\.ui-checkbox--(checked|indeterminate|disabled|focused)/);
  });

  it('색은 토큰에서만 온다', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/);
    for (const token of [
      '--ds-selection-control-checked',
      '--ds-selection-control-indicator',
      '--ds-field-border',
      '--ds-stroke-error',
      '--ds-border-primary-color',
      '--ds-border-disabled-color',
      '--ds-background-disable',
    ]) {
      expect(css).toContain(`var(${token})`);
    }
  });

  it('hover 는 hover 가능한 포인터에서만 적용한다 — 터치에서 남지 않는다', () => {
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
