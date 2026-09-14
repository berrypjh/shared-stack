/**
 * RN TextField 의 합성 계약.
 *
 * TextField 는 조율만 합니다 — 값·포커스·chrome·상태 우선순위는 FormControl 과 Input 이
 * 소유합니다. 여기서 검증하는 것은 "무엇을 세우고 무엇을 넘기는가" 입니다.
 *
 * 보장: TextInput 은 언제나 비어 있지 않은 이름을 갖고(문자열 label 또는 명시 label),
 * helper/error 텍스트가 눈에 보입니다.
 * 보장하지 않음: helper 와 입력의 프로그래밍적 설명 관계, required 의 접근성 고지.
 * RN 에 대응 수단이 없어서 흉내 내지 않습니다.
 */
import { createRef } from 'react';
import { Text, type TextInput } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';

import { TextField } from './TextField';
import type { TextFieldProps } from './TextField.types';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

/** 라벨 Text 와 헷갈리지 않도록 입력은 testID 로 찾습니다. */
const getInput = () => screen.getByTestId('field');
const getFieldWrapper = () => getInput().parent!;

describe('합성', () => {
  it('FormControl · Label · Input · Helper 를 한 트리에 세운다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" helperText="두 글자 이상" />);

    expect(screen.getByText('이름')).toBeOnTheScreen();
    expect(getInput()).toBeOnTheScreen();
    expect(screen.getByText('두 글자 이상')).toBeOnTheScreen();
  });

  it('label 이 없으면 라벨을 그리지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" accessibilityLabel="이름" />);

    expect(screen.queryByText('이름')).toBeNull();
  });

  it('helperText 가 없으면 헬퍼를 그리지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" />);

    expect(screen.queryByText('두 글자 이상')).toBeNull();
  });

  it('빈 문자열 label·helperText 는 내용 없음으로 본다', async () => {
    await renderWithTheme(
      <TextField testID="field" accessibilityLabel="이름" label="" helperText="" />,
    );

    // 빈 Text 도 그리지 않습니다 — web `hasTextFieldContent` 와 같은 규칙입니다.
    expect(screen.queryByText('')).toBeNull();
  });

  it('variant 기본값 boxed — 사방 테두리에 표면이 없다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" />);

    expect(getFieldWrapper()).toHaveStyle({
      borderWidth: T.border.primary.width,
      borderRadius: T.radius.md,
      backgroundColor: 'transparent',
    });
  });

  it('variant filled 는 표면을 얻는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" variant="filled" />);

    expect(getFieldWrapper()).toHaveStyle({ backgroundColor: T.color.field.surface });
  });

  it('variant plain 은 밑줄만 있다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" variant="plain" />);

    expect(getFieldWrapper()).toHaveStyle({
      borderRadius: 0,
      borderBottomWidth: T.border.primary.width,
    });
  });

  it('rootStyle 은 합성 전체를 감싸는 FormControl 루트로 간다', async () => {
    await renderWithTheme(
      <TextField
        testID="field"
        label="이름"
        helperText="두 글자 이상"
        rootStyle={{ backgroundColor: 'rgb(7, 7, 7)' }}
      />,
    );

    // 루트는 라벨·입력·헬퍼를 모두 담는 조상입니다.
    const root = screen.getByText('이름').parent!;
    expect(root).toHaveStyle({ backgroundColor: 'rgb(7, 7, 7)' });
    expect(root).toContainElement(getInput());
    expect(root).toContainElement(screen.getByText('두 글자 이상'));
  });

  it('multiline 이어도 TextInput 은 하나다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" multiline />);

    expect(screen.getAllByTestId('field')).toHaveLength(1);
    expect(getInput()).toHaveProp('multiline', true);
  });
});

