/**
 * FilledInput의 variant 계약.
 *
 * "Filled"는 시각 variant입니다 — 값이 들어있다는 뜻이 아니고, web의 `onFilled`/`onEmpty`
 * (FormControl label float 신호)와 무관합니다. 아래 "이름과 값 상태는 무관합니다"가 그 회귀입니다.
 *
 * 편집·포커스·접근성은 InputBase가 검증합니다. 여기서는 filled 시각 의미와 최소 회귀만 봅니다.
 */
import { Text, TextInput } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import type { InputBaseProps } from '../input-base/InputBase.types';

import { FilledInput } from './FilledInput';
import type { FilledInputProps } from './FilledInput.types';

const T = Native.Light.tokens;

const RESTING_WIDTH = T.border.primary.width;
const FOCUSED_WIDTH = T.component.field.focusRingWidth;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getInput = () => screen.getByLabelText('probe');
const getWrapper = () => getInput().parent!;

describe('구성 — InputBase에 위임한다', () => {
  it('TextInput 하나만 렌더한다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    expect(screen.getAllByLabelText('probe')).toHaveLength(1);
    expect(getInput().type).toBe('TextInput');
  });

  it('ref가 TextInput에 닿는다', async () => {
    const ref = { current: null } as { current: TextInput | null };

    await renderWithTheme(<FilledInput accessibilityLabel="probe" ref={ref} />);

    expect(typeof ref.current?.focus).toBe('function');
  });

  it('onChangeText가 문자열을 전달한다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<FilledInput accessibilityLabel="probe" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(onChangeText).toHaveBeenCalledWith('typed');
  });

  it('controlled value 모델이 그대로다', async () => {
    await renderWithTheme(
      <FilledInput accessibilityLabel="probe" value="fixed" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('value', 'fixed');
  });

  it('uncontrolled defaultValue가 컴포넌트 상태를 만들지 않는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" defaultValue="initial" />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput().props.value).toBeUndefined();
    expect(getInput()).toHaveDisplayValue('typed');
  });
});

describe('filled 외형', () => {
  it('채워진 표면과 사방 테두리를 canonical 토큰으로 그린다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({
      backgroundColor: T.color.field.surface,
      borderColor: T.color.field.border,
      borderWidth: RESTING_WIDTH,
      borderRadius: T.radius.md,
    });
  });

  it('plain과 달리 가로 안쪽 여백을 유지한다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ paddingHorizontal: T.spacing.lg });
  });

  it('size는 InputBase의 타이포·높이 규약을 그대로 쓴다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" size="sm" />);

    expect(getInput()).toHaveStyle({ fontSize: T.typography.body.small.fontSize });
    expect(getWrapper()).toHaveStyle({ minHeight: T.spacing['4xl'] });
  });
});

describe('focus 표현', () => {
  it('focus하면 테두리가 active 색으로 굵어진다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderColor: T.border.primary.color,
      borderWidth: FOCUSED_WIDTH,
    });
  });

  it('secondary는 secondary active 색을 쓴다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" color="secondary" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.secondary });
  });

  it('focus해도 표면은 채워진 채로 남는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ backgroundColor: T.color.field.surface });
  });

  it('blur하면 평소 테두리로 돌아온다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');
    await fireEvent(getInput(), 'blur');

    expect(getWrapper()).toHaveStyle({
      borderColor: T.color.field.border,
      borderWidth: RESTING_WIDTH,
    });
  });
});

describe('error 표현', () => {
  it('error는 error 색 테두리를 쓴다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" error />);

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('error + focus 는 error 의미가 이긴다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" error />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderColor: T.color.stroke.error,
      borderWidth: FOCUSED_WIDTH,
    });
  });

  it('error가 표면을 바꾸지는 않는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" error />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: T.color.field.surface });
  });
});

