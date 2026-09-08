/**
 * 내부 InputBase의 동작 계약.
 *
 * RN TextInput 원시만 검증합니다 — variant chrome(border·surface)은 Plain·Filled·Boxed의
 * 관심사입니다. Base가 보장하는 것은 편집 가능 여부, 접근성, 포커스 상태 전달,
 * 장식 배치, style 우선순위까지입니다.
 *
 * web InputBase의 DOM 구조는 옮기지 않습니다 — input/textarea 분기도, event.target.value도,
 * root click→focus도 없습니다.
 */
import { Pressable, Text, TextInput } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';

import { InputBase } from './InputBase';
import type { InputBaseProps } from './InputBase.types';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

/** TextInput은 조회 가능한 role이 없습니다. 접근 가능한 이름으로 찾습니다. */
const getInput = () => screen.getByLabelText('probe');

/** 장식과 TextInput이 담기는 래퍼 View. */
const getWrapper = () => getInput().parent!;

describe('원시와 prop 전달', () => {
  it('실제 RN TextInput 호스트를 렌더한다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" />);

    expect(getInput()).toBeOnTheScreen();
    expect(getInput().type).toBe('TextInput');
  });

  it('네이티브 TextInput prop을 그대로 전달한다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        testID="probe-id"
        maxLength={10}
        keyboardType="email-address"
        secureTextEntry
        autoComplete="email"
      />,
    );

    expect(screen.getByTestId('probe-id')).toBeOnTheScreen();
    expect(getInput()).toHaveProp('maxLength', 10);
    expect(getInput()).toHaveProp('keyboardType', 'email-address');
    expect(getInput()).toHaveProp('secureTextEntry', true);
    expect(getInput()).toHaveProp('autoComplete', 'email');
  });

  it('공유 계약의 autoFocus·multiline을 TextInput에 전달한다', async () => {
    // 둘 다 ui-core `InputFieldSemanticProps`가 소유하고 `TextInputProps`에서는 제외됩니다.
    // 승격 근거가 "RN도 같은 불변식을 구현한다"이므로 실제 전달을 확인합니다.
    await renderWithTheme(<InputBase accessibilityLabel="probe" autoFocus multiline />);

    expect(getInput()).toHaveProp('autoFocus', true);
    expect(getInput()).toHaveProp('multiline', true);
  });

  it('placeholder를 전달하고 placeholderTextColor는 canonical 토큰을 쓴다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" placeholder="이메일" />);

    expect(getInput()).toHaveProp('placeholder', '이메일');
    expect(getInput()).toHaveProp('placeholderTextColor', T.color.text.placeholder);
  });

  it('ref가 래퍼 View가 아니라 TextInput에 닿는다', async () => {
    const ref = { current: null } as { current: TextInput | null };

    await renderWithTheme(<InputBase accessibilityLabel="probe" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.focus).toBe('function');
    expect(typeof ref.current?.blur).toBe('function');
    expect(typeof ref.current?.isFocused).toBe('function');
  });
});

describe('value 모델', () => {
  it('value를 전달한다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" value="fixed" />);

    expect(getInput()).toHaveProp('value', 'fixed');
  });

  it('defaultValue를 전달한다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" defaultValue="initial" />);

    expect(getInput()).toHaveProp('defaultValue', 'initial');
    expect(getInput()).toHaveDisplayValue('initial');
  });

  it('onChangeText가 DOM 이벤트가 아니라 문자열을 받는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<InputBase accessibilityLabel="probe" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), 'typed');

    expect(onChangeText).toHaveBeenCalledWith('typed');
    expect(typeof onChangeText.mock.calls[0][0]).toBe('string');
  });

  it('네이티브 onChange는 RN 이벤트로 남는다 (event.target.value 어댑터가 없다)', async () => {
    const onChange = jest.fn();
    await renderWithTheme(<InputBase accessibilityLabel="probe" onChange={onChange} />);

    await fireEvent(getInput(), 'change', { nativeEvent: { text: 'typed' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].nativeEvent.text).toBe('typed');
    expect(onChange.mock.calls[0][0].target).toBeUndefined();
  });
});

