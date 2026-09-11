import * as React from 'react';

import { act, screen } from '@testing-library/react';
import { type SinonSpy, spy } from 'sinon';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';

import { FormControl } from './FormControl';
import { formControlClasses } from './FormControl.constants';
import { useFormControl } from './useFormControl';

type FormControlContextHookValue = ReturnType<typeof useFormControl>;
type FormControlContextValue = NonNullable<FormControlContextHookValue>;

type TestComponentProps = {
  contextCallback: (context: FormControlContextHookValue) => void;
};

type InspectableChildProps = {
  children?: React.ReactNode;
  input?: React.ReactNode;
  value?: unknown;
  defaultValue?: unknown;
  startAdornment?: React.ReactNode;
  inputProps?: {
    value?: unknown;
    defaultValue?: unknown;
  };
};

const getLastContext = (contextSpy: SinonSpy): FormControlContextValue => {
  const context = contextSpy.lastCall?.args[0] as FormControlContextHookValue;

  expect(context).toBeTruthy();

  return context as FormControlContextValue;
};

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

const TestComponent = ({ contextCallback }: TestComponentProps) => {
  const context = useFormControl();

  React.useEffect(() => {
    contextCallback(context);
  }, [context, contextCallback]);

  return null;
};

const InspectableChild = (_props: InspectableChildProps) => null;

