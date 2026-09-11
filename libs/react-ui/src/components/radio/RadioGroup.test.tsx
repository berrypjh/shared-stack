import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fireEvent, screen } from '@testing-library/react';
import { compile } from 'sass';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { FormControl } from '../form-control';
import { FormHelperText } from '../form-helper-text';

import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import { radioGroupClasses } from './RadioGroup.constants';

type ShippingProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  'aria-describedby'?: string;
};

const Shipping = (props: ShippingProps) => (
  <RadioGroup label="배송 방법" {...props}>
    <Radio value="standard">일반</Radio>
    <Radio value="express">빠른</Radio>
    <Radio value="pickup">방문</Radio>
  </RadioGroup>
);

const radio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name });
const radios = () => screen.getAllByRole<HTMLInputElement>('radio');

describe('<RadioGroup />', () => {
  const { render } = createRenderer();

  describeConformance(
    <RadioGroup aria-label="probe">
      <Radio value="a">A</Radio>
    </RadioGroup>,
    () => ({
      render,
      classes: radioGroupClasses,
      refInstanceof: HTMLFieldSetElement,
      only: ['rootClass', 'refForwarding', 'mergeClassName', 'propsSpread'],
    }),
  );

  describe('그룹과 이름', () => {
    it('fieldset 과 legend 로 그리고 legend 가 그룹 이름이 된다', () => {
      render(<Shipping />);
      const group = screen.getByRole('group', { name: '배송 방법' });

      expect(group.tagName).toBe('FIELDSET');
      expect(screen.getByText('배송 방법').tagName).toBe('LEGEND');
    });

    it('native fieldset 시맨틱에 ARIA 역할을 덧씌우지 않는다', () => {
      render(<Shipping />);

      expect(screen.getByRole('group', { name: '배송 방법' })).not.toHaveAttribute('role');
    });

    it('보이는 라벨이 없으면 legend 없이 aria 이름을 쓴다', () => {
      const { container } = render(
        <RadioGroup aria-label="크기">
          <Radio value="s">S</Radio>
        </RadioGroup>,
      );

      expect(screen.getByRole('group', { name: '크기' })).toBeInTheDocument();
      expect(container.querySelector('legend')).toBeNull();
    });

    it('이름 없이는 컴파일되지 않는다', () => {
      void (
        (
          // @ts-expect-error — 보이는 라벨도 aria 이름도 없다.
          <RadioGroup>
            <Radio value="s">S</Radio>
          </RadioGroup>
        )
      );
    });
  });

  describe('name', () => {
    it('준 name 을 모든 Radio 에 내려보낸다', () => {
      render(<Shipping name="ship" />);

      for (const input of radios()) expect(input).toHaveAttribute('name', 'ship');
    });

    it('name 이 없으면 그룹마다 다른 name 을 만들어 모두에게 준다', () => {
      render(
        <>
          <Shipping />
          <RadioGroup aria-label="크기">
            <Radio value="s">S</Radio>
          </RadioGroup>
        </>,
      );
      const [standard, express, pickup, size] = radios().map((input) => input.name);

      expect(standard).not.toBe('');
      expect(new Set([standard, express, pickup]).size).toBe(1);
      expect(size).not.toBe(standard);
    });
  });

  describe('uncontrolled — 선택은 브라우저가 가진다', () => {
    it('defaultValue 로 시작하고 누르면 하나만 선택되며 알린다', async () => {
      const onValueChange = vi.fn();
      const { user } = render(<Shipping defaultValue="standard" onValueChange={onValueChange} />);

      expect(radio('일반')).toBeChecked();
      await user.click(screen.getByText('빠른'));

      expect(radio('빠른')).toBeChecked();
      expect(radio('일반')).not.toBeChecked();
      expect(onValueChange).toHaveBeenCalledWith('express');
    });

    it('기본값이 없으면 아무것도 선택되지 않는다', () => {
      render(<Shipping />);

      for (const input of radios()) expect(input).not.toBeChecked();
    });

    it('form reset 은 defaultValue 로 되돌리고 FormData 는 선택 값을 싣는다', async () => {
      const { user } = render(
        <form data-testid="form">
          <Shipping name="ship" defaultValue="standard" />
        </form>,
      );
      const form = screen.getByTestId<HTMLFormElement>('form');

      await user.click(screen.getByText('방문'));
      expect(new FormData(form).get('ship')).toBe('pickup');

      form.reset();
      expect(radio('일반')).toBeChecked();
      expect(new FormData(form).get('ship')).toBe('standard');
    });
  });

  describe('controlled — 그룹 value 가 진실이다', () => {
    it('value 가 선택을 정하고 누르면 알리기만 한다', async () => {
      const onValueChange = vi.fn();
      const { user } = render(<Shipping value="standard" onValueChange={onValueChange} />);

      await user.click(screen.getByText('방문'));

      expect(onValueChange).toHaveBeenCalledWith('pickup');
      expect(radio('일반')).toBeChecked();
      expect(radio('방문')).not.toBeChecked();
    });

    it('value 갱신이 선택을 옮긴다', () => {
      const { setProps } = render(<Shipping value="standard" onValueChange={() => undefined} />);

      setProps({ value: 'pickup' });

      expect(radio('방문')).toBeChecked();
      expect(radio('일반')).not.toBeChecked();
    });

    it('Radio 자신의 onChange 도 그대로 불린다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <RadioGroup aria-label="크기" value="s" onValueChange={() => undefined}>
          <Radio value="s">S</Radio>
          <Radio value="m" onChange={onChange}>
            M
          </Radio>
        </RadioGroup>,
      );

      await user.click(screen.getByText('M'));

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled', () => {
    it('비활성 선택지는 고를 수 없다', async () => {
      const onValueChange = vi.fn();
      const { user } = render(
        <RadioGroup aria-label="크기" onValueChange={onValueChange}>
          <Radio value="s">S</Radio>
          <Radio value="m" disabled>
            M
          </Radio>
        </RadioGroup>,
      );

      await user.click(screen.getByText('M'));

      expect(radio('M')).toBeDisabled();
      expect(radio('M')).not.toBeChecked();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('그룹 disabled 는 native fieldset disabled 로 모든 선택지를 막는다', async () => {
      const onValueChange = vi.fn();
      const { user } = render(<Shipping disabled onValueChange={onValueChange} />);

      expect(screen.getByRole('group', { name: '배송 방법' })).toBeDisabled();
      await user.click(screen.getByText('빠른'));

      for (const input of radios()) expect(input).toBeDisabled();
      expect(radio('빠른')).not.toBeChecked();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('required·error', () => {
    it('required 는 모든 Radio 에 가서 선택 전까지 폼을 막는다', async () => {
      const { user } = render(
        <form data-testid="form">
          <Shipping required />
        </form>,
      );
      const form = screen.getByTestId<HTMLFormElement>('form');

      for (const input of radios()) expect(input).toBeRequired();
      expect(form.checkValidity()).toBe(false);

      await user.click(screen.getByText('일반'));
      expect(form.checkValidity()).toBe(true);
    });

    it('error 는 오류 표시를 각 선택지에 얹고 설명은 aria-describedby 로 잇는다', () => {
      render(
        <>
          <Shipping error aria-describedby="ship-error" />
          <p id="ship-error">배송 방법을 골라 주세요</p>
        </>,
      );
      const group = screen.getByRole('group', { name: '배송 방법' });

      expect(group).toHaveClass(radioGroupClasses.error);
      expect(group).toHaveAccessibleDescription('배송 방법을 골라 주세요');
      for (const input of radios()) expect(input).toHaveAttribute('data-invalid', 'true');
    });

    it('error 가 아니면 오류 표시를 달지 않는다', () => {
      render(<Shipping />);

      expect(screen.getByRole('group', { name: '배송 방법' })).not.toHaveClass(
        radioGroupClasses.error,
      );
      for (const input of radios()) expect(input).not.toHaveAttribute('data-invalid');
    });
  });

  describe('FormControl', () => {
    /**
     * RadioGroup 은 그 자체로 하나의 필드다. 그래서 Checkbox 와 달리 `required` 도 받는다 —
     * native radio 의 required 가 곧 "하나는 골라야 한다"라서 FormControl 의 뜻과 같다.
     */
    it('disabled·error·required 를 상속한다', () => {
      render(
        <FormControl disabled error required>
          <Shipping aria-describedby="ship-help" />
          <FormHelperText id="ship-help">필수 항목입니다</FormHelperText>
        </FormControl>,
      );
      const group = screen.getByRole('group', { name: '배송 방법' });

      expect(group).toBeDisabled();
      expect(group).toHaveClass(radioGroupClasses.error);
      for (const input of radios()) expect(input).toBeRequired();
    });

    it('명시 prop 이 FormControl 을 이긴다', () => {
      render(
        <FormControl disabled error required>
          <Shipping disabled={false} error={false} required={false} />
        </FormControl>,
      );

      expect(screen.getByRole('group', { name: '배송 방법' })).toBeEnabled();
      for (const input of radios()) expect(input).not.toBeRequired();
    });
  });

  describe('키보드는 브라우저가 소유한다', () => {
    it('방향키를 가로채지 않는다 — preventDefault 하지 않는다', () => {
      render(<Shipping defaultValue="standard" />);

      expect(fireEvent.keyDown(radio('일반'), { key: 'ArrowDown' })).toBe(true);
      expect(fireEvent.keyDown(radio('일반'), { key: ' ' })).toBe(true);
    });

    it('native 방향키 선택도 onValueChange 로 알린다 (user-event 모델)', async () => {
      const onValueChange = vi.fn();
      const { user } = render(<Shipping defaultValue="standard" onValueChange={onValueChange} />);

      radio('일반').focus();
      await user.keyboard('{ArrowDown}');

      expect(radio('빠른')).toBeChecked();
      expect(onValueChange).toHaveBeenCalledWith('express');
    });
  });
});

describe('radio-group.scss', () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const group = compile(path.join(dir, 'radio-group.scss')).css;
  const radioCss = compile(path.join(dir, 'radio.scss')).css;

  it('fieldset 기본 테두리·여백을 걷어내고 색은 토큰에서만 온다', () => {
    expect(group).toMatch(/border:\s*0/);
    expect(group).toMatch(/min-inline-size:\s*0/);
    expect(group).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('그룹 오류는 선택지 경계를 stroke.error 로 바꾸고 disabled 는 이긴다', () => {
    expect(radioCss).toMatch(
      /\[data-invalid=true\]:not\(:disabled\)\s*\{[^}]*var\(--ds-stroke-error\)/,
    );
  });
});