describe('값 모델은 기존 Input 계약 그대로다', () => {
  it('controlled value 는 소비자 것이다', async () => {
    await renderWithTheme(
      <TextField testID="field" label="이름" value="고정" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), '타이핑');

    expect(getInput()).toHaveProp('value', '고정');
  });

  it('defaultValue 는 네이티브가 소유한다 — TextField 가 상태를 만들지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" defaultValue="초기" />);

    await fireEvent.changeText(getInput(), '타이핑');

    // value prop 이 생겼다면 누군가 텍스트 상태를 들고 있다는 뜻입니다.
    expect(getInput().props.value).toBeUndefined();
    expect(getInput()).toHaveDisplayValue('타이핑');
  });

  it('onChangeText 가 문자열을 받는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<TextField testID="field" label="이름" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), '타이핑');

    expect(onChangeText).toHaveBeenCalledWith('타이핑');
    expect(typeof onChangeText.mock.calls[0][0]).toBe('string');
  });

  it('네이티브 TextInput prop 을 그대로 전달한다', async () => {
    await renderWithTheme(
      <TextField
        testID="field"
        label="이름"
        autoFocus
        keyboardType="email-address"
        secureTextEntry
        maxLength={10}
        numberOfLines={3}
        inputMode="email"
      />,
    );

    expect(getInput()).toHaveProp('autoFocus', true);
    expect(getInput()).toHaveProp('keyboardType', 'email-address');
    expect(getInput()).toHaveProp('secureTextEntry', true);
    expect(getInput()).toHaveProp('maxLength', 10);
    expect(getInput()).toHaveProp('numberOfLines', 3);
    expect(getInput()).toHaveProp('inputMode', 'email');
  });

  it('readOnly 는 disabled 가 아니다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" readOnly />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('ref 는 TextInput 을 가리킨다 — focus 경로가 분명하다', async () => {
    const ref = createRef<TextInput>();
    await renderWithTheme(<TextField testID="field" label="이름" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.focus).toBe('function');
  });
});

describe('상태는 FormControl 한 곳에서 내려온다', () => {
  it('disabled 가 입력까지 도달한다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" disabled />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('disabled 가 라벨 색까지 내려간다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" disabled />);

    expect(screen.getByText('이름')).toHaveStyle({ color: T.color.text.disable });
  });

  it('error 가 입력 테두리와 헬퍼 색에 함께 나타난다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" helperText="필수입니다" error />);

    expect(getFieldWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
    expect(screen.getByText('필수입니다')).toHaveStyle({ color: T.color.text.error });
  });

  it('required 는 라벨에 시각 표시를 만든다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" required />);

    expect(screen.getByText(/\*/)).toBeOnTheScreen();
  });

  it('size 가 필드 높이를 바꾼다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" size="sm" />);

    expect(getFieldWrapper()).toHaveStyle({
      minHeight: Math.max(T.component.field.height.sm, T.spacing['4xl']),
    });
  });

  it('fullWidth 가 기존 아키텍처를 통해 흐른다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" fullWidth />);

    expect(getFieldWrapper()).toHaveStyle({ alignSelf: 'stretch' });
  });

  it('focus 는 FormControl 하나가 권한을 갖는다 — 라벨이 따라 바뀐다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" />);

    await fireEvent(getInput(), 'focus');

    expect(screen.getByText('이름')).toHaveStyle({ color: T.color.text.primary });
  });

  it('blur 하면 라벨이 평상시로 돌아온다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" />);

    await fireEvent(getInput(), 'focus');
    await fireEvent(getInput(), 'blur');

    expect(screen.getByText('이름')).toHaveStyle({ color: T.color.text.default });
  });
});

describe('접근 가능한 이름', () => {
  it('문자열 label 이 입력의 이름이 된다 — 독립 InputLabel 보다 강한 보장이다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" />);

    expect(getInput()).toHaveProp('accessibilityLabel', '이름');
  });

  it('명시 accessibilityLabel 이 이긴다 — 보이는 라벨과 말하는 이름이 달라도 된다', async () => {
    await renderWithTheme(
      <TextField testID="field" label="이름" accessibilityLabel="사용자 이름을 입력하세요" />,
    );

    expect(screen.getByText('이름')).toBeOnTheScreen();
    expect(getInput()).toHaveProp('accessibilityLabel', '사용자 이름을 입력하세요');
  });

  it('label 이 ReactNode 면 문자열을 추출하지 않는다 — 명시 이름을 그대로 쓴다', async () => {
    await renderWithTheme(
      <TextField testID="field" label={<Text>이름</Text>} accessibilityLabel="사용자 이름" />,
    );

    expect(screen.getByText('이름')).toBeOnTheScreen();
    expect(getInput()).toHaveProp('accessibilityLabel', '사용자 이름');
  });

  it('label 이 없어도 명시 이름으로 이름이 보장된다', async () => {
    await renderWithTheme(<TextField testID="field" accessibilityLabel="이름" />);

    expect(getInput()).toHaveProp('accessibilityLabel', '이름');
  });

  it('placeholder 는 이름이 되지 않는다', async () => {
    await renderWithTheme(
      <TextField testID="field" accessibilityLabel="이름" placeholder="홍길동" />,
    );

    expect(getInput()).toHaveProp('placeholder', '홍길동');
    expect(getInput()).toHaveProp('accessibilityLabel', '이름');
  });

  it('빈 문자열 label 은 이름이 되지 못한다', async () => {
    await renderWithTheme(<TextField testID="field" label="" accessibilityLabel="이름" />);

    expect(getInput()).toHaveProp('accessibilityLabel', '이름');
  });
});

