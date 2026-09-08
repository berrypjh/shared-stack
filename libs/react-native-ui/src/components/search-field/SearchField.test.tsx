/**
 * SearchField 의 질의 상태·지우기·네이티브 제출·접근성·rounded chrome 계약.
 *
 * 제안 목록은 `SearchField.suggestions.test.tsx` 가 맡습니다.
 *
 * web 에서 옮겨오지 않은 것: `type="search"`, `aria-controls`/`aria-autocomplete`,
 * `useId` listbox id, 래퍼 focus/blur 위임, 인라인 SVG 아이콘.
 */
import { createRef } from 'react';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import type { TextInput } from 'react-native';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control/FormControl';
import type { InputBaseProps } from '../input-base/InputBase.types';

import { SearchField } from './SearchField';
import type { SearchFieldProps, SearchFieldSuggestion } from './SearchField.types';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

/** TextInput 은 조회 가능한 role 이 없습니다. 접근 가능한 이름으로 찾습니다. */
const getInput = () => screen.getByLabelText('검색');

/** 장식과 TextInput 이 담기는 래퍼 View. */
const getWrapper = () => getInput().parent!;

const CLEAR = '지우기';

describe('질의 상태 모델', () => {
  it('uncontrolled 는 defaultValue 로 시작한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" defaultValue="초기" />);

    expect(getInput()).toHaveDisplayValue('초기');
  });

  it('uncontrolled 는 입력한 값을 스스로 반영한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    await fireEvent.changeText(getInput(), '타이핑');

    expect(getInput()).toHaveDisplayValue('타이핑');
  });

  it('controlled value 가 유일한 권한이다 — 스스로 새 값을 만들지 않는다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" value="고정" onChangeText={jest.fn()} />,
    );

    await fireEvent.changeText(getInput(), '타이핑');

    expect(getInput()).toHaveDisplayValue('고정');
  });

  it('onChangeText 가 DOM 이벤트가 아니라 문자열을 받는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(<SearchField accessibilityLabel="검색" onChangeText={onChangeText} />);

    await fireEvent.changeText(getInput(), '타이핑');

    expect(onChangeText).toHaveBeenCalledWith('타이핑');
    expect(typeof onChangeText.mock.calls[0][0]).toBe('string');
  });

  it('질의를 알아야 해서 내부 TextInput 은 항상 controlled 다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" defaultValue="초기" />);

    // defaultValue 를 그대로 흘리면 네이티브가 텍스트를 소유해 지우기가 불가능해집니다.
    expect(getInput()).toHaveProp('value', '초기');
    expect(getInput().props.defaultValue).toBeUndefined();
  });
});

describe('지우기 어포던스', () => {
  it('라벨을 주지 않으면 지우기 버튼이 없다 — 영어 기본값을 박지 않는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" defaultValue="초기" />);

    // 이름만 없는 버튼이 아니라 버튼 자체가 없어야 합니다.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('라벨을 주고 질의가 있으면 지우기 버튼이 보인다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" clearAccessibilityLabel={CLEAR} defaultValue="초기" />,
    );

    expect(screen.getByLabelText(CLEAR)).toBeOnTheScreen();
    expect(screen.getByLabelText(CLEAR)).toHaveProp('accessibilityRole', 'button');
  });

  it('질의가 비면 지우기 버튼이 사라진다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" clearAccessibilityLabel={CLEAR} />,
    );

    expect(screen.queryByLabelText(CLEAR)).toBeNull();

    await fireEvent.changeText(getInput(), '타이핑');

    expect(screen.getByLabelText(CLEAR)).toBeOnTheScreen();
  });

  it('disabled 면 지울 수 없으니 버튼도 없다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel={CLEAR}
        defaultValue="초기"
        disabled
      />,
    );

    expect(screen.queryByLabelText(CLEAR)).toBeNull();
  });

  it('readOnly 면 지울 수 없으니 버튼도 없다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel={CLEAR}
        defaultValue="초기"
        readOnly
      />,
    );

    expect(screen.queryByLabelText(CLEAR)).toBeNull();
  });

  it('uncontrolled 에서 누르면 실제로 비운다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" clearAccessibilityLabel={CLEAR} defaultValue="초기" />,
    );

    await fireEvent.press(screen.getByLabelText(CLEAR));

    expect(getInput()).toHaveDisplayValue('');
  });

  it('controlled 에서는 스스로 비우지 않고 소비자에게 빈 문자열을 알린다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel={CLEAR}
        value="고정"
        onChangeText={onChangeText}
      />,
    );

    await fireEvent.press(screen.getByLabelText(CLEAR));

    expect(onChangeText).toHaveBeenCalledWith('');
    expect(getInput()).toHaveDisplayValue('고정');
  });

  it('onChangeText 를 먼저 부르고 그다음 onClear 를 부른다', async () => {
    const order: string[] = [];
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel={CLEAR}
        defaultValue="초기"
        onChangeText={() => order.push('onChangeText')}
        onClear={() => order.push('onClear')}
      />,
    );

    await fireEvent.press(screen.getByLabelText(CLEAR));

    expect(order).toEqual(['onChangeText', 'onClear']);
  });

  it('onClear 만 주고 라벨을 안 주면 버튼이 생기지 않는다 — 라벨이 유일한 관문이다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" defaultValue="초기" onClear={jest.fn()} />,
    );

    expect(screen.queryByLabelText(CLEAR)).toBeNull();
  });
});

