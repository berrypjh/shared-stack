/**
 * BoxedInput의 variant 계약.
 *
 * boxed는 filled와 테두리·radius가 같고 표면만 다릅니다 — 평상시 투명, disabled일 때만
 * `field.surfaceSubtle`. 아래 "filled와 다르다"가 그 회귀입니다.
 *
 * 편집·포커스·접근성은 InputBase가 검증합니다.
 */
import { Pressable, Text, TextInput } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import type { InputBaseProps } from '../input-base/InputBase.types';

import { BoxedInput } from './BoxedInput';
import type { BoxedInputProps } from './BoxedInput.types';

const T = Native.Light.tokens;

const RESTING_WIDTH = T.border.primary.width;
const FOCUSED_WIDTH = T.component.field.focusRingWidth;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getInput = () => screen.getByLabelText('probe');
const getWrapper = () => getInput().parent!;

describe('구성 — InputBase에 위임한다', () => {
  it('TextInput 하나만 렌더한다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    expect(screen.getAllByLabelText('probe')).toHaveLength(1);
    expect(getInput().type).toBe('TextInput');
  });

  it('ref가 TextInput에 닿는다', async () => {
    const ref = { current: null } as { current: TextInput | null };

    await renderWithTheme(<BoxedInput accessibilityLabel="probe" ref={ref} />);

    expect(typeof ref.current?.focus).toBe('function');
  });

  it('onChangeText가 문자열을 전달한다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(onChangeText).toHaveBeenCalledWith('typed');
  });

  it('controlled value 모델이 그대로다', async () => {
    await renderWithTheme(
      <BoxedInput accessibilityLabel="probe" value="fixed" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('value', 'fixed');
  });

  it('uncontrolled defaultValue가 컴포넌트 상태를 만들지 않는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" defaultValue="initial" />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput().props.value).toBeUndefined();
    expect(getInput()).toHaveDisplayValue('typed');
  });
});

describe('boxed 외형', () => {
  it('사방 테두리와 radius를 canonical 토큰으로 그린다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({
      borderColor: T.color.field.border,
      borderWidth: RESTING_WIDTH,
      borderRadius: T.radius.md,
    });
  });

  it('평상시 표면이 없다 — 투명하다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('가로 안쪽 여백을 유지한다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ paddingHorizontal: T.spacing.lg });
  });

  it('size는 InputBase의 타이포·높이 규약을 그대로 쓴다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" size="sm" />);

    expect(getInput()).toHaveStyle({ fontSize: T.typography.body.small.fontSize });
    expect(getWrapper()).toHaveStyle({ minHeight: T.spacing['4xl'] });
  });
});

describe('filled와 다르다', () => {
  it('평상시 표면이 filled의 채워진 표면이 아니다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    expect(getWrapper()).not.toHaveStyle({ backgroundColor: T.color.field.surface });
  });

  it('disabled 표면은 filled와 다른 subtle 토큰이다', async () => {
    expect(T.color.field.surfaceSubtle).not.toBe(T.color.field.surface);

    await renderWithTheme(<BoxedInput accessibilityLabel="probe" disabled />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: T.color.field.surfaceSubtle });
  });
});

describe('focus 표현', () => {
  it('focus하면 테두리가 active 색으로 굵어진다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderColor: T.border.primary.color,
      borderWidth: FOCUSED_WIDTH,
    });
  });

  it('secondary는 secondary active 색을 쓴다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" color="secondary" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.secondary });
  });

  it('focus해도 표면은 투명하게 남는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('blur하면 평소 테두리로 돌아온다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" />);

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
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" error />);

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('error + focus 는 error 의미가 이긴다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" error />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderColor: T.color.stroke.error,
      borderWidth: FOCUSED_WIDTH,
    });
  });
});

