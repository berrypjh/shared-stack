/**
 * PlainInput의 variant 계약.
 *
 * 편집·포커스·접근성은 InputBase가 검증합니다. 여기서는 plain 시각 의미와 위임이 끊기지
 * 않았다는 최소 회귀만 봅니다 — InputBase 스위트를 복제하지 않습니다.
 *
 * web의 `box-shadow: 0 1px 0 0`은 옮기지 않습니다. 의도는 "포커스 시 밑줄이 굵어진다"이고
 * RN에서는 `component.field.focusRingWidth`로 표현합니다.
 */
import { Text, TextInput } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import type { InputBaseProps } from '../input-base/InputBase.types';

import { PlainInput } from './PlainInput';
import type { PlainInputProps } from './PlainInput.types';

const T = Native.Light.tokens;

const RESTING_WIDTH = T.border.primary.width;
const FOCUSED_WIDTH = T.component.field.focusRingWidth;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getInput = () => screen.getByLabelText('probe');
const getWrapper = () => getInput().parent!;

describe('구성 — InputBase에 위임한다', () => {
  it('TextInput 하나만 렌더한다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    expect(screen.getAllByLabelText('probe')).toHaveLength(1);
    expect(getInput().type).toBe('TextInput');
  });

  it('ref가 TextInput에 닿는다', async () => {
    const ref = { current: null } as { current: TextInput | null };

    await renderWithTheme(<PlainInput accessibilityLabel="probe" ref={ref} />);

    expect(typeof ref.current?.focus).toBe('function');
  });

  it('onChangeText가 문자열을 전달한다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<PlainInput accessibilityLabel="probe" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(onChangeText).toHaveBeenCalledWith('typed');
  });

  it('controlled value 모델이 그대로다', async () => {
    await renderWithTheme(
      <PlainInput accessibilityLabel="probe" value="fixed" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('value', 'fixed');
  });
});

describe('plain 외형', () => {
  it('표면이 없다 — 투명하고 radius가 없다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'transparent', borderRadius: 0 });
  });

  it('아래쪽 테두리만 canonical field 토큰으로 그린다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({
      borderBottomWidth: RESTING_WIDTH,
      borderBottomColor: T.color.field.border,
    });
  });

  it('가로 안쪽 여백이 없다 — 밑줄이 필드 폭을 가득 채운다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ paddingHorizontal: 0 });
  });

  it('size는 InputBase의 타이포·높이 규약을 그대로 쓴다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" size="sm" />);

    expect(getInput()).toHaveStyle({ fontSize: T.typography.body.small.fontSize });
    expect(getWrapper()).toHaveStyle({ minHeight: T.spacing['4xl'] });
  });
});

describe('focus 표현', () => {
  it('focus하면 밑줄이 active 색으로 굵어진다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderBottomColor: T.border.primary.color,
      borderBottomWidth: FOCUSED_WIDTH,
    });
  });

  it('secondary는 secondary active 색을 쓴다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" color="secondary" />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderBottomColor: T.color.stroke.secondary });
  });

  it('blur하면 평소 테두리로 돌아온다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" />);

    await fireEvent(getInput(), 'focus');
    await fireEvent(getInput(), 'blur');

    expect(getWrapper()).toHaveStyle({
      borderBottomColor: T.color.field.border,
      borderBottomWidth: RESTING_WIDTH,
    });
  });
});

describe('error 표현', () => {
  it('error는 error 색 밑줄을 쓴다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" error />);

    expect(getWrapper()).toHaveStyle({ borderBottomColor: T.color.stroke.error });
  });

  it('error + focus 는 error 의미가 이긴다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" error />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({
      borderBottomColor: T.color.stroke.error,
      borderBottomWidth: FOCUSED_WIDTH,
    });
  });
});

describe('disabled 와 readOnly', () => {
  it('disabled는 disabled 테두리 색을 쓰고 표면은 여전히 투명하다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" disabled />);

    expect(getWrapper()).toHaveStyle({
      borderBottomColor: T.border.disabled.color,
      backgroundColor: 'transparent',
    });
  });

  it('disabled 테두리는 평상시 테두리와 다른 토큰이다', async () => {
    // light 테마에서는 `field.border`와 `border.disabled.color`가 우연히 같은 값(#667085)이라
    // 위 테스트만으로는 두 토큰을 구분하지 못합니다. dark 테마에서는 갈라집니다.
    const D = Native.Dark.tokens;
    expect(D.border.disabled.color).not.toBe(D.color.field.border);

    await render(
      <ThemeProvider mode="dark">
        <PlainInput accessibilityLabel="probe" disabled />
      </ThemeProvider>,
    );

    expect(getWrapper()).toHaveStyle({ borderBottomColor: D.border.disabled.color });
  });

  it('disabled는 편집을 막고 접근성으로 알린다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" disabled />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('disabled면 focus 표현이 살아나지 않는다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" disabled />);

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ borderBottomColor: T.border.disabled.color });
  });

  it('readOnly는 편집만 막고 disabled로 알리지 않는다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" readOnly />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('접근 가능한 이름이 유지된다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" accessibilityHint="hint" />);

    expect(getInput()).toHaveAccessibleName('probe');
    expect(getInput()).toHaveProp('accessibilityHint', 'hint');
  });
});