describe('disabled 와 readOnly', () => {
  it('disabled여도 표면은 채워진 채로 남는다', async () => {
    // web도 filled disabled에서 base의 surfaceSubtle을 덮어 field.surface로 되돌립니다.
    // "filled는 비활성이어도 filled다"가 디자인 결정입니다.
    await renderWithTheme(<FilledInput accessibilityLabel="probe" disabled />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: T.color.field.surface });
  });

  it('disabled는 disabled 테두리 색을 쓴다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" disabled />);

    expect(getWrapper()).toHaveStyle({ borderColor: T.border.disabled.color });
  });

  it('disabled 테두리는 평상시 테두리와 다른 토큰이다', async () => {
    // light 테마에서는 `field.border`와 `border.disabled.color`가 우연히 같은 값이라
    // 위 테스트만으로는 두 토큰을 구분하지 못합니다. dark 테마에서는 갈라집니다.
    const D = Native.Dark.tokens;
    expect(D.border.disabled.color).not.toBe(D.color.field.border);

    await render(
      <ThemeProvider mode="dark">
        <FilledInput accessibilityLabel="probe" disabled />
      </ThemeProvider>,
    );

    expect(getWrapper()).toHaveStyle({ borderColor: D.border.disabled.color });
  });

  it('disabled는 텍스트 색·편집·접근성을 모두 반영한다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" disabled />);

    expect(getInput()).toHaveStyle({ color: T.color.text.disable });
    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('disabled면 focus 표현이 살아나지 않는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" disabled />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderColor: T.border.disabled.color });
  });

  it('readOnly는 편집만 막고 disabled로 알리지 않는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" readOnly />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('readOnly는 평범한 filled 외형을 유지한다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" readOnly />);

    expect(getWrapper()).toHaveStyle({
      backgroundColor: T.color.field.surface,
      borderColor: T.color.field.border,
    });
    expect(getInput()).toHaveStyle({ color: T.color.text.default });
  });

  it('접근 가능한 이름이 유지된다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" accessibilityHint="hint" />);

    expect(getInput()).toHaveAccessibleName('probe');
    expect(getInput()).toHaveProp('accessibilityHint', 'hint');
  });
});

describe('이름과 값 상태는 무관하다', () => {
  it('value=""여도 filled 시각 variant다', async () => {
    await renderWithTheme(
      <FilledInput accessibilityLabel="probe" value="" onChangeText={jest.fn()} />,
    );

    expect(getWrapper()).toHaveStyle({
      backgroundColor: T.color.field.surface,
      borderRadius: T.radius.md,
      borderWidth: RESTING_WIDTH,
    });
  });

  it('값이 있든 없든 chrome이 같다', async () => {
    const view = await renderWithTheme(
      <FilledInput accessibilityLabel="probe" value="" onChangeText={jest.fn()} />,
    );
    const empty = getWrapper().props.style;

    // `screen.unmount()` 후 다시 render하면 screen이 언마운트된 트리에 묶여 이후 테스트가
    // 전부 깨집니다. 같은 트리를 rerender합니다.
    await view.rerender(
      <ThemeProvider>
        <FilledInput accessibilityLabel="probe" value="abc" onChangeText={jest.fn()} />
      </ThemeProvider>,
    );

    expect(getWrapper().props.style).toEqual(empty);
  });

  it('텍스트를 입력해도 chrome이 바뀌지 않는다', async () => {
    await renderWithTheme(<FilledInput accessibilityLabel="probe" />);
    const before = getWrapper().props.style;

    await fireEvent.changeText(getInput(), 'typed');

    expect(getWrapper().props.style).toEqual(before);
  });
});