describe('helper 는 보이는 텍스트일 뿐이다', () => {
  it('helper 를 accessibilityHint 로 만들지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" helperText="두 글자 이상" />);

    // hint 는 "이 동작의 결과"를 말합니다. helper 는 필드/값을 설명합니다 — 다른 의미입니다.
    expect(getInput().props.accessibilityHint).toBeUndefined();
  });

  it('입력과의 설명 관계를 지어내지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" helperText="두 글자 이상" />);

    expect(getInput().props.accessibilityLabelledBy).toBeUndefined();
    expect(getInput().props['aria-describedby']).toBeUndefined();
    expect(getInput().props['aria-labelledby']).toBeUndefined();
  });

  it('오류 helper 를 자동으로 라이브 리전으로 만들지 않는다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" helperText="필수입니다" error />);

    const helper = screen.getByText('필수입니다');
    expect(helper.props.accessibilityLiveRegion).toBeUndefined();
    expect(helper.props['aria-live']).toBeUndefined();
  });

  it('ReactNode helper 도 그대로 그린다', async () => {
    await renderWithTheme(
      <TextField testID="field" label="이름" helperText={<Text>노드 헬퍼</Text>} />,
    );

    expect(screen.getByText('노드 헬퍼')).toBeOnTheScreen();
  });
});

describe('두 번째 상태 기계를 만들지 않는다', () => {
  it('TextField 는 focus 를 스스로 들고 있지 않다 — FormControl 이 통제한다', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" focused />);

    // 소비자가 FormControl 의 focused 를 직접 통제할 수 있어야 합니다.
    expect(screen.getByText('이름')).toHaveStyle({ color: T.color.text.primary });
  });

  it('disabled 는 소비자가 준 focused 를 이긴다 (FormControl 규칙 그대로)', async () => {
    await renderWithTheme(<TextField testID="field" label="이름" focused disabled />);

    expect(screen.getByText('이름')).toHaveStyle({ color: T.color.text.disable });
  });
});

/** 타입 수준 계약. jest 는 타입을 지우므로 이 블록은 `tsc -b` 가 검증합니다. */
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type HasProp<K extends string> = K extends keyof TextFieldProps ? true : false;

export type TextFieldSurface = [
  Expect<HasProp<'label'>>,
  Expect<HasProp<'helperText'>>,
  Expect<HasProp<'accessibilityLabel'>>,
  Expect<HasProp<'variant'>>,
  Expect<HasProp<'multiline'>>,
  Expect<HasProp<'readOnly'>>,
  Expect<HasProp<'required'>>,
  Expect<HasProp<'containerStyle'>>,
  Expect<HasProp<'rootStyle'>>,

  // Select 는 별도 공개 컴포넌트다. TextField 는 텍스트 입력 전용이다.
  Expect<Equal<HasProp<'select'>, false>>,
  Expect<Equal<HasProp<'options'>, false>>,

  // `id` 는 RN `ViewProps` 의 진짜 prop 입니다 (`nativeID` 의 W3C 별칭) — DOM 유출이
  // 아니라서 막지 않습니다.
  Expect<HasProp<'id'>>,

  // web DOM/폼 어휘.
  Expect<Equal<HasProp<'htmlFor'>, false>>,
  Expect<Equal<HasProp<'name'>, false>>,
  Expect<Equal<HasProp<'type'>, false>>,
  Expect<Equal<HasProp<'rows'>, false>>,
  Expect<Equal<HasProp<'margin'>, false>>,
  Expect<Equal<HasProp<'component'>, false>>,
  Expect<Equal<HasProp<'inputProps'>, false>>,
  Expect<Equal<HasProp<'inputRef'>, false>>,
];

/** 접근 가능한 이름은 타입이 강제합니다. */
export const nameContract = () => (
  <>
    {/* 문자열 label 하나로 충분합니다. */}
    <TextField label="이름" />
    {/* 보이는 라벨과 말하는 이름이 달라도 됩니다. */}
    <TextField label="이름" accessibilityLabel="사용자 이름" />
    {/* 라벨이 없으면 명시 이름이 필요합니다. */}
    <TextField accessibilityLabel="이름" />
    {/* @ts-expect-error 이름이 될 수 있는 것이 아무것도 없습니다. */}
    <TextField />
    {/* @ts-expect-error ReactNode label 은 이름이 되지 못합니다. */}
    <TextField label={<Text>이름</Text>} />
    {/* ReactNode label 은 명시 이름과 함께라면 괜찮습니다. */}
    <TextField label={<Text>이름</Text>} accessibilityLabel="사용자 이름" />
  </>
);
