import * as React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';
import { spy } from 'sinon';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { FormControl, useFormControl } from '../form-control';

import { InputBase } from './InputBase';
import { inputBaseClasses } from './InputBase.constants';

type FormControlContextValue = NonNullable<ReturnType<typeof useFormControl>>;

const getFormControlHandle = (
  ref: React.RefObject<FormControlContextValue | null>,
): FormControlContextValue => {
  const current = ref.current;

  expect(current).not.toBeNull();

  if (current == null) {
    throw new Error('FormControl ref가 연결되지 않았습니다.');
  }

  return current;
};

const FilledStateLabel = (props: React.ComponentProps<'label'>) => {
  const formControl = useFormControl();

  return <label {...props}>filled: {String(formControl?.filled)}</label>;
};

const FocusedStateLabel = (props: React.ComponentProps<'label'>) => {
  const formControl = useFormControl();

  return <label {...props}>focused: {String(formControl?.focused)}</label>;
};

describe('<InputBase />', () => {
  const { render } = createRenderer();

  describeConformance(<InputBase />, () => ({
    render,
    classes: inputBaseClasses,
    refInstanceof: HTMLDivElement,
    skip: ['polymorphicProp'],
  }));

  describe('rendering', () => {
    it('root 내부에 기본 text input을 렌더링해야 한다', () => {
      const { container } = render(<InputBase />);
      const input = container.querySelector('input');

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveClass(inputBaseClasses.input);
      expect(input).not.toHaveAttribute('required');
    });

    it('size="sm"이면 root에 sizeSm 클래스가 있어야 한다', () => {
      render(<InputBase data-testid="root" size="sm" />);

      expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.sizeSm);
    });

    /** 시맨틱 prop 을 명시적으로 `undefined` 로 주는 것은 생략과 같아야 한다. */
    it('색·크기를 undefined로 줘도 기본값으로 렌더링해야 한다', () => {
      render(<InputBase data-testid="root" color={undefined} size={undefined} />);

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(inputBaseClasses.colorPrimary);
      expect(root).toHaveClass(inputBaseClasses.sizeMd);
    });

    it('children을 root 내부에 렌더링해야 한다', () => {
      render(
        <InputBase>
          <span data-testid="child">child</span>
        </InputBase>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('multiline', () => {
    it('multiline이면 textarea를 렌더링해야 한다', () => {
      render(<InputBase multiline />);

      const textarea = screen.getByRole('textbox');

      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('rows가 지정되면 textarea를 렌더링해야 한다', () => {
      render(<InputBase multiline rows={4} />);

      const textarea = screen.getByRole('textbox');

      expect(textarea.tagName.toLowerCase()).toBe('textarea');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('textareaProps.rows가 rows보다 우선해야 한다', () => {
      render(<InputBase multiline rows={4} textareaProps={{ rows: 6 }} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
    });

    it('value를 textarea에 전달해야 한다', () => {
      render(<InputBase multiline value="Hello" />);

      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveValue('Hello');
    });

    it('rows 변경 시 focus 상태를 유지해야 한다', () => {
      const { setProps } = render(<InputBase multiline />);
      const textarea = screen.getByRole('textbox');

      act(() => {
        textarea.focus();
      });

      expect(textarea).toHaveFocus();

      setProps({ rows: 4 });

      expect(textarea).toHaveFocus();
    });
  });

  describe('prop: disabled', () => {
    it('disabled input을 렌더링해야 한다', () => {
      render(<InputBase data-testid="root" disabled />);

      const root = screen.getByTestId('root');
      const input = screen.getByRole('textbox');

      expect(root).toHaveClass(inputBaseClasses.disabled);
      expect(input).toBeDisabled();
    });

    it('disabled 상태에서도 root onClick은 전달되어야 한다', () => {
      const handleClick = spy();

      render(<InputBase data-testid="root" disabled onClick={handleClick} />);

      fireEvent.click(screen.getByTestId('root'));

      expect(handleClick.callCount).toBe(1);
    });
  });

  describe('prop: readOnly', () => {
    it('readonly input을 렌더링해야 한다', () => {
      render(<InputBase data-testid="root" readOnly />);

      const root = screen.getByTestId('root');
      const input = screen.getByRole('textbox');

      expect(root).toHaveClass(inputBaseClasses.readOnly);
      expect(input).toHaveProperty('readOnly', true);
    });
  });

  describe('event callbacks', () => {
    it('이벤트 콜백들을 호출해야 한다', () => {
      const handleChange = spy();
      const handleFocus = spy();
      const handleBlur = spy();
      const handleKeyUp = spy();
      const handleKeyDown = spy();

      render(
        <InputBase
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
        />,
      );

      const input = screen.getByRole('textbox');

      act(() => {
        input.focus();
      });
      expect(handleFocus.callCount).toBe(1);

      fireEvent.keyDown(input, { key: 'a' });
      expect(handleKeyDown.callCount).toBe(1);

      fireEvent.change(input, { target: { value: 'a' } });
      expect(handleChange.callCount).toBe(1);

      fireEvent.keyUp(input, { key: 'a' });
      expect(handleKeyUp.callCount).toBe(1);

      act(() => {
        input.blur();
      });
      expect(handleBlur.callCount).toBe(1);
    });

    it('inputProps.onChange와 onChange를 모두 호출해야 한다', () => {
      const handleInputPropsChange = spy();
      const handleChange = spy();

      render(
        <InputBase onChange={handleChange} inputProps={{ onChange: handleInputPropsChange }} />,
      );

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'hello' },
      });

      expect(handleInputPropsChange.callCount).toBe(1);
      expect(handleChange.callCount).toBe(1);
    });

    it('textareaProps.onChange와 onChange를 모두 호출해야 한다', () => {
      const handleTextareaPropsChange = spy();
      const handleChange = spy();

      render(
        <InputBase
          multiline
          onChange={handleChange}
          textareaProps={{ onChange: handleTextareaPropsChange }}
        />,
      );

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'hello' },
      });

      expect(handleTextareaPropsChange.callCount).toBe(1);
      expect(handleChange.callCount).toBe(1);
    });
  });

  describe('with FormControl', () => {
    it('FormControl 내부에서는 formControl 클래스가 있어야 한다', () => {
      render(
        <FormControl>
          <InputBase data-testid="root" />
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.formControl);
    });

    describe('callbacks', () => {
      it('root click 시 onClick과 focus가 동작해야 한다', () => {
        const handleClick = spy();
        const handleFocus = spy();

        render(
          <FormControl>
            <InputBase data-testid="root" onClick={handleClick} onFocus={handleFocus} />
          </FormControl>,
        );

        fireEvent.click(screen.getByTestId('root'));

        expect(handleClick.callCount).toBe(1);
        expect(handleFocus.callCount).toBe(1);
      });
    });

    describe('error', () => {
      const InputBaseInErrorForm = (props: React.ComponentProps<typeof InputBase>) => (
        <FormControl error>
          <InputBase data-testid="root" {...props} />
        </FormControl>
      );

      it('FormControl error 상태를 받아 error 클래스를 가져야 한다', () => {
        render(<InputBaseInErrorForm />);

        expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.error);
      });

      it('props로 error 상태를 override할 수 있어야 한다', () => {
        const { setProps } = render(<InputBaseInErrorForm />);

        expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.error);

        setProps({ error: false });
        expect(screen.getByTestId('root')).not.toHaveClass(inputBaseClasses.error);

        setProps({ error: true });
        expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.error);
      });
    });

    describe('size', () => {
      it('FormControl size="sm"이면 inputSizeSm 클래스가 있어야 한다', () => {
        render(
          <FormControl size="sm">
            <InputBase />
          </FormControl>,
        );

        expect(screen.getByRole('textbox')).toHaveClass(inputBaseClasses.inputSizeSm);
      });

      it('size는 props로 override할 수 있어야 한다', () => {
        const InputBaseInForm = (props: React.ComponentProps<typeof InputBase>) => (
          <FormControl size="md">
            <InputBase {...props} />
          </FormControl>
        );

        const { setProps } = render(<InputBaseInForm />);

        expect(screen.getByRole('textbox')).not.toHaveClass(inputBaseClasses.inputSizeSm);

        setProps({ size: 'sm' });

        expect(screen.getByRole('textbox')).toHaveClass(inputBaseClasses.inputSizeSm);
      });

      it('hiddenLabel이면 inputHiddenLabel 클래스가 있어야 한다', () => {
        render(
          <FormControl hiddenLabel margin="dense">
            <InputBase />
          </FormControl>,
        );

        expect(screen.getByRole('textbox')).toHaveClass(inputBaseClasses.inputHiddenLabel);
      });
    });

    describe('required', () => {
      it('FormControl required 상태를 input required 속성으로 반영해야 한다', () => {
        render(
          <FormControl required>
            <InputBase />
          </FormControl>,
        );

        expect(screen.getByRole('textbox')).toBeRequired();
      });
    });

    describe('focused', () => {
      it('FormControl context의 focused 상태를 우선 반영해야 한다', () => {
        const FormController = React.forwardRef<FormControlContextValue>((_props, ref) => {
          const formControl = useFormControl();

          if (!formControl) {
            throw new Error('FormController는 FormControl 내부에서만 사용해야 합니다.');
          }

          React.useImperativeHandle(ref, () => formControl, [formControl]);

          return null;
        });

        const controlRef = React.createRef<FormControlContextValue>();

        render(
          <FormControl>
            <FormController ref={controlRef} />
            <InputBase data-testid="root" />
          </FormControl>,
        );

        act(() => {
          screen.getByRole('textbox').focus();
        });

        expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.focused);

        act(() => {
          getFormControlHandle(controlRef).onBlur();
        });

        expect(screen.getByTestId('root')).not.toHaveClass(inputBaseClasses.focused);

        act(() => {
          getFormControlHandle(controlRef).onFocus();
        });

        expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.focused);
      });

      it('focused 상태를 FormControl 컨텍스트에 전파해야 한다', () => {
        render(
          <FormControl>
            <FocusedStateLabel data-testid="label" htmlFor="input" />
            <InputBase id="input" />
          </FormControl>,
        );

        expect(screen.getByTestId('label')).toHaveTextContent('focused: false');

        act(() => {
          screen.getByRole('textbox').focus();
        });

        expect(screen.getByTestId('label')).toHaveTextContent('focused: true');

        act(() => {
          screen.getByRole('textbox').blur();
        });

        expect(screen.getByTestId('label')).toHaveTextContent('focused: false');
      });
    });

    it('uncontrolled 상태에서 filled를 FormControl에 전파해야 한다', () => {
      render(
        <FormControl>
          <FilledStateLabel data-testid="label" />
          <InputBase />
        </FormControl>,
      );

      const textbox = screen.getByRole('textbox');

      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');

      fireEvent.change(textbox, { target: { value: 'material' } });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');

      fireEvent.change(textbox, { target: { value: '0' } });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');

      fireEvent.change(textbox, { target: { value: '' } });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');
    });

    /**
     * 첫 렌더의 정적 스캔(`deriveStateFromChildren`)이 런타임 상태를 영구히 덮으면 안 된다.
     * `defaultValue`가 있으면 스캔은 계속 참을 말하므로, 사용자가 지워도 filled가 안 내려갔다.
     */
    it('defaultValue를 지우면 filled가 false가 되어야 한다', () => {
      render(
        <FormControl>
          <FilledStateLabel data-testid="label" />
          <InputBase defaultValue="berry" />
        </FormControl>,
      );

      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });

      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');
    });

    it('defaultValue를 지웠다가 다시 채우면 filled가 따라온다', () => {
      render(
        <FormControl>
          <FilledStateLabel data-testid="label" />
          <InputBase defaultValue="berry" />
        </FormControl>,
      );

      const textbox = screen.getByRole('textbox');

      fireEvent.change(textbox, { target: { value: '' } });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');

      fireEvent.change(textbox, { target: { value: 'x' } });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');
    });

    it('첫 렌더부터 defaultValue를 filled로 본다', () => {
      render(
        <FormControl>
          <FilledStateLabel data-testid="label" />
          <InputBase defaultValue="berry" />
        </FormControl>,
      );

      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');
    });

    it('controlled 상태에서 filled를 FormControl에 전파해야 한다', () => {
      const ControlledInputBase = (props: React.ComponentProps<typeof InputBase>) => (
        <FormControl>
          <FilledStateLabel data-testid="label" />
          <InputBase {...props} />
        </FormControl>
      );

      const { setProps } = render(<ControlledInputBase value="" />);

      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');

      setProps({ value: 'material' });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');

      setProps({ value: 0 });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: true');

      setProps({ value: '' });
      expect(screen.getByTestId('label')).toHaveTextContent('filled: false');
    });
  });

  describe('prop: inputProps', () => {
    it('inputProps를 input에 적용해야 한다', () => {
      const { container } = render(<InputBase inputProps={{ className: 'foo', maxLength: 5 }} />);
      const input = container.querySelector('input');

      expect(input).toHaveClass('foo');
      expect(input).toHaveClass(inputBaseClasses.input);
      expect(input).toHaveProperty('maxLength', 5);
    });

    it('inputProps.ref로 native input ref를 받을 수 있어야 한다', () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const { container } = render(<InputBase inputProps={{ ref: inputRef }} />);

      expect(inputRef.current).toBe(container.querySelector('input'));
    });

    it('같은 className을 중복 적용하지 않아야 한다', () => {
      const { container } = render(<InputBase inputProps={{ className: 'foo' }} />);
      const input = container.querySelector('input');

      expect(input).toHaveClass('foo');

      const matches = input?.className.match(/foo/g);

      expect(matches).toHaveLength(1);
    });

    it('inputProps.type이 type prop보다 우선해야 한다', () => {
      render(<InputBase type="password" inputProps={{ type: 'email' }} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });
  });

  describe('prop: textareaProps', () => {
    it('textareaProps를 textarea에 적용해야 한다', () => {
      render(<InputBase multiline textareaProps={{ className: 'foo', maxLength: 5 }} />);

      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveClass('foo');
      expect(textarea).toHaveClass(inputBaseClasses.input);
      expect(textarea).toHaveProperty('maxLength', 5);
    });

    it('textareaProps.ref로 native textarea ref를 받을 수 있어야 한다', () => {
      const textareaRef = React.createRef<HTMLTextAreaElement>();

      render(<InputBase multiline textareaProps={{ ref: textareaRef }} />);

      expect(textareaRef.current).toBe(screen.getByRole('textbox'));
    });

    it('같은 className을 중복 적용하지 않아야 한다', () => {
      render(<InputBase multiline textareaProps={{ className: 'foo' }} />);

      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveClass('foo');

      const matches = textarea.className.match(/foo/g);

      expect(matches).toHaveLength(1);
    });
  });

  describe('prop: startAdornment, endAdornment', () => {
    it('startAdornment를 input 앞에 렌더링해야 한다', () => {
      render(<InputBase startAdornment={<span data-testid="start-adornment">$</span>} />);

      expect(screen.getByTestId('start-adornment')).toBeInTheDocument();
    });

    it('endAdornment를 input 뒤에 렌더링해야 한다', () => {
      render(<InputBase endAdornment={<span data-testid="end-adornment">$</span>} />);

      expect(screen.getByTestId('end-adornment')).toBeInTheDocument();
    });

    it('startAdornment가 있으면 adornedStart 클래스가 있어야 한다', () => {
      render(
        <InputBase
          data-testid="root"
          startAdornment={<span data-testid="start-adornment">$</span>}
        />,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.adornedStart);
    });

    it('endAdornment가 있으면 adornedEnd 클래스가 있어야 한다', () => {
      render(
        <InputBase data-testid="root" endAdornment={<span data-testid="end-adornment">$</span>} />,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputBaseClasses.adornedEnd);
    });
  });

  describe('prop: inputRef', () => {
    it('native input에 접근할 수 있어야 한다', () => {
      const inputRef = React.createRef<HTMLInputElement>();
      const { container } = render(<InputBase inputRef={inputRef} />);

      expect(inputRef.current).toBe(container.querySelector('input'));
    });

    it('multiline이면 native textarea에 접근할 수 있어야 한다', () => {
      const inputRef = React.createRef<HTMLTextAreaElement>();
      const { container } = render(<InputBase multiline inputRef={inputRef} />);

      expect(inputRef.current).toBe(container.querySelector('textarea'));
    });
  });

  describe('root click', () => {
    /**
     * 루트 여백을 눌렀을 때 입력으로 포커스를 넘기는 것은 필드의 기본 편의다.
     * 아래 두 테스트가 그 동작을 고정한다.
     */
    it('루트 여백 클릭은 native input에 포커스를 준다', () => {
      render(<InputBase data-testid="root" />);

      fireEvent.click(screen.getByTestId('root'));

      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('native input 클릭은 포커스를 합성하지 않는다', () => {
      const handleFocus = spy();
      render(<InputBase onFocus={handleFocus} />);

      fireEvent.click(screen.getByRole('textbox'));

      expect(handleFocus.callCount).toBe(0);
    });

    /**
     * 장식이 스스로 포커스를 가지는 요소면 루트가 뺏어오면 안 된다 — 지우기 버튼을 눌렀는데
     * 포커스가 입력으로 튀면 버튼의 상태 변화를 스크린리더가 놓치고 키보드 위치도 잃는다.
     */
    it('상호작용 장식 클릭은 루트가 포커스를 뺏지 않는다', () => {
      const handleClear = spy();

      render(
        <InputBase
          endAdornment={
            <button type="button" data-testid="clear" onClick={handleClear}>
              clear
            </button>
          }
        />,
      );

      fireEvent.click(screen.getByTestId('clear'));

      expect(handleClear.callCount).toBe(1);
      expect(document.activeElement).not.toBe(screen.getByRole('textbox'));
    });

    it('장식이 장식일 뿐이면 루트 클릭과 똑같이 입력에 포커스를 준다', () => {
      render(<InputBase endAdornment={<span data-testid="icon">₩</span>} />);

      fireEvent.click(screen.getByTestId('icon'));

      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('disabled면 루트 클릭이 포커스를 옮기지 않는다', () => {
      render(<InputBase data-testid="root" disabled />);

      fireEvent.click(screen.getByTestId('root'));

      expect(document.activeElement).not.toBe(screen.getByRole('textbox'));
    });
  });

  describe('native 라우팅', () => {
    it('error는 native input의 aria-invalid가 된다', () => {
      render(<InputBase error />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('FormControl error도 aria-invalid로 반영된다', () => {
      render(
        <FormControl error>
          <InputBase />
        </FormControl>,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('명시 aria-invalid가 error보다 우선한다', () => {
      render(<InputBase error aria-invalid={false} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('error가 아니면 aria-invalid를 붙이지 않는다', () => {
      render(<InputBase />);

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    /**
     * `inputProps`는 native 요소로 가는 유일한 통로다. 최상위에서 같은 prop을 주지 않았는데도
     * 값이 사라지면 통로가 아니라 함정이 된다.
     */
    it.each([
      ['aria-label', '이름'],
      ['aria-describedby', 'hint'],
      ['placeholder', '홍길동'],
      ['autoComplete', 'name'],
      ['name', 'fullName'],
    ] as const)('최상위에서 주지 않은 inputProps.%s는 살아남는다', (key, value) => {
      render(<InputBase inputProps={{ [key]: value }} />);

      const attribute = key === 'autoComplete' ? 'autocomplete' : key;

      expect(screen.getByRole('textbox')).toHaveAttribute(attribute, value);
    });

    it('최상위 prop은 여전히 inputProps를 이긴다', () => {
      render(<InputBase aria-label="최상위" inputProps={{ 'aria-label': '내부' }} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', '최상위');
    });

    /**
     * `inputMode`·`enterKeyHint`는 상속되지 않는 편집 전용 속성이다 — 래퍼 div에 놓이면
     * 가상 키보드에 아무것도 전달되지 않는다. `spellCheck`·`autoCapitalize`는 자손 편집 요소로
     * 상속되므로 래퍼에 남겨도 동작한다.
     */
    it('inputMode는 native input으로 간다', () => {
      render(<InputBase data-testid="root" inputMode="numeric" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');
      expect(screen.getByTestId('root')).not.toHaveAttribute('inputmode');
    });

    it('enterKeyHint는 native input으로 간다', () => {
      render(<InputBase data-testid="root" enterKeyHint="search" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('enterkeyhint', 'search');
      expect(screen.getByTestId('root')).not.toHaveAttribute('enterkeyhint');
    });

    it('multiline이어도 textarea로 간다', () => {
      render(<InputBase multiline inputMode="numeric" enterKeyHint="done" />);

      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveAttribute('inputmode', 'numeric');
      expect(textarea).toHaveAttribute('enterkeyhint', 'done');
    });
  });

  /**
   * 타입 수준 계약. vitest 는 타입을 지우므로 이 블록은 `tsc -p tsconfig.spec.json` 이 검증한다.
   *
   * `inputRef` 는 native input/textarea 로 가는 ref 다. `unknown` 이면 아무 값이나 받아 놓고
   * 런타임에 조용히 무시하므로, 잘못 연결한 ref 를 컴파일에서 잡지 못한다.
   */
  describe('타입: inputRef', () => {
    it('올바른 ref 형태를 받는다', () => {
      const objectRef = React.createRef<HTMLInputElement>();
      const textareaRef = React.createRef<HTMLTextAreaElement>();
      const callbackRef = (instance: HTMLInputElement | null) => {
        void instance;
      };

      render(
        <>
          <InputBase inputRef={objectRef} />
          <InputBase multiline inputRef={textareaRef} />
          <InputBase inputRef={callbackRef} />
          <InputBase inputRef={null} />
        </>,
      );

      expect(objectRef.current).not.toBeNull();
    });

    it('ref 가 아닌 값은 타입에서 막힌다', () => {
      const reject = () => (
        <>
          {/* @ts-expect-error 문자열은 ref 가 아니다. */}
          <InputBase inputRef="input" />
          {/* @ts-expect-error 엉뚱한 요소의 ref 는 연결되지 않는다. */}
          <InputBase inputRef={React.createRef<HTMLDivElement>()} />
        </>
      );

      expect(typeof reject).toBe('function');
    });
  });

  describe('prop: role', () => {
    it('기본값은 presentation이다', () => {
      render(<InputBase data-testid="root" />);

      expect(screen.getByTestId('root')).toHaveAttribute('role', 'presentation');
    });

    /** 받아 놓고 무시하면 소비자는 왜 안 되는지 알 수 없다. */
    it('소비자가 준 role이 이긴다', () => {
      render(<InputBase data-testid="root" role="group" />);

      expect(screen.getByTestId('root')).toHaveAttribute('role', 'group');
    });

    /**
     * 위젯 role 은 래퍼의 것이 아니다.
     *
     * 이름 prop(`aria-label` 등)은 native 요소로 가므로, 래퍼에 `searchbox`·`textbox` 같은
     * 위젯 role 을 얹으면 **이름 없는 위젯**이 만들어지고 진짜 입력을 자식으로 품는다
     * (axe `aria-input-field-name`). 검색 필드는 native `type` 으로 만든다.
     */
    it('검색 필드는 native type이 만든다 — 래퍼 role이 아니라', () => {
      render(<InputBase data-testid="root" type="search" aria-label="검색" />);

      expect(screen.getByRole('searchbox', { name: '검색' })).toBe(screen.getByLabelText('검색'));
      expect(screen.getByTestId('root')).toHaveAttribute('role', 'presentation');
    });
  });
});