describe('controlled / uncontrolled', () => {
  it('controlled value는 소비자 것이다 — Base가 새 값을 지어내지 않는다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" value="fixed" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('value', 'fixed');
  });

  it('defaultValue가 컴포넌트 소유 상태를 만들지 않는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" defaultValue="initial" />);

    await fireEvent.changeText(getInput(), 'typed');

    // value prop이 생겼다면 Base가 텍스트 상태를 들고 있다는 뜻입니다.
    expect(getInput().props.value).toBeUndefined();
    expect(getInput()).toHaveDisplayValue('typed');
  });
});

describe('focus 상태', () => {
  it('onFocus / onBlur 소비자 콜백을 호출한다', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" onFocus={onFocus} onBlur={onBlur} />,
    );

    await fireEvent(getInput(), 'focus');
    await fireEvent(getInput(), 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('focus하면 containerStyle 콜백이 focused=true를 받는다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        containerStyle={({ focused }) => ({
          backgroundColor: focused ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)',
        })}
      />,
    );

    await fireEvent(getInput(), 'focus');

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(9, 9, 9)' });
  });

  it('blur하면 focused 상태가 풀린다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        containerStyle={({ focused }) => ({
          backgroundColor: focused ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)',
        })}
      />,
    );

    await fireEvent(getInput(), 'focus');
    await fireEvent(getInput(), 'blur');

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 0)' });
  });

  it('disabled면 focused 시각 상태가 살아나지 않는다', async () => {
    const { rerender } = await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        containerStyle={({ focused }) => ({
          backgroundColor: focused ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)',
        })}
      />,
    );

    await fireEvent(getInput(), 'focus');
    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(9, 9, 9)' });

    await rerender(
      <ThemeProvider>
        <InputBase
          accessibilityLabel="probe"
          disabled
          containerStyle={({ focused }) => ({
            backgroundColor: focused ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)',
          })}
        />
      </ThemeProvider>,
    );

    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 0)' });
  });
});

describe('disabled', () => {
  it('편집을 막는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" disabled onChangeText={onChangeText} />,
    );

    await fireEvent.changeText(getInput(), 'typed');

    expect(getInput()).toHaveProp('editable', false);
    expect(onChangeText).not.toHaveBeenCalled();
  });

  it('접근성으로 disabled를 알린다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" disabled />);

    // RN TextInput은 Pressable과 달리 editable에서 accessibilityState를 파생하지 않으므로
    // Base가 직접 실어야 합니다. `toBeDisabled()`로는 이것을 검증할 수 없습니다 — RNTL의
    // computeAriaDisabled는 editable=false만 봐도 disabled라고 답해서, Base가
    // accessibilityState를 아예 싣지 않아도 통과합니다. 플랫폼에 실제로 전달되는 값을 봅니다.
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
    expect(getInput()).toBeDisabled();
  });

  it('disabled 텍스트 색 토큰을 쓴다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" disabled />);

    expect(getInput()).toHaveStyle({ color: T.color.text.disable });
  });
});

describe('readOnly는 disabled와 다르다', () => {
  it('편집을 막는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" readOnly onChangeText={onChangeText} />,
    );

    expect(getInput()).toHaveProp('editable', false);
    expect(onChangeText).not.toHaveBeenCalled();
  });

  it('disabled로 알리지 않는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" readOnly />);

    // 스크린 리더에 도달하는 값으로 봅니다. RNTL의 `toBeEnabled()`는 여기서 쓸 수 없습니다 —
    // computeAriaDisabled가 editable=false를 곧 disabled로 취급해서, readOnly와 disabled를
    // 구분하지 못합니다(accessibility.js:205-208).
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('disabled 텍스트 색을 쓰지 않는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" readOnly />);

    expect(getInput()).toHaveStyle({ color: T.color.text.default });
  });

  it('readOnly를 TextInput에 넘기지 않는다 — editable이 유일한 메커니즘이다', async () => {
    // RN TextInput.js는 `editable={readOnly !== undefined ? !readOnly : editable}`이라
    // readOnly를 함께 넘기면 우리가 계산한 editable을 덮어씁니다.
    await renderWithTheme(<InputBase accessibilityLabel="probe" disabled readOnly={false} />);

    expect(getInput().props.readOnly).toBeUndefined();
    expect(getInput()).toHaveProp('editable', false);
  });
});

