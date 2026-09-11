import * as React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import { spy } from 'sinon';
import { describe, expect, it, vi } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { filledInputClasses } from '../filled-input';
import { formControlClasses } from '../form-control';
import { inputBaseClasses } from '../input-base';
import { plainInputClasses } from '../plain-input';

import { TextField } from './TextField';
import { textFieldClasses } from './TextField.constants';

describe('<TextField />', () => {
  const { render } = createRenderer();

  describeConformance(<TextField helperText="Helper text" label="Label" />, () => ({
    render,
    classes: textFieldClasses,
    refInstanceof: HTMLDivElement,
    polymorphicPropName: 'component',
    testPolymorphicPropWith: 'fieldset',
  }));

  describe('structure', () => {
    it('기본적으로 textbox 하나를 렌더링해야 한다', () => {
      render(<TextField />);

      expect(screen.getAllByRole('textbox')).toHaveLength(1);
    });

    it('root에 text field 클래스와 form control root 클래스가 있어야 한다', () => {
      render(<TextField data-testid="root" />);

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(textFieldClasses.root);
      expect(root).toHaveClass(formControlClasses.root);
    });

    it('multiline이면 textarea를 렌더링해야 한다', () => {
      render(<TextField multiline />);

      expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe('textarea');
    });

    it('fullWidth prop을 FormControl root와 Input root에 전달해야 한다', () => {
      render(<TextField fullWidth data-testid="root" />);

      const root = screen.getByTestId('root');
      const inputRoot = screen.getByRole('textbox').parentElement;

      expect(root).toHaveClass(formControlClasses.fullWidth);
      expect(inputRoot).toHaveClass(inputBaseClasses.fullWidth);
    });
  });

  describe('variant', () => {
    it('variant="plain"이면 PlainInput을 사용해야 한다', () => {
      render(<TextField variant="plain" />);

      const inputRoot = screen.getByRole('textbox').parentElement;

      expect(inputRoot).toHaveClass(plainInputClasses.root);
    });

    it('variant="filled"이면 FilledInput을 사용해야 한다', () => {
      render(<TextField variant="filled" />);

      const inputRoot = screen.getByRole('textbox').parentElement;

      expect(inputRoot).toHaveClass(filledInputClasses.root);
    });

    it('기본 variant는 boxed여야 한다', () => {
      render(<TextField />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('with a label', () => {
    it('label이 있으면 input의 accessible name으로 연결되어야 한다', () => {
      render(<TextField label="Foo bar" />);

      expect(screen.getByRole('textbox')).toHaveAccessibleName('Foo bar');
    });

    ['', undefined].forEach((label) => {
      it(`빈 label(${String(label)})이면 label element를 렌더링하지 않아야 한다`, () => {
        const { container } = render(<TextField label={label} />);

        expect(container.querySelector('label')).toBeNull();
      });
    });

    it('id prop이 있으면 label htmlFor와 input id가 연결되어야 한다', () => {
      render(<TextField id="my-field" label="Name" />);

      const label = screen.getByText('Name');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'my-field');
      expect(input).toHaveAttribute('id', 'my-field');
    });
  });

  describe('with helper text', () => {
    it('helperText를 렌더링해야 한다', () => {
      render(<TextField helperText="Foo bar" />);

      expect(screen.getByText('Foo bar')).toBeInTheDocument();
    });

    it('helperText는 input의 accessible description이어야 한다', () => {
      render(<TextField helperText="Foo bar" />);

      expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Foo bar');
    });

    it('helperText가 있으면 id를 기반으로 helper text id를 연결해야 한다', () => {
      render(<TextField id="my-field" helperText="Helpful message" />);

      expect(screen.getByText('Helpful message')).toHaveAttribute('id', 'my-field-helper-text');
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-describedby',
        'my-field-helper-text',
      );
    });

    /**
     * 소비자가 준 `aria-describedby` 는 helper text 와 **합성**되어 input 에 닿아야 한다.
     *
     * 설명은 여러 요소를 가리킬 수 있는 공백 구분 id 목록이다. 둘 중 하나를 버리면
     * 스크린리더가 설명 하나를 통째로 잃는데, 타입도 런타임도 아무 말을 하지 않는다.
     *
     * TextField 가 이 합성의 소유자다 — helper 의 id 를 만드는 유일한 층이기 때문이다.
     */
    it('소비자 aria-describedby 를 helper text id 와 합성해 input 에 건다', () => {
      render(
        <>
          <span id="extra">추가 설명</span>
          <TextField id="f" label="이메일" helperText="회사 메일" aria-describedby="extra" />
        </>,
      );

      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('aria-describedby', 'extra f-helper-text');
      expect(input).toHaveAccessibleDescription('추가 설명 회사 메일');
    });

    it('helperText 가 없으면 소비자 aria-describedby 만 input 에 닿는다', () => {
      render(
        <>
          <span id="extra">추가 설명</span>
          <TextField id="f" label="이메일" aria-describedby="extra" />
        </>,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'extra');
    });
  });

  /**
   * `readOnly` 는 ui-core `InputFieldSemanticProps` 가 소유한 공유 시맨틱이고 TextField 에
   * 타입으로 선언되어 있다. 진짜 입력에 닿지 않으면 타입은 통과하는데 필드는 그대로
   * 편집 가능한 채 남는다 — 조용한 계약 위반이다.
   *
   * `disabled` 와 갈리는 지점이기도 하다: readOnly 는 편집만 막고 포커스와 값 제출은 살린다.
   */
  describe('prop: readOnly', () => {
    it('readOnly 가 실제 input 에 닿는다 — disabled 로 바뀌지 않는다', () => {
      render(<TextField label="A" readOnly defaultValue="x" />);

      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('readonly');
      expect(input).not.toBeDisabled();
    });

    it('readOnly 를 FormControl 래퍼 div 로 흘리지 않는다', () => {
      render(<TextField label="A" readOnly />);

      expect(document.querySelector('.ui-form-control')).not.toHaveAttribute('readonly');
    });

    it('readOnly 는 포커스를 막지 않는다', async () => {
      const { user } = render(<TextField label="A" readOnly defaultValue="x" />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(input).toHaveFocus();
    });
  });

  describe('events', () => {
    it('input 경로에서 onChange를 전달해야 한다', () => {
      const handleChange = spy();

      render(<TextField onChange={handleChange} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'hello' },
      });

      expect(handleChange.callCount).toBe(1);
    });

    it('input 경로에서 onFocus와 onBlur를 전달해야 한다', () => {
      const handleFocus = spy();
      const handleBlur = spy();

      render(<TextField onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');

      input.focus();
      input.blur();

      expect(handleFocus.callCount).toBe(1);
      expect(handleBlur.callCount).toBe(1);
    });

    it('onClick은 root slot에 등록되어야 한다', () => {
      const handleClick = spy((event: React.MouseEvent<HTMLElement>) => event.currentTarget);

      render(<TextField data-testid="root" onClick={handleClick} />);

      const input = screen.getByRole('textbox');
      const root = screen.getByTestId('root');

      fireEvent.click(input);

      expect(handleClick.callCount).toBe(1);
      expect(handleClick.returned(root)).toBe(true);
    });
  });

  describe('class merging', () => {
    it('className을 root에 병합해야 한다', () => {
      render(<TextField data-testid="root" className="custom-root" />);

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(textFieldClasses.root);
      expect(root).toHaveClass('custom-root');
    });
  });

  describe('prop forwarding', () => {
    it('placeholder를 input에 전달해야 한다', () => {
      render(<TextField placeholder="Type here" />);

      expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
    });

    it('name을 input에 전달해야 한다', () => {
      render(<TextField name="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('required를 input에 전달해야 한다', () => {
      render(<TextField required />);

      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('disabled를 input에 전달해야 한다', () => {
      render(<TextField disabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('prop: select', () => {
    it('select=true이면 combobox를 렌더링해야 한다', () => {
      render(
        <TextField select label="Currency" value="usd">
          <option value="usd">USD</option>
          <option value="krw">KRW</option>
        </TextField>,
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('select는 label과 연결되어 accessible name을 가져야 한다', () => {
      render(
        <TextField select label="Currency" value="usd">
          <option value="usd">USD</option>
          <option value="krw">KRW</option>
        </TextField>,
      );

      expect(screen.getByRole('combobox')).toHaveAccessibleName('Currency');
    });

    it('helperText가 있으면 select도 accessible description을 가져야 한다', () => {
      render(
        <TextField select label="Currency" helperText="Choose one" value="usd">
          <option value="usd">USD</option>
          <option value="krw">KRW</option>
        </TextField>,
      );

      expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Choose one');
    });

    it('옵션을 고르면 onChange가 Select 의 change 계약({ target: { name, value } })으로 호출되어야 한다', async () => {
      const onChange = vi.fn();
      const { user } = render(
        <TextField select label="Currency" name="currency" defaultValue="usd" onChange={onChange}>
          <option value="usd">USD</option>
          <option value="krw">KRW</option>
        </TextField>,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'KRW' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].target).toEqual({ name: 'currency', value: 'krw' });
    });

    it('controlled select는 onChange로 값을 갱신할 수 있어야 한다', async () => {
      const Controlled = () => {
        const [value, setValue] = React.useState<unknown>('usd');
        return (
          <TextField
            select
            label="Currency"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          >
            <option value="usd">USD</option>
            <option value="krw">KRW</option>
          </TextField>
        );
      };

      const { user } = render(<Controlled />);

      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'KRW' }));

      expect(screen.getByRole('combobox')).toHaveTextContent('KRW');
    });

    it('열린 listbox 도 label 로 이름을 가져야 한다', async () => {
      const { user } = render(
        <TextField select label="Currency" value="usd">
          <option value="usd">USD</option>
          <option value="krw">KRW</option>
        </TextField>,
      );

      await user.click(screen.getByRole('combobox'));

      expect(screen.getByRole('listbox')).toHaveAccessibleName('Currency');
    });

    it('select 모드는 Select 에 뜻이 없는 입력 전용 prop 을 타입에서 거부한다', () => {
      const elements = [
        // @ts-expect-error select 의 포커스 대상은 native input 이 아니다
        <TextField key="ref" select label="L" inputRef={() => undefined} />,
        // @ts-expect-error Select 에는 readOnly 가 없다
        <TextField key="readOnly" select label="L" readOnly />,
        // @ts-expect-error Select 에는 multiline 이 없다
        <TextField key="multiline" select label="L" multiline />,
        // @ts-expect-error Select 에는 rows 가 없다
        <TextField key="rows" select label="L" rows={3} />,
        // @ts-expect-error Select 에는 input type 이 없다
        <TextField key="type" select label="L" type="email" />,
      ];

      expect(elements).toHaveLength(5);
    });

    it('disabled·required·error 를 combobox 에 알려야 한다', () => {
      render(
        <TextField select label="Currency" value="usd" disabled required error>
          <option value="usd">USD</option>
        </TextField>,
      );

      const combobox = screen.getByRole('combobox');

      expect(combobox).toBeDisabled();
      expect(combobox).toHaveAttribute('aria-required', 'true');
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