describe('disabled 와 readOnly', () => {
  it('disabled는 subtle 표면과 disabled 테두리를 쓴다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" disabled />);

    expect(getWrapper()).toHaveStyle({
      backgroundColor: T.color.field.surfaceSubtle,
      borderColor: T.border.disabled.color,
    });
  });

  it('disabled 테두리는 평상시 테두리와 다른 토큰이다', async () => {
    // light 테마에서는 두 토큰이 우연히 같은 값이라 구분되지 않습니다. dark에서 갈라집니다.
    const D = Native.Dark.tokens;
    expect(D.border.disabled.color).not.toBe(D.color.field.border);

    await render(
      <ThemeProvider mode="dark">
        <BoxedInput accessibilityLabel="probe" disabled />
      </ThemeProvider>,
    );

    expect(getWrapper()).toHaveStyle({ borderColor: D.border.disabled.color });
  });

  it('disabled는 텍스트 색·편집·접근성을 모두 반영한다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" disabled />);

    expect(getInput()).toHaveStyle({ color: T.color.text.disable });
    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('disabled면 focus 표현이 살아나지 않는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" disabled />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderColor: T.border.disabled.color });
  });

  it('readOnly는 편집만 막고 disabled로 알리지 않는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" readOnly />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('readOnly는 disabled 표면을 쓰지 않는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" readOnly />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'transparent' });
    expect(getInput()).toHaveStyle({ color: T.color.text.default });
  });

  it('접근 가능한 이름이 유지된다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" accessibilityHint="hint" />);

    expect(getInput()).toHaveAccessibleName('probe');
    expect(getInput()).toHaveProp('accessibilityHint', 'hint');
  });
});

describe('multiline — 윤곽선은 래퍼가 가진다', () => {
  it('multiline이어도 래퍼가 boxed chrome을 유지한다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" multiline />);

    expect(getInput()).toHaveProp('multiline', true);
    expect(getWrapper()).toHaveStyle({
      borderWidth: RESTING_WIDTH,
      borderColor: T.color.field.border,
      borderRadius: T.radius.md,
    });
  });

  it('윤곽선이 TextInput이 아니라 래퍼에 있다', async () => {
    // RN TextInput은 한쪽 테두리·radius 처리에 플랫폼 차이가 있어서 chrome을 편집기에 두면
    // multiline에서 깨집니다. 그래서 래퍼 View가 chrome을 가집니다.
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" multiline />);

    const inputStyle = getInput().props.style;
    const flattened = Object.assign({}, ...[inputStyle].flat(Infinity).filter(Boolean));

    expect(flattened.borderWidth).toBeUndefined();
    expect(flattened.borderColor).toBeUndefined();
    expect(flattened.borderRadius).toBeUndefined();
  });

  it('multiline TextInput이 같은 chrome 안에 남는다', async () => {
    await renderWithTheme(<BoxedInput accessibilityLabel="probe" multiline />);

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['TextInput']);
  });
});