describe('multiline', () => {
  it('TextInput 하나를 유지한 채 multiline만 전달한다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" multiline />);

    expect(screen.getAllByLabelText('probe')).toHaveLength(1);
    expect(getInput()).toHaveProp('multiline', true);
  });
});

describe('접근성', () => {
  it('accessibilityLabel과 accessibilityHint가 TextInput에 닿는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" accessibilityHint="hint" />);

    expect(getInput()).toHaveAccessibleName('probe');
    expect(getInput()).toHaveProp('accessibilityHint', 'hint');
  });

  it('placeholder는 접근 가능한 이름이 되지 못한다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" placeholder="이메일" />);

    expect(screen.queryByLabelText('이메일')).toBeNull();
    expect(getInput()).toHaveAccessibleName('probe');
  });

  it('래퍼 View가 자식 접근성을 삼키지 않는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" />);

    expect(getWrapper().props.accessible).not.toBe(true);
  });

  it('소비자 accessibilityState의 다른 키는 보존된다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" accessibilityState={{ selected: true }} />,
    );

    expect(getInput()).toBeSelected();
  });

  it('소비자가 accessibilityState.disabled=false로 실제 disabled를 덮어쓸 수 없다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" disabled accessibilityState={{ disabled: false }} />,
    );

    expect(getInput()).toBeDisabled();
    expect(getInput()).toHaveProp('editable', false);
  });
});

describe('장식(adornment)', () => {
  it('start는 앞에, end는 뒤에 놓인다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        startAdornment={<Text testID="start">S</Text>}
        endAdornment={<Text testID="end">E</Text>}
      />,
    );

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['start', 'TextInput', 'end']);
  });

  it('장식 없이도 TextInput 하나만 남는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" />);

    const order = getWrapper().children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? child.type),
    );

    expect(order).toEqual(['TextInput']);
  });

  it('상호작용 가능한 장식은 독립적으로 눌린다', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        endAdornment={
          <Pressable accessibilityRole="button" accessibilityLabel="clear" onPress={onPress}>
            <Text>x</Text>
          </Pressable>
        }
      />,
    );

    const clear = screen.getByRole('button', { name: 'clear' });
    await fireEvent.press(clear);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('style 우선순위', () => {
  it('style은 TextInput을, containerStyle은 래퍼를 겨냥한다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        style={{ letterSpacing: 3 }}
        containerStyle={{ backgroundColor: 'rgb(1, 2, 3)' }}
      />,
    );

    expect(getInput()).toHaveStyle({ letterSpacing: 3 });
    expect(getWrapper()).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  it('소비자 style이 평범한 외형은 바꿀 수 있다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" style={{ color: 'rgb(1, 2, 3)' }} />,
    );

    expect(getInput()).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });

  it('소비자 style이 disabled 텍스트 색을 지울 수 없다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" disabled style={{ color: 'rgb(1, 2, 3)' }} />,
    );

    expect(getInput()).toHaveStyle({ color: T.color.text.disable });
  });

  it('소비자 containerStyle이 최소 터치 타깃을 줄일 수 없다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" containerStyle={{ minHeight: 0 }} />,
    );

    expect(getWrapper()).toHaveStyle({ minHeight: T.component.field.height.md });
  });

  it('fullWidth는 래퍼를 늘린다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" fullWidth />);

    expect(getWrapper()).toHaveStyle({ alignSelf: 'stretch' });
  });
});

describe('size 토큰', () => {
  it('md는 canonical field 높이와 body.medium 타이포를 쓴다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" />);

    expect(getWrapper()).toHaveStyle({ minHeight: T.component.field.height.md });
    expect(getInput()).toHaveStyle({ fontSize: T.typography.body.medium.fontSize });
  });

  it('sm은 body.small 타이포를 쓰고 최소 터치 타깃 아래로 내려가지 않는다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" size="sm" />);

    expect(getInput()).toHaveStyle({ fontSize: T.typography.body.small.fontSize });
    // canonical `field.height.sm`(40)은 모바일 최소 터치 타깃(48)보다 작습니다.
    expect(getWrapper()).toHaveStyle({ minHeight: T.spacing['4xl'] });
  });
});

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof InputBaseProps ? true : false;