describe('네이티브 제출과 ref', () => {
  it('enterKeyHint 기본값이 search 다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getInput()).toHaveProp('enterKeyHint', 'search');
  });

  it('inputMode 기본값이 search 다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getInput()).toHaveProp('inputMode', 'search');
  });

  it('소비자가 키보드 힌트를 덮을 수 있다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" enterKeyHint="done" inputMode="text" />,
    );

    expect(getInput()).toHaveProp('enterKeyHint', 'done');
    expect(getInput()).toHaveProp('inputMode', 'text');
  });

  it('onSubmitEditing 을 네이티브 그대로 전달한다', async () => {
    const onSubmitEditing = jest.fn();
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" onSubmitEditing={onSubmitEditing} />,
    );

    await fireEvent(getInput(), 'submitEditing', { nativeEvent: { text: '질의' } });

    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    expect(onSubmitEditing.mock.calls[0][0].nativeEvent.text).toBe('질의');
  });

  it('ref 는 지우기 버튼이 아니라 TextInput 을 가리킨다', async () => {
    const ref = createRef<TextInput>();
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" ref={ref} clearAccessibilityLabel={CLEAR} />,
    );

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.focus).toBe('function');
  });
});

describe('접근성', () => {
  it('accessibilityRole 기본값이 search 다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getInput()).toHaveProp('accessibilityRole', 'search');
  });

  it('disabled 는 editable 과 접근성 상태 양쪽에 나타난다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" disabled />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('readOnly 는 disabled 가 아니다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" readOnly />);

    expect(getInput()).toHaveProp('editable', false);
    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('지우기 버튼은 별도의 접근 가능한 이름을 가진다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" clearAccessibilityLabel={CLEAR} defaultValue="초기" />,
    );

    expect(screen.getByLabelText(CLEAR)).not.toBe(getInput());
  });
});

describe('rounded chrome', () => {
  it('canonical rounded 토큰으로 그린다 — 9999 하드코딩이 아니다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.rounded });
  });

  it('error 여도 rounded 를 잃지 않는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" error />);

    expect(getWrapper()).toHaveStyle({ borderRadius: T.radius.rounded });
  });

  it('variant 기본값이 boxed 다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getWrapper()).toHaveStyle({
      borderWidth: T.border.primary.width,
      backgroundColor: 'transparent',
    });
  });

  it('filled variant 는 표면을 얻고도 rounded 를 유지한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" variant="filled" />);

    expect(getWrapper()).toHaveStyle({
      backgroundColor: T.color.field.surface,
      borderRadius: T.radius.rounded,
    });
  });
});

describe('FormControl 재사용', () => {
  it('FormControl 의 disabled 를 상속한다', async () => {
    await renderWithTheme(
      <FormControl disabled>
        <SearchField
          accessibilityLabel="검색"
          clearAccessibilityLabel={CLEAR}
          defaultValue="초기"
        />
      </FormControl>,
    );

    expect(getInput()).toHaveProp('editable', false);
    expect(screen.queryByLabelText(CLEAR)).toBeNull();
  });

  it('FormControl 의 error 를 상속한다', async () => {
    await renderWithTheme(
      <FormControl error>
        <SearchField accessibilityLabel="검색" />
      </FormControl>,
    );

    expect(getWrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
  });
});

/** 타입 수준 계약. jest 는 타입을 지우므로 이 블록은 `tsc -b` 가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof SearchFieldProps ? true : false;

export type SearchFieldSurface = [
  Expect<HasProp<'clearAccessibilityLabel'>>,
  Expect<HasProp<'onClear'>>,
  Expect<HasProp<'variant'>>,
  Expect<HasProp<'value'>>,
  Expect<HasProp<'defaultValue'>>,
  Expect<HasProp<'onChangeText'>>,

  // 내부 seam 은 새어나가지 않습니다.
  Expect<Equal<HasProp<'radius'>, false>>,

  // 뒤 슬롯은 지우기 버튼이 소유합니다. 앞 슬롯은 아이콘 원시가 없어 보류합니다.
  Expect<Equal<HasProp<'endAdornment'>, false>>,
  Expect<Equal<HasProp<'startAdornment'>, false>>,

  // 제안 표면.
  Expect<HasProp<'suggestions'>>,
  Expect<HasProp<'noSuggestionsText'>>,
  Expect<HasProp<'onSuggestionSelect'>>,

  // web 전용 어휘와 옮기지 않기로 한 것.
  Expect<Equal<HasProp<'clearable'>, false>>,
  Expect<Equal<HasProp<'onValueChange'>, false>>,
  Expect<Equal<HasProp<'inputProps'>, false>>,
  Expect<Equal<HasProp<'type'>, false>>,

  // 하드웨어 키보드 이동은 DOM 포커스 안무이고 소비처가 없어 두지 않습니다.
  Expect<Equal<HasProp<'activeIndex'>, false>>,
  Expect<Equal<HasProp<'onActiveIndexChange'>, false>>,

  // 개폐는 내부 정책입니다 — Select 의 open/defaultOpen 계약을 베끼지 않습니다.
  Expect<Equal<HasProp<'open'>, false>>,
  Expect<Equal<HasProp<'defaultOpen'>, false>>,
];

/** 제안 타입은 Select 옵션과 합치지 않습니다 — `value` 의 의미가 다릅니다. */
type SuggestionShape = [
  Expect<Equal<SearchFieldSuggestion['id'], string>>,
  Expect<Equal<SearchFieldSuggestion['label'], string>>,
  Expect<Equal<SearchFieldSuggestion['value'], string | undefined>>,
];
export type SearchFieldSuggestionContract = SuggestionShape;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** 내부 원시가 이미 보장하는 것을 SearchField 가 다시 구현하지 않았는지 봅니다. */
export type SearchFieldReusesBase = [
  Expect<Equal<SearchFieldProps['containerStyle'], InputBaseProps['containerStyle']>>,
  Expect<Equal<SearchFieldProps['accessibilityLabel'], InputBaseProps['accessibilityLabel']>>,
];
