import { act, cleanup, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { applyComponentStyles, matchingStateColorRules } from '../../../test/componentStyles';
import { FormControl } from '../form-control';
import { PlainInput } from '../plain-input';

import { InputLabel } from './InputLabel';
import { inputLabelClasses } from './InputLabel.constants';
import type { InputLabelProps } from './InputLabel.types';

describe('<InputLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<InputLabel>Foo</InputLabel>, () => ({
    render,
    classes: inputLabelClasses,
    refInstanceof: HTMLLabelElement,
    skip: ['polymorphicProp'],
  }));

  it('label 요소로 텍스트를 렌더링해야 한다', () => {
    render(<InputLabel>Foo</InputLabel>);

    const label = screen.getByText('Foo');

    expect(label.tagName.toLowerCase()).toBe('label');
    expect(label).toHaveTextContent('Foo');
  });

  it('기본적으로 root 클래스가 있어야 한다', () => {
    const { container } = render(<InputLabel>Foo</InputLabel>);
    const root = container.firstElementChild;

    expect(root).toHaveClass(inputLabelClasses.root);
  });

  it('기본적으로 md size 클래스가 있어야 한다', () => {
    render(<InputLabel data-testid="root">Foo</InputLabel>);

    expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.sizeMd);
  });

  it('기본적으로 primary color 클래스가 있어야 한다', () => {
    render(<InputLabel data-testid="root">Foo</InputLabel>);

    expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.colorPrimary);
  });

  it('required이면 asterisk를 렌더링해야 한다', () => {
    render(
      <InputLabel data-testid="root" required>
        Foo
      </InputLabel>,
    );

    const root = screen.getByTestId('root');
    const asterisk = root.querySelector(`.${inputLabelClasses.asterisk}`);

    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveTextContent('*');
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveClass(inputLabelClasses.required);
  });

  it('required가 아니면 asterisk를 렌더링하지 않아야 한다', () => {
    render(<InputLabel data-testid="root">Foo</InputLabel>);

    const root = screen.getByTestId('root');
    const asterisk = root.querySelector(`.${inputLabelClasses.asterisk}`);

    expect(asterisk).not.toBeInTheDocument();
  });

  describe('prop resolution', () => {
    it('size="sm"이면 sizeSm 클래스가 있어야 한다', () => {
      render(
        <InputLabel data-testid="root" size="sm">
          Foo
        </InputLabel>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.sizeSm);
      expect(screen.getByTestId('root')).not.toHaveClass(inputLabelClasses.sizeMd);
    });

    it('color="secondary"면 colorSecondary 클래스가 있어야 한다', () => {
      render(
        <InputLabel data-testid="root" color="secondary">
          Foo
        </InputLabel>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.colorSecondary);
      expect(screen.getByTestId('root')).not.toHaveClass(inputLabelClasses.colorPrimary);
    });

    it('disabled면 disabled 클래스가 있어야 한다', () => {
      render(
        <InputLabel data-testid="root" disabled>
          Foo
        </InputLabel>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.disabled);
    });

    it('error면 error 클래스가 있어야 한다', () => {
      render(
        <InputLabel data-testid="root" error>
          Foo
        </InputLabel>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.error);
    });

    it('focused면 focused 클래스가 있어야 한다', () => {
      render(
        <InputLabel data-testid="root" focused>
          Foo
        </InputLabel>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.focused);
    });
  });

  describe('with FormControl', () => {
    it('FormControl 내부에서는 formControl 클래스가 있어야 한다', () => {
      render(
        <FormControl>
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.formControl);
    });

    it('FormControl size="sm"이면 sizeSm 클래스가 있어야 한다', () => {
      render(
        <FormControl size="sm">
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.sizeSm);
    });

    it('FormControl color="secondary"이면 colorSecondary 클래스가 있어야 한다', () => {
      render(
        <FormControl color="secondary">
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.colorSecondary);
    });

    it('FormControl disabled 상태를 반영해야 한다', () => {
      render(
        <FormControl disabled>
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.disabled);
    });

    it('FormControl error 상태를 반영해야 한다', () => {
      render(
        <FormControl error>
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.error);
    });

    it('FormControl required 상태를 반영해야 한다', () => {
      render(
        <FormControl required>
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');
      const asterisk = root.querySelector(`.${inputLabelClasses.asterisk}`);

      expect(root).toHaveClass(inputLabelClasses.required);
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveTextContent('*');
    });

    it('FormControl focused prop이 있으면 focused 클래스를 적용해야 한다', () => {
      render(
        <FormControl focused>
          <PlainInput />
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).toHaveClass(inputLabelClasses.focused);
    });

    it('입력 요소가 focus되면 FormControl focused 상태를 반영해야 한다', () => {
      render(
        <FormControl>
          <PlainInput />
          <InputLabel data-testid="root">Name</InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');
      const input = screen.getByRole('textbox');

      expect(root).not.toHaveClass(inputLabelClasses.focused);

      act(() => {
        input.focus();
      });

      expect(root).toHaveClass(inputLabelClasses.focused);

      act(() => {
        input.blur();
      });

      expect(root).not.toHaveClass(inputLabelClasses.focused);
    });
  });

  describe('prop override', () => {
    it('FormControl size보다 props size가 우선해야 한다', () => {
      render(
        <FormControl size="md">
          <InputLabel data-testid="root" size="sm">
            Name
          </InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(inputLabelClasses.sizeSm);
      expect(root).not.toHaveClass(inputLabelClasses.sizeMd);
    });

    it('FormControl color보다 props color가 우선해야 한다', () => {
      render(
        <FormControl color="primary">
          <InputLabel data-testid="root" color="secondary">
            Name
          </InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(inputLabelClasses.colorSecondary);
      expect(root).not.toHaveClass(inputLabelClasses.colorPrimary);
    });

    it('FormControl required보다 props required가 우선해야 한다', () => {
      render(
        <FormControl required>
          <InputLabel data-testid="root" required={false}>
            Name
          </InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');
      const asterisk = root.querySelector(`.${inputLabelClasses.asterisk}`);

      expect(root).not.toHaveClass(inputLabelClasses.required);
      expect(asterisk).not.toBeInTheDocument();
    });

    it('FormControl focused보다 props focused가 우선해야 한다', () => {
      render(
        <FormControl focused>
          <InputLabel data-testid="root" focused={false}>
            Name
          </InputLabel>
        </FormControl>,
      );

      expect(screen.getByTestId('root')).not.toHaveClass(inputLabelClasses.focused);
    });
  });

  describe('class merging', () => {
    it('className을 root element에 병합해야 한다', () => {
      render(
        <FormControl>
          <InputLabel data-testid="root" className="custom-class-name">
            Label
          </InputLabel>
        </FormControl>,
      );

      const root = screen.getByTestId('root');

      expect(root).toHaveClass(inputLabelClasses.root);
      expect(root).toHaveClass('custom-class-name');
    });
  });

  /**
   * 상태가 겹쳤을 때 어떤 색이 이기는지.
   *
   * 클래스가 붙었는지가 아니라 **실제 cascade 결과**를 본다. 상태 클래스는 셋 다 붙어 있고
   * 사용자가 보는 색은 그중 하나뿐이라, 클래스 존재 검사로는 이 계약을 지킬 수 없다.
   *
   * 목표 순서 `disabled > error > focused > 평상시` 의 근거:
   * - RN `InputLabel.styles.ts` 의 `labelColor` 가 같은 순서다
   * - 같은 필드의 Input chrome(`boxed-input.scss`)도 disabled 를 가장 앞에 둔다
   * - disabled 는 "편집 불가" 라는 더 강한 사실이라 오류·포커스보다 먼저 읽혀야 한다
   */
  describe('동시 상태 색 우선순위', () => {
    const STATE_CLASSES = [
      inputLabelClasses.disabled,
      inputLabelClasses.error,
      inputLabelClasses.focused,
    ];

    beforeAll(() => {
      applyComponentStyles('input-label/input-label.scss');
    });

    /** 이 상태에서 색을 정하는 상태 규칙들. 정확히 하나여야 배타성이 지켜진 것이다. */
    const winningColors = (props: Partial<InputLabelProps>): string[] => {
      render(
        <InputLabel data-testid="root" {...props}>
          Label
        </InputLabel>,
      );

      return matchingStateColorRules(screen.getByTestId('root'), STATE_CLASSES).map(
        (rule) => rule.color,
      );
    };

    it('상태가 없으면 상태 규칙이 하나도 매칭되지 않는다 — 기본 규칙이 남는다', () => {
      expect(winningColors({})).toEqual([]);
    });

    it('focused 단독이면 color 에 따라 text.primary / text.secondary 다', () => {
      expect(winningColors({ focused: true })).toEqual(['var(--ds-text-primary)']);

      cleanup();

      expect(winningColors({ focused: true, color: 'secondary' })).toEqual([
        'var(--ds-text-secondary)',
      ]);
    });

    it('error 가 focused 를 이긴다', () => {
      expect(winningColors({ error: true, focused: true })).toEqual(['var(--ds-text-error)']);
    });

    it('disabled 가 error 를 이긴다', () => {
      expect(winningColors({ disabled: true, error: true })).toEqual(['var(--ds-text-disable)']);
    });

    it('disabled 가 focused 를 이긴다', () => {
      expect(winningColors({ disabled: true, focused: true })).toEqual(['var(--ds-text-disable)']);
    });

    it('셋이 겹쳐도 disabled 다', () => {
      expect(winningColors({ disabled: true, error: true, focused: true })).toEqual([
        'var(--ds-text-disable)',
      ]);
    });
  });
});