/** web 전용 추상은 RN Base의 prop이 아닙니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'inputProps'> extends false ? true : false>,
  Expect<HasProp<'textareaProps'> extends false ? true : false>,
  Expect<HasProp<'inputRef'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
  Expect<HasProp<'inputClassName'> extends false ? true : false>,
  Expect<HasProp<'type'> extends false ? true : false>,
  Expect<HasProp<'name'> extends false ? true : false>,
  Expect<HasProp<'startAdornmentClassName'> extends false ? true : false>,
];

/** 불변식과 충돌하는 prop도 막습니다. */
export type RejectsInvariantBreakingProps = [
  // `editable`은 disabled·readOnly에서 파생됩니다. 두 번째 진실 공급원이 되면 안 됩니다.
  Expect<HasProp<'editable'> extends false ? true : false>,
];

/** 멀쩡한 TextInput prop을 괜히 좁히지는 않습니다. */
export type KeepsValidTextInputProps = [
  Expect<HasProp<'onChange'>>,
  Expect<HasProp<'onChangeText'>>,
  Expect<HasProp<'multiline'>>,
  Expect<HasProp<'keyboardType'>>,
  Expect<HasProp<'inputMode'>>,
  Expect<HasProp<'secureTextEntry'>>,
  Expect<HasProp<'autoComplete'>>,
  Expect<HasProp<'maxLength'>>,
  Expect<HasProp<'selectTextOnFocus'>>,
  Expect<HasProp<'accessibilityHint'>>,
  Expect<HasProp<'accessibilityState'>>,
  Expect<HasProp<'testID'>>,
];

/** value는 TextInput의 도메인(string)을 그대로 씁니다. */
export type ValueMatchesTextInput = [
  Expect<InputBaseProps['value'] extends string | undefined ? true : false>,
  Expect<InputBaseProps['defaultValue'] extends string | undefined ? true : false>,
];

/** 접근 가능한 이름은 타입에서 강제합니다 — placeholder로 대체할 수 없습니다. */
export type RequiresAccessibleName = [
  Expect<undefined extends InputBaseProps['accessibilityLabel'] ? false : true>,
];

/** 잘못된 value 타입은 거부합니다. */
export const rejectsInvalidValue = () => [
  // @ts-expect-error value는 배열이 아닙니다 (web은 readonly string[]을 허용).
  <InputBase accessibilityLabel="probe" value={['a']} />,
  // @ts-expect-error value는 숫자가 아닙니다.
  <InputBase accessibilityLabel="probe" value={1} />,
  // @ts-expect-error accessibilityLabel은 필수입니다.
  <InputBase placeholder="이메일" />,
  // @ts-expect-error editable은 disabled·readOnly에서 파생됩니다.
  <InputBase accessibilityLabel="probe" editable={false} />,
];

/**
 * `radius`는 내부 seam입니다. SearchField가 rounded 필드를 그리려면 필요하고,
 * `containerStyle`로는 불가능합니다 — error·disabled일 때 state-critical chrome이
 * radius를 포함해 다시 얹혀 소비자 값을 덮기 때문입니다.
 */
describe('radius seam', () => {
  it('상자형 variant의 기본 radius를 대신한다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" variant="boxed" radius={T.radius.rounded} />,
    );

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.rounded });
  });

  it('생략하면 canonical 기본값을 그대로 쓴다', async () => {
    await renderWithTheme(<InputBase accessibilityLabel="probe" variant="boxed" />);

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.md });
  });

  it('error일 때도 유지된다 — containerStyle이 못 하는 지점이다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        variant="boxed"
        error
        radius={T.radius.rounded}
        containerStyle={{ borderRadius: 1 }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.rounded });
  });

  it('disabled일 때도 유지된다', async () => {
    await renderWithTheme(
      <InputBase
        accessibilityLabel="probe"
        variant="filled"
        disabled
        radius={T.radius.rounded}
        containerStyle={{ borderRadius: 1 }}
      />,
    );

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.rounded });
  });

  it('plain은 밑줄이라 radius를 받지 않는다', async () => {
    await renderWithTheme(
      <InputBase accessibilityLabel="probe" variant="plain" radius={T.radius.rounded} />,
    );

    expect(getWrapper()).toHaveStyle({ borderRadius: 0 });
  });
});