describe('장식', () => {
  it('장식이 boxed chrome 안에 들어간다', async () => {
    await renderWithTheme(
      <BoxedInput
        accessibilityLabel="probe"
        startAdornment={<Text testID="start">S</Text>}
        endAdornment={<Text testID="end">E</Text>}
      />,
    );

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['start', 'TextInput', 'end']);
    expect(getWrapper()).toHaveStyle({ borderWidth: RESTING_WIDTH });
  });

  it('장식이 TextInput 접근성을 가리지 않는다', async () => {
    await renderWithTheme(
      <BoxedInput
        accessibilityLabel="probe"
        endAdornment={
          <Pressable accessibilityRole="button" accessibilityLabel="clear" onPress={jest.fn()} />
        }
      />,
    );

    expect(screen.getByLabelText('probe')).toBeOnTheScreen();
    expect(getWrapper().props.accessible).not.toBe(true);
  });

  it('상호작용 가능한 장식은 독립적으로 눌린다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <BoxedInput
        accessibilityLabel="probe"
        endAdornment={
          <Pressable accessibilityRole="button" accessibilityLabel="clear" onPress={onPress} />
        }
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'clear' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('소비자 style 우선순위', () => {
  it('평범한 외형은 소비자가 바꿀 수 있다', async () => {
    await renderWithTheme(
      <BoxedInput accessibilityLabel="probe" containerStyle={{ backgroundColor: 'rgb(1,2,3)' }} />,
    );

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(1,2,3)' });
  });

  it('소비자 containerStyle이 error 테두리를 지울 수 없다', async () => {
    await renderWithTheme(
      <BoxedInput
        accessibilityLabel="probe"
        error
        containerStyle={{ borderColor: 'rgb(1,2,3)', borderWidth: 0 }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('소비자 containerStyle이 disabled 표현을 지울 수 없다', async () => {
    await renderWithTheme(
      <BoxedInput
        accessibilityLabel="probe"
        disabled
        containerStyle={{ borderColor: 'rgb(1,2,3)', backgroundColor: 'rgb(4,5,6)' }}
      />,
    );

    expect(getWrapper()).toHaveStyle({
      borderColor: T.border.disabled.color,
      backgroundColor: T.color.field.surfaceSubtle,
    });
  });

  it('소비자가 prop 합성으로 disabled 편집을 되살릴 수 없다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <BoxedInput
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

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof BoxedInputProps ? true : false;

/** 공개 prop 목록이 내부 원시와 어긋나면 컴파일이 깨집니다(Plain·Filled와 같은 가드). */
type Assignable<A, B> = A extends B ? true : false;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
// `radius` 는 SearchField 전용 내부 seam 이라 공개 variant prop 이 아닙니다.
type BaseWithoutVariant = Omit<InputBaseProps, 'variant' | 'radius'>;

export type BoxedMatchesBase = [
  Expect<Equal<keyof BoxedInputProps, keyof BaseWithoutVariant>>,
  Expect<Assignable<BoxedInputProps, BaseWithoutVariant>>,
  Expect<Assignable<BaseWithoutVariant, BoxedInputProps>>,
];

/** web 전용 추상은 공개 prop이 아닙니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'inputProps'> extends false ? true : false>,
  Expect<HasProp<'textareaProps'> extends false ? true : false>,
  Expect<HasProp<'inputRef'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
  Expect<HasProp<'type'> extends false ? true : false>,
  Expect<HasProp<'name'> extends false ? true : false>,
  Expect<HasProp<'rows'> extends false ? true : false>,
];

/** variant는 BoxedInput이 고정합니다. */
export type FixesVariant = [Expect<HasProp<'variant'> extends false ? true : false>];

/** 멀쩡한 TextInput prop은 그대로 남습니다. */
export type KeepsValidTextInputProps = [
  Expect<HasProp<'onChange'>>,
  Expect<HasProp<'onChangeText'>>,
  Expect<HasProp<'multiline'>>,
  Expect<HasProp<'numberOfLines'>>,
  Expect<HasProp<'keyboardType'>>,
  Expect<HasProp<'secureTextEntry'>>,
  Expect<HasProp<'accessibilityHint'>>,
  Expect<HasProp<'testID'>>,
];

/** 접근 가능한 이름은 타입에서 강제합니다. */
export type RequiresAccessibleName = [
  Expect<undefined extends BoxedInputProps['accessibilityLabel'] ? false : true>,
];

export const rejectsInvalidProps = () => [
  // @ts-expect-error accessibilityLabel은 필수입니다.
  <BoxedInput placeholder="이메일" />,
  // @ts-expect-error variant는 boxed로 고정입니다.
  <BoxedInput accessibilityLabel="probe" variant="filled" />,
  // @ts-expect-error editable은 disabled·readOnly에서 파생됩니다.
  <BoxedInput accessibilityLabel="probe" editable={false} />,
  // @ts-expect-error value는 TextInput 도메인(string)입니다.
  <BoxedInput accessibilityLabel="probe" value={['a']} />,
];