describe('multiline 과 장식', () => {
  it('multiline이어도 plain chrome을 유지한다', async () => {
    await renderWithTheme(<PlainInput accessibilityLabel="probe" multiline />);

    expect(getInput()).toHaveProp('multiline', true);
    expect(getWrapper()).toHaveStyle({
      borderBottomWidth: RESTING_WIDTH,
      backgroundColor: 'transparent',
    });
  });

  it('장식이 있어도 plain 레이아웃이 깨지지 않는다', async () => {
    await renderWithTheme(
      <PlainInput
        accessibilityLabel="probe"
        startAdornment={<Text testID="start">S</Text>}
        endAdornment={<Text testID="end">E</Text>}
      />,
    );

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['start', 'TextInput', 'end']);
    expect(getWrapper()).toHaveStyle({ paddingHorizontal: 0, borderBottomWidth: RESTING_WIDTH });
  });
});

describe('소비자 style 우선순위', () => {
  it('평범한 외형은 소비자가 바꿀 수 있다', async () => {
    await renderWithTheme(
      <PlainInput accessibilityLabel="probe" containerStyle={{ opacity: 0.5 }} />,
    );

    expect(getWrapper()).toHaveStyle({ opacity: 0.5 });
  });

  it('소비자 containerStyle이 error 밑줄을 지울 수 없다', async () => {
    await renderWithTheme(
      <PlainInput
        accessibilityLabel="probe"
        error
        containerStyle={{ borderBottomColor: 'rgb(1, 2, 3)', borderBottomWidth: 0 }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderBottomColor: T.color.stroke.error });
  });

  it('소비자 containerStyle이 disabled 표현을 지울 수 없다', async () => {
    await renderWithTheme(
      <PlainInput
        accessibilityLabel="probe"
        disabled
        containerStyle={{ borderBottomColor: 'rgb(1, 2, 3)' }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderBottomColor: T.border.disabled.color });
  });

  it('소비자가 prop 합성으로 disabled 편집을 되살릴 수 없다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <PlainInput
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
type HasProp<K extends string> = K extends keyof PlainInputProps ? true : false;

/**
 * 공개 prop 목록이 내부 원시와 어긋나면 컴파일이 깨집니다.
 *
 * `PlainInputProps`는 `Omit<InputBaseProps, 'variant'>`를 재사용하지 않고 `TextInputProps`에서
 * 다시 파생합니다 — 그래야 `dts-bundle-generator`가 내부 타입을 공개 선언으로 끌어올리지
 * 않습니다. 대신 이 가드가 두 목록의 드리프트를 막습니다.
 *
 * 키 집합과 상호 대입 가능성을 함께 봅니다. 어느 하나로는 부족합니다 —
 * 동일성(`Equal<A, B>`)은 교차 타입과 평탄화된 `Omit`을 다른 것으로 봐서 키가 같아도
 * 실패하고, 상호 대입 가능성만으로는 한쪽에만 있는 **선택적** prop을 잡지 못합니다.
 *
 * 타입 테스트를 `.types.ts`가 아니라 여기 두는 이유: 테스트 파일은 공개 배럴에 실릴 일이
 * 없어서 `InputBaseProps` 참조가 선언으로 새지 않습니다.
 */
type Assignable<A, B> = A extends B ? true : false;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type BaseWithoutVariant = Omit<InputBaseProps, 'variant'>;

export type PlainMatchesBase = [
  Expect<Equal<keyof PlainInputProps, keyof BaseWithoutVariant>>,
  Expect<Assignable<PlainInputProps, BaseWithoutVariant>>,
  Expect<Assignable<BaseWithoutVariant, PlainInputProps>>,
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

/** variant는 PlainInput이 고정합니다 — 소비자가 바꿀 수 없습니다. */
export type FixesVariant = [Expect<HasProp<'variant'> extends false ? true : false>];

/** 멀쩡한 TextInput prop은 그대로 남습니다. */
export type KeepsValidTextInputProps = [
  Expect<HasProp<'onChangeText'>>,
  Expect<HasProp<'multiline'>>,
  Expect<HasProp<'keyboardType'>>,
  Expect<HasProp<'secureTextEntry'>>,
  Expect<HasProp<'maxLength'>>,
  Expect<HasProp<'accessibilityHint'>>,
  Expect<HasProp<'testID'>>,
];

/** 접근 가능한 이름은 타입에서 강제합니다. */
export type RequiresAccessibleName = [
  Expect<undefined extends PlainInputProps['accessibilityLabel'] ? false : true>,
];

export const rejectsInvalidProps = () => [
  // @ts-expect-error accessibilityLabel은 필수입니다.
  <PlainInput placeholder="이메일" />,
  // @ts-expect-error variant는 plain으로 고정입니다.
  <PlainInput accessibilityLabel="probe" variant="boxed" />,
  // @ts-expect-error editable은 disabled·readOnly에서 파생됩니다.
  <PlainInput accessibilityLabel="probe" editable={false} />,
  // @ts-expect-error value는 TextInput 도메인(string)입니다.
  <PlainInput accessibilityLabel="probe" value={1} />,
];
