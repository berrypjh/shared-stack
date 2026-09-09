import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRenderer, describeConformance } from '../../../test';
import { FormControl } from '../form-control';
import { inputBaseClasses } from '../input-base';

import { FilledInput } from './FilledInput';
import { filledInputClasses } from './FilledInput.constants';

/**
 * FilledInput 는 `InputBase` 에 채워진 표면 클래스를 더하는 시각 래퍼다.
 *
 * 동작은 전부 `InputBase` 가 가지고 그 테스트가 지킨다 — 여기서 같은 것을 다시 확인하면
 * 래퍼가 얇다는 사실이 아니라 테스트 개수만 늘어난다. 그래서 **래퍼 고유의 계약**만 본다:
 * 클래스 합성과, 받은 것을 그대로 넘기는지.
 */
describe('<FilledInput />', () => {
  const { render } = createRenderer();

  describeConformance(<FilledInput />, () => ({
    render,
    classes: filledInputClasses,
    refInstanceof: HTMLDivElement,
    skip: ['polymorphicProp'],
  }));

  it('루트와 입력에 variant 클래스와 InputBase 클래스를 함께 붙인다', () => {
    render(<FilledInput data-testid="root" inputProps={{ 'data-testid': 'input' } as never} />);

    expect(screen.getByTestId('root')).toHaveClass(filledInputClasses.root, inputBaseClasses.root);
    expect(screen.getByTestId('input')).toHaveClass(
      filledInputClasses.input,
      inputBaseClasses.input,
    );
  });

  it('className 을 variant 루트 클래스와 병합한다', () => {
    render(<FilledInput data-testid="root" className="custom-root" />);

    expect(screen.getByTestId('root')).toHaveClass(filledInputClasses.root, 'custom-root');
  });

  it('inputProps.className 을 variant 입력 클래스와 병합한다', () => {
    render(
      <FilledInput inputProps={{ 'data-testid': 'input', className: 'custom-input' } as never} />,
    );

    expect(screen.getByTestId('input')).toHaveClass(
      filledInputClasses.input,
      inputBaseClasses.input,
      'custom-input',
    );
  });

  it('시맨틱 prop 을 InputBase 로 그대로 넘긴다', () => {
    render(
      <FilledInput
        data-testid="root"
        error
        size="sm"
        disabled
        inputProps={{ 'data-testid': 'input' } as never}
      />,
    );

    const root = screen.getByTestId('root');

    expect(root).toHaveClass(
      inputBaseClasses.error,
      inputBaseClasses.sizeSm,
      inputBaseClasses.disabled,
    );
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('FormControl 상속과 prop override 를 가로막지 않는다', () => {
    render(
      <FormControl error size="sm">
        <FilledInput data-testid="inherited" />
        <FilledInput data-testid="overridden" error={false} />
      </FormControl>,
    );

    const inherited = screen.getByTestId('inherited');
    const overridden = screen.getByTestId('overridden');

    expect(inherited).toHaveClass(inputBaseClasses.error, inputBaseClasses.sizeSm);
    expect(overridden).not.toHaveClass(inputBaseClasses.error);
    expect(overridden).toHaveClass(inputBaseClasses.sizeSm);
  });
});