describe('<FormControl />', () => {
  const { render } = createRenderer();

  describeConformance(<FormControl />, () => ({
    render,
    classes: formControlClasses,
    refInstanceof: HTMLDivElement,
    polymorphicPropName: 'component',
    testPolymorphicPropWith: 'fieldset',
  }));

  describe('rendering and classes', () => {
    it('기본적으로 root와 boxed variant 클래스가 있어야 한다', () => {
      const { container } = render(<FormControl />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.root);
      expect(root).toHaveClass(formControlClasses.variantBoxed);
      expect(root).not.toHaveClass(formControlClasses.variantPlain);
      expect(root).not.toHaveClass(formControlClasses.variantFilled);
    });

    it('기본적으로 margin 관련 클래스가 없어야 한다', () => {
      const { container } = render(<FormControl />);
      const root = container.firstElementChild;

      expect(root).not.toHaveClass(formControlClasses.marginNormal);
      expect(root).not.toHaveClass(formControlClasses.marginDense);
    });

    it('margin="normal"이면 normal margin 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl margin="normal" />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.marginNormal);
      expect(root).not.toHaveClass(formControlClasses.marginDense);
    });

    it('margin="dense"이면 dense margin 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl margin="dense" />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.marginDense);
      expect(root).not.toHaveClass(formControlClasses.marginNormal);
    });

    it('fullWidth면 fullWidth 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl fullWidth />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.fullWidth);
    });

    it('hiddenLabel이면 hiddenLabel 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl hiddenLabel />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.hiddenLabel);
    });

    it('disabled면 disabled 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl disabled />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.disabled);
    });

    it('error면 error 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl error />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.error);
    });

    it('focused prop이 true이고 disabled가 아니면 focused 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl focused />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.focused);
    });

    it('disabled 상태에서는 focused prop이 있어도 focused 클래스가 적용되지 않아야 한다', () => {
      const { container } = render(<FormControl focused disabled />);
      const root = container.firstElementChild;

      expect(root).not.toHaveClass(formControlClasses.focused);
    });

    it('variant="plain"이면 plain variant 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl variant="plain" />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.variantPlain);
      expect(root).not.toHaveClass(formControlClasses.variantFilled);
      expect(root).not.toHaveClass(formControlClasses.variantBoxed);
    });

    it('variant="filled"이면 filled variant 클래스가 적용되어야 한다', () => {
      const { container } = render(<FormControl variant="filled" />);
      const root = container.firstElementChild;

      expect(root).toHaveClass(formControlClasses.variantFilled);
      expect(root).not.toHaveClass(formControlClasses.variantPlain);
      expect(root).not.toHaveClass(formControlClasses.variantBoxed);
    });
  });

  describe('initial state', () => {
    it('초기에는 filled 상태가 아니어야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', false);
    });

    it('초기에는 focused 상태가 아니어야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('focused', false);
    });

    it('초기에는 adornedStart 상태가 아니어야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('adornedStart', false);
    });
  });

  describe('prop: required', () => {
    it('required 속성을 DOM root에 직접 내려주지 않아야 한다', () => {
      const { container } = render(<FormControl required />);

      expect(container.firstElementChild).not.toHaveAttribute('required');
    });
  });

  describe('focus management', () => {
    it('자식 input이 focus/blur되면 focused 상태가 바뀌어야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <input data-testid="input" />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('focused', false);

      act(() => {
        screen.getByTestId('input').focus();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', true);

      act(() => {
        screen.getByTestId('input').blur();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', false);
    });

    it('포커스가 같은 FormControl 내부의 다른 요소로 이동하면 focused 상태를 유지해야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <input data-testid="first" />
          <input data-testid="second" />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      act(() => {
        screen.getByTestId('first').focus();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', true);

      act(() => {
        screen.getByTestId('second').focus();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', true);

      act(() => {
        screen.getByTestId('second').blur();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', false);
    });

    it('자식 focus/blur 시 FormControl의 onFocus/onBlur를 호출해야 한다', () => {
      const handleFocus = spy();
      const handleBlur = spy();

      render(
        <FormControl onFocus={handleFocus} onBlur={handleBlur}>
          <input data-testid="input" />
        </FormControl>,
      );

      act(() => {
        screen.getByTestId('input').focus();
      });

      expect(handleFocus.callCount).toBe(1);

      act(() => {
        screen.getByTestId('input').blur();
      });

      expect(handleBlur.callCount).toBe(1);
    });
  });

  describe('prop: disabled', () => {
    it('disabled가 되면 focused 상태는 false가 되어야 한다', () => {
      const readContext = spy();
      const { setProps } = render(
        <FormControl>
          <input data-testid="input" />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('focused', false);

      act(() => {
        screen.getByTestId('input').focus();
      });

      expect(getLastContext(readContext)).toHaveProperty('focused', true);

      setProps({ disabled: true });

      expect(getLastContext(readContext)).toHaveProperty('focused', false);
    });
  });

  describe('prop: focused', () => {
    it('focused가 true이면 컨텍스트 focused 상태가 유지되어야 한다', async () => {
      const formControlRef = React.createRef<FormControlContextValue>();

      const FormController = React.forwardRef<FormControlContextValue>((_, ref) => {
        const formControl = useFormControl();

        if (!formControl) {
          throw new Error('FormController는 FormControl 내부에서만 사용해야 합니다.');
        }

        React.useImperativeHandle(ref, () => formControl, [formControl]);

        return null;
      });

      const FormControlled = React.forwardRef<
        FormControlContextValue,
        React.ComponentProps<typeof FormControl>
      >((props, ref) => (
        <FormControl {...props}>
          <FormController ref={ref} />
        </FormControl>
      ));

      render(<FormControlled focused ref={formControlRef} />);

      expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', true);

      await act(async () => {
        getFormControlHandle(formControlRef).onBlur();
      });

      expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', true);
    });

    it('disabled 상태에서는 focused prop을 무시해야 한다', () => {
      const readContext = spy();

      render(
        <FormControl focused disabled>
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toMatchObject({
        disabled: true,
        focused: false,
      });
    });
  });

  describe('derived child state', () => {
    it('value가 있으면 filled 상태여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild value="bar" />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('inputProps.value가 있으면 filled 상태여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild inputProps={{ value: 'bar' }} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('defaultValue가 있으면 filled 상태여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild defaultValue="bar" />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('inputProps.defaultValue가 있으면 filled 상태여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild inputProps={{ defaultValue: 'bar' }} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('빈 배열 value는 filled가 아니어야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild value={[]} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', false);
    });

    it('값이 있는 배열 value는 filled여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild value={['bar']} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('startAdornment가 있으면 adornedStart는 true여야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild startAdornment={<div />} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('adornedStart', true);
    });

    it('children을 재귀적으로 검사해서 filled를 계산해야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild>
            <InspectableChild value="bar" />
          </InspectableChild>
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('filled', true);
    });

    it('input prop을 재귀적으로 검사해서 adornedStart를 계산해야 한다', () => {
      const readContext = spy();

      render(
        <FormControl>
          <InspectableChild input={<InspectableChild startAdornment={<div />} />} />
          <TestComponent contextCallback={readContext} />
        </FormControl>,
      );

      expect(getLastContext(readContext)).toHaveProperty('adornedStart', true);
    });
  });

  /**
   * 중첩 시 상속 값의 격리.
   *
   * web 은 React Context 로 값을 내려보내므로 가장 가까운 Provider 가 이긴다 — RN 과 같은
   * 계약이다 (`react-native-ui` FormControl.test.tsx 의 '중첩' describe).
   *
   * **focus 는 이 테스트의 범위가 아니다.** web 은 루트에서 DOM focus 를 버블로 받는데
   * 버블링은 Context 경계를 모른다. 중첩 시 focus 거동은 두 렌더러가 갈리며, 그 결정은
   * 아직 열려 있다 — 여기서 고정하지 않는다.
   */
  describe('중첩', () => {
    it('가장 가까운 FormControl 이 이긴다 — 안쪽이 바깥 값을 상속하지 않는다', () => {
      const seen: { outer?: FormControlContextHookValue; inner?: FormControlContextHookValue } = {};
      const captureOuter = (context: FormControlContextHookValue) => {
        seen.outer = context;
      };
      const captureInner = (context: FormControlContextHookValue) => {
        seen.inner = context;
      };

      render(
        <FormControl color="secondary" size="sm">
          <TestComponent contextCallback={captureOuter} />
          <FormControl error required>
            <TestComponent contextCallback={captureInner} />
          </FormControl>
        </FormControl>,
      );

      expect(seen.outer).toMatchObject({
        color: 'secondary',
        size: 'sm',
        error: false,
        required: false,
      });
      expect(seen.inner).toMatchObject({
        color: 'primary',
        size: 'md',
        error: true,
        required: true,
      });
    });
  });

  describe('useFormControl', () => {
    const FormController = React.forwardRef<FormControlContextValue>((_, ref) => {
      const formControl = useFormControl();

      if (!formControl) {
        throw new Error('FormController는 FormControl 내부에서만 사용해야 합니다.');
      }

      React.useImperativeHandle(ref, () => formControl, [formControl]);

      return null;
    });

    const FormControlled = React.forwardRef<
      FormControlContextValue,
      React.ComponentProps<typeof FormControl>
    >((props, ref) => (
      <FormControl {...props}>
        <FormController ref={ref} />
      </FormControl>
    ));

    describe('from props', () => {
      it('required prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('required', false);

        setProps({ required: true });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('required', true);
      });

      it('error prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('error', false);

        setProps({ error: true });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('error', true);
      });

      it('size prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('size', 'md');

        setProps({ size: 'sm' });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('size', 'sm');
      });

      it('fullWidth prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('fullWidth', false);

        setProps({ fullWidth: true });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('fullWidth', true);
      });

      it('margin prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('margin', 'none');

        setProps({ margin: 'dense' });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('margin', 'dense');
      });

      it('color prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('color', 'primary');

        setProps({ color: 'secondary' });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('color', 'secondary');
      });

      it('variant prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('variant', 'boxed');

        setProps({ variant: 'filled' });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('variant', 'filled');
      });

      it('hiddenLabel prop을 컨텍스트에서 읽을 수 있어야 한다', () => {
        const formControlRef = React.createRef<FormControlContextValue>();
        const { setProps } = render(<FormControlled ref={formControlRef} />);

        expect(getFormControlHandle(formControlRef)).toHaveProperty('hiddenLabel', false);

        setProps({ hiddenLabel: true });

        expect(getFormControlHandle(formControlRef)).toHaveProperty('hiddenLabel', true);
      });
    });

    describe('callbacks', () => {
      describe('onFilled', () => {
        it('filled 상태를 true로 바꿔야 한다', async () => {
          const formControlRef = React.createRef<FormControlContextValue>();

          render(<FormControlled ref={formControlRef} />);

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', false);

          await act(async () => {
            getFormControlHandle(formControlRef).onFilled();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', true);

          await act(async () => {
            getFormControlHandle(formControlRef).onFilled();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', true);
        });
      });

      describe('onEmpty', () => {
        it('filled 상태를 false로 바꿔야 한다', async () => {
          const formControlRef = React.createRef<FormControlContextValue>();

          render(<FormControlled ref={formControlRef} />);

          await act(async () => {
            getFormControlHandle(formControlRef).onFilled();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', true);

          await act(async () => {
            getFormControlHandle(formControlRef).onEmpty();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', false);

          await act(async () => {
            getFormControlHandle(formControlRef).onEmpty();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('filled', false);
        });
      });

      describe('onFocus', () => {
        it('focused 상태를 true로 바꿔야 한다', async () => {
          const formControlRef = React.createRef<FormControlContextValue>();

          render(<FormControlled ref={formControlRef} />);

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', false);

          await act(async () => {
            getFormControlHandle(formControlRef).onFocus();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', true);

          await act(async () => {
            getFormControlHandle(formControlRef).onFocus();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', true);
        });
      });

      describe('onBlur', () => {
        it('focused 상태를 false로 바꿔야 한다', async () => {
          const formControlRef = React.createRef<FormControlContextValue>();

          render(<FormControlled ref={formControlRef} />);

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', false);

          await act(async () => {
            getFormControlHandle(formControlRef).onFocus();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', true);

          await act(async () => {
            getFormControlHandle(formControlRef).onBlur();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', false);

          await act(async () => {
            getFormControlHandle(formControlRef).onBlur();
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('focused', false);
        });
      });

      describe('setAdornedStart', () => {
        it('adornedStart 상태를 직접 바꿀 수 있어야 한다', async () => {
          const formControlRef = React.createRef<FormControlContextValue>();

          render(<FormControlled ref={formControlRef} />);

          expect(getFormControlHandle(formControlRef)).toHaveProperty('adornedStart', false);

          await act(async () => {
            getFormControlHandle(formControlRef).setAdornedStart(true);
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('adornedStart', true);

          await act(async () => {
            getFormControlHandle(formControlRef).setAdornedStart(false);
          });

          expect(getFormControlHandle(formControlRef)).toHaveProperty('adornedStart', false);
        });
      });
    });
  });
});