describe('소비자 style 우선순위', () => {
  it('평범한 외형은 소비자가 바꿀 수 있다', async () => {
    await renderWithTheme(
      <FilledInput accessibilityLabel="probe" containerStyle={{ backgroundColor: 'rgb(1,2,3)' }} />,
    );

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(1,2,3)' });
  });

  it('소비자 containerStyle이 error 테두리를 지울 수 없다', async () => {
    await renderWithTheme(
      <FilledInput
        accessibilityLabel="probe"
        error
        containerStyle={{ borderColor: 'rgb(1,2,3)', borderWidth: 0 }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('소비자 containerStyle이 disabled 표현을 지울 수 없다', async () => {
    await renderWithTheme(
      <FilledInput
        accessibilityLabel="probe"
        disabled
        containerStyle={{ borderColor: 'rgb(1,2,3)', backgroundColor: 'rgb(4,5,6)' }}
      />,
    );

    expect(getWrapper()).toHaveStyle({
      borderColor: T.border.disabled.color,
      backgroundColor: T.color.field.surface,
    });
  });

  it('소비자가 prop 합성으로 disabled 편집을 되살릴 수 없다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <FilledInput
        accessibilityLabel="probe"
        disabled
        readOnly={false}
        accessibilityState={{ disabled: false }}
        onChangeText={onChangeText}
      />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
    expect(onChangeText).not.toHaveBeenCalled();
  });
});

describe('장식', () => {
  it('장식이 있어도 filled 레이아웃이 깨지지 않는다', async () => {
    await renderWithTheme(
      <FilledInput
        accessibilityLabel="probe"
        startAdornment={<Text testID="start">S</Text>}
        endAdornment={<Text testID="end">E</Text>}
      />,
    );

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['start', 'TextInput', 'end']);
    expect(getWrapper()).toHaveStyle({ backgroundColor: T.color.field.surface });
  });
});

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof FilledInputProps ? true : false;

/** 공개 prop 목록이 내부 원시와 어긋나면 컴파일이 깨집니다(PlainInput과 같은 가드). */
type Assignable<A, B> = A extends B ? true : false;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type BaseWithoutVariant = Omit<InputBaseProps, 'variant'>;

export type FilledMatchesBase = [
  Expect<Equal<keyof FilledInputProps, keyof BaseWithoutVariant>>,
  Expect<Assignable<FilledInputProps, BaseWithoutVariant>>,
  Expect<Assignable<BaseWithoutVariant, FilledInputProps>>,
];

/** web 전용 추상은 공개 prop이 아닙니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'inputProps'> extends false ? true : false>,
  Expect<HasProp<'textareaProps'> extends false ? true : false>,
  Expect<HasProp<'inputRef'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
  Expect<HasProp<'type'> extends false ? true : false>,
  Expect<HasProp<'name'> extends false ? true : false>,
];

/** 값 상태(filled) 개념은 이 컴포넌트의 prop이 아닙니다. */
export type RejectsValueFilledProps = [
  Expect<HasProp<'isFilled'> extends false ? true : false>,
  Expect<HasProp<'filled'> extends false ? true : false>,
  Expect<HasProp<'onFilled'> extends false ? true : false>,
  Expect<HasProp<'onEmpty'> extends false ? true : false>,
];

/** variant는 FilledInput이 고정합니다. */
export type FixesVariant = [Expect<HasProp<'variant'> extends false ? true : false>];

/** 멀쩡한 TextInput prop은 그대로 남습니다. */
export type KeepsValidTextInputProps = [
  Expect<HasProp<'onChangeText'>>,
  Expect<HasProp<'multiline'>>,
  Expect<HasProp<'keyboardType'>>,
  Expect<HasProp<'secureTextEntry'>>,
  Expect<HasProp<'accessibilityHint'>>,
  Expect<HasProp<'testID'>>,
];

/** 접근 가능한 이름은 타입에서 강제합니다. */
export type RequiresAccessibleName = [
  Expect<undefined extends FilledInputProps['accessibilityLabel'] ? false : true>,
];

export const rejectsInvalidProps = () => [
  // @ts-expect-error accessibilityLabel은 필수입니다.
  <FilledInput placeholder="이메일" />,
  // @ts-expect-error variant는 filled로 고정입니다.
  <FilledInput accessibilityLabel="probe" variant="plain" />,
  // @ts-expect-error editable은 disabled·readOnly에서 파생됩니다.
  <FilledInput accessibilityLabel="probe" editable={false} />,
  // @ts-expect-error value는 TextInput 도메인(string)입니다 — unknown으로 넓히지 않습니다.
  <FilledInput accessibilityLabel="probe" value={{}} />,
];
