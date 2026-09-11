/**
 * SearchField 제안 목록 — 가시성·터치 선택·접근성.
 *
 * 목록은 focus·질의 변경이 열고 선택·지우기·제출이 닫습니다. blur 는 닫지 않습니다 —
 * web 은 `relatedTarget` + `Node.contains` 로 포커스를 봉쇄하지만 RN 에는 그 수단이 없어서,
 * blur 로 닫으면 제안을 누르는 터치가 목록 언마운트와 경쟁합니다. 순서에 기대는 대신
 * 경쟁 자체를 없앴고, 대가로 다른 곳을 눌러도 목록이 남습니다.
 */
import { useState } from 'react';
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control/FormControl';

import { SearchField } from './SearchField';
import type { SearchFieldSuggestion } from './SearchField.types';

const T = Native.Light.tokens;

const renderWithTheme = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const getInput = () => screen.getByLabelText('검색');
const queryList = () => screen.queryByTestId('search-field-suggestions');
const getRow = (label: string) => screen.getByLabelText(label);

const SUGGESTIONS: SearchFieldSuggestion[] = [
  { id: '1', label: '사과', value: 'apple' },
  { id: '2', label: '바나나' },
  { id: '3', label: '체리', value: 'cherry', disabled: true },
];

/** 목록을 여는 표준 동작 — focus 가 연다. */
const openList = async () => {
  await fireEvent(getInput(), 'focus');
};

describe('가시성', () => {
  it('처음에는 숨어 있다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    expect(queryList()).toBeNull();
  });

  it('입력 focus 가 연다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(queryList()).toBeOnTheScreen();
  });

  it('목록을 여느라 소비자 onFocus 를 삼키지 않는다', async () => {
    const onFocus = jest.fn();
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} onFocus={onFocus} />,
    );

    await openList();

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(queryList()).toBeOnTheScreen();
  });

  it('질의 변경이 연다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await fireEvent.changeText(getInput(), '사');

    expect(queryList()).toBeOnTheScreen();
  });

  it('blur 는 닫지 않는다 — RN 에는 포커스 봉쇄가 없다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent(getInput(), 'blur');

    expect(queryList()).toBeOnTheScreen();
  });

  it('제안 선택이 닫는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(queryList()).toBeNull();
  });

  it('제출이 닫는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent(getInput(), 'submitEditing', { nativeEvent: { text: '사' } });

    expect(queryList()).toBeNull();
  });

  it('지우기가 닫는다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel="지우기"
        defaultValue="사"
        suggestions={SUGGESTIONS}
      />,
    );

    await openList();
    await fireEvent.press(screen.getByLabelText('지우기'));

    expect(queryList()).toBeNull();
  });

  it('제안이 비고 noSuggestionsText 도 없으면 빈 상자를 그리지 않는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={[]} />);

    await openList();

    expect(queryList()).toBeNull();
  });

  it('제안이 비어도 noSuggestionsText 가 있으면 빈 상태를 보여준다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={[]} noSuggestionsText="결과 없음" />,
    );

    await openList();

    expect(screen.getByText('결과 없음')).toBeOnTheScreen();
  });

  it('제안이 있으면 noSuggestionsText 는 나오지 않는다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        noSuggestionsText="결과 없음"
      />,
    );

    await openList();

    expect(screen.queryByText('결과 없음')).toBeNull();
  });

  it('suggestions 를 아예 주지 않으면 목록 개념이 없다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    await openList();

    expect(queryList()).toBeNull();
  });

  it('disabled 면 열리지 않는다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} disabled />,
    );

    await openList();

    expect(queryList()).toBeNull();
  });

  it('열려 있는 동안 disabled 가 되면 닫힌다', async () => {
    const view = await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />,
    );

    await openList();
    expect(queryList()).toBeOnTheScreen();

    await view.rerender(
      <ThemeProvider>
        <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} disabled />
      </ThemeProvider>,
    );

    expect(queryList()).toBeNull();
  });

  it('열려 있는 동안 readOnly 가 되면 닫힌다', async () => {
    const view = await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />,
    );

    await openList();

    await view.rerender(
      <ThemeProvider>
        <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} readOnly />
      </ThemeProvider>,
    );

    expect(queryList()).toBeNull();
  });

  it('readOnly 면 열리지 않는다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} readOnly />,
    );

    await openList();

    expect(queryList()).toBeNull();
  });
});

describe('필터링을 하지 않는다', () => {
  it('질의와 무관하게 받은 제안을 그대로 보여준다 — 데이터는 소비자 것이다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await fireEvent.changeText(getInput(), 'zzzz');

    expect(getRow('사과')).toBeOnTheScreen();
    expect(getRow('바나나')).toBeOnTheScreen();
    expect(getRow('체리')).toBeOnTheScreen();
  });
});

describe('터치 선택', () => {
  it('활성 제안을 누르면 질의가 그 값이 된다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(getInput()).toHaveDisplayValue('apple');
  });

  it('value 가 없으면 label 이 질의가 된다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent.press(getRow('바나나'));

    expect(getInput()).toHaveDisplayValue('바나나');
  });

  it('onSuggestionSelect 는 제안 객체를 그대로 받는다', async () => {
    const onSuggestionSelect = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        onSuggestionSelect={onSuggestionSelect}
      />,
    );

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(onSuggestionSelect).toHaveBeenCalledTimes(1);
    expect(onSuggestionSelect).toHaveBeenCalledWith(SUGGESTIONS[0]);
  });

  it('onChangeText 를 먼저, onSuggestionSelect 를 그다음 부른다', async () => {
    const order: string[] = [];
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        onChangeText={() => order.push('onChangeText')}
        onSuggestionSelect={() => order.push('onSuggestionSelect')}
      />,
    );

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(order).toEqual(['onChangeText', 'onSuggestionSelect']);
  });

  it('controlled 질의는 소비자 권한 그대로다 — 선택해도 스스로 바꾸지 않는다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        value="고정"
        onChangeText={onChangeText}
      />,
    );

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(onChangeText).toHaveBeenCalledWith('apple');
    expect(getInput()).toHaveDisplayValue('고정');
  });

  it('blur 뒤에도 제안을 누를 수 있다 — 터치가 언마운트와 경쟁하지 않는다', async () => {
    const onSuggestionSelect = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        onSuggestionSelect={onSuggestionSelect}
      />,
    );

    await openList();
    // 실제 기기에서 제안을 누르면 TextInput 이 먼저 blur 됩니다.
    await fireEvent(getInput(), 'blur');
    await fireEvent.press(getRow('사과'));

    expect(onSuggestionSelect).toHaveBeenCalledTimes(1);
    expect(getInput()).toHaveDisplayValue('apple');
  });
});

describe('비활성 제안', () => {
  it('질의를 바꾸지 못한다', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        onChangeText={onChangeText}
      />,
    );

    await openList();
    await fireEvent.press(getRow('체리'));

    expect(onChangeText).not.toHaveBeenCalled();
    expect(getInput()).toHaveDisplayValue('');
  });

  it('onSuggestionSelect 를 부르지 못한다', async () => {
    const onSuggestionSelect = jest.fn();
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={SUGGESTIONS}
        onSuggestionSelect={onSuggestionSelect}
      />,
    );

    await openList();
    await fireEvent.press(getRow('체리'));

    expect(onSuggestionSelect).not.toHaveBeenCalled();
  });

  it('목록을 닫지 못한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent.press(getRow('체리'));

    expect(queryList()).toBeOnTheScreen();
  });
});

describe('선택 상태는 질의에서 파생된다', () => {
  it('질의와 값이 같은 제안이 selected 다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} defaultValue="apple" />,
    );

    await openList();

    expect(getRow('사과')).toHaveProp('accessibilityState', { selected: true, disabled: false });
    expect(getRow('바나나')).toHaveProp('accessibilityState', {
      selected: false,
      disabled: false,
    });
  });

  it('선택은 저장되지 않는다 — 질의가 바뀌면 따라 바뀐다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();
    await fireEvent.press(getRow('사과'));
    await fireEvent.changeText(getInput(), '바나나');

    expect(getRow('사과')).toHaveProp('accessibilityState', { selected: false, disabled: false });
    expect(getRow('바나나')).toHaveProp('accessibilityState', {
      selected: true,
      disabled: false,
    });
  });
});

describe('FormControl 과 지우기 버튼을 깨뜨리지 않는다', () => {
  it('제안을 눌러도 FormControl focus 상태가 흐트러지지 않는다', async () => {
    await renderWithTheme(
      <FormControl>
        <SearchField
          accessibilityLabel="검색"
          suggestions={SUGGESTIONS}
          containerStyle={({ focused }) => ({
            backgroundColor: focused ? 'rgb(9, 9, 9)' : 'rgb(0, 0, 0)',
          })}
        />
      </FormControl>,
    );

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(getInput().parent).toHaveStyle({ backgroundColor: 'rgb(9, 9, 9)' });
  });

  it('목록이 열려 있어도 지우기 버튼은 따로 누를 수 있다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        clearAccessibilityLabel="지우기"
        defaultValue="사"
        suggestions={SUGGESTIONS}
      />,
    );

    await openList();
    await fireEvent.press(screen.getByLabelText('지우기'));

    expect(getInput()).toHaveDisplayValue('');
  });
});

describe('접근성', () => {
  it('제안 행은 지원되는 button 역할을 쓴다 — RN 은 option 역할을 매핑하지 않는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(getRow('사과')).toHaveProp('accessibilityRole', 'button');
    expect(getRow('사과').props.role).toBeUndefined();
  });

  it('비활성 제안은 disabled 상태를 노출한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(getRow('체리')).toHaveProp('accessibilityState', { selected: false, disabled: true });
  });

  it('제안 표면이 있을 때만 입력이 expanded 를 말한다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    expect(getInput()).toHaveProp('accessibilityState', { expanded: false, disabled: false });

    await openList();

    expect(getInput()).toHaveProp('accessibilityState', { expanded: true, disabled: false });
  });

  /**
   * `expanded` 는 내부 open 플래그가 아니라 **실제로 그려진 제안 표면**을 말해야 한다.
   * open 이어도 그릴 것이 없거나(빈 목록·안내 없음) 편집할 수 없으면(disabled·readOnly)
   * 표면이 없으므로 펼쳐졌다고 말하면 스크린리더에게 없는 목록을 약속하는 셈이다.
   */
  describe('expanded 는 보이는 제안 표면과 일치한다', () => {
    it('제안이 비고 안내도 없으면 focus 해도 expanded=false', async () => {
      await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={[]} />);

      await openList();

      expect(queryList()).toBeNull();
      expect(getInput()).toHaveProp('accessibilityState', { expanded: false, disabled: false });
    });

    it('제안이 비어도 안내가 보이면 expanded=true', async () => {
      await renderWithTheme(
        <SearchField accessibilityLabel="검색" suggestions={[]} noSuggestionsText="결과 없음" />,
      );

      await openList();

      expect(queryList()).toBeOnTheScreen();
      expect(getInput()).toHaveProp('accessibilityState', { expanded: true, disabled: false });
    });

    it('열린 동안 disabled 가 되어 목록이 사라지면 expanded=false', async () => {
      const view = await renderWithTheme(
        <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />,
      );

      await openList();
      await view.rerender(
        <ThemeProvider>
          <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} disabled />
        </ThemeProvider>,
      );

      expect(queryList()).toBeNull();
      expect(getInput()).toHaveProp('accessibilityState', { expanded: false, disabled: true });
    });

    it('열린 동안 readOnly 가 되어 목록이 사라지면 expanded=false', async () => {
      const view = await renderWithTheme(
        <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />,
      );

      await openList();
      await view.rerender(
        <ThemeProvider>
          <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} readOnly />
        </ThemeProvider>,
      );

      expect(queryList()).toBeNull();
      expect(getInput()).toHaveProp('accessibilityState', { expanded: false, disabled: false });
    });

    it('선택으로 목록이 닫히면 expanded=false', async () => {
      await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

      await openList();
      await fireEvent.press(getRow('사과'));

      expect(getInput()).toHaveProp('accessibilityState', { expanded: false, disabled: false });
    });
  });

  it('제안 표면이 없으면 expanded 를 지어내지 않는다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" />);

    expect(getInput()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('입력은 combobox 로 승격되지 않는다 — 행이 option 이 될 수 없어 반쪽 약속이 된다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    expect(getInput()).toHaveProp('accessibilityRole', 'search');
  });

  it('목록 컨테이너는 접근성 집합체가 아니다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(queryList()?.props.accessible).not.toBe(true);
    expect(queryList()?.props.accessibilityRole).toBeUndefined();
  });

  it('루트도 접근성 집합체가 아니다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    expect(screen.getByTestId('search-field-root').props.accessible).not.toBe(true);
  });

  it('빈 상태를 라이브 리전으로 만들지 않는다 — 비동기 알림은 별개의 제품 정책이다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={[]} noSuggestionsText="결과 없음" />,
    );

    await openList();

    const empty = screen.getByText('결과 없음');
    expect(empty.props.accessibilityLiveRegion).toBeUndefined();
    expect(empty.props['aria-live']).toBeUndefined();
  });

  it('설명은 보이는 보조 텍스트일 뿐 행의 접근 가능한 이름을 오염시키지 않는다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={[{ id: '1', label: '사과', description: '과일' }]}
      />,
    );

    await openList();

    expect(screen.getByText('과일')).toBeOnTheScreen();
    expect(getRow('사과')).toHaveProp('accessibilityLabel', '사과');
  });

  it('설명이 ReactNode 여도 문자열로 만들지 않는다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={[{ id: '1', label: '사과', description: <Text>노드 설명</Text> }]}
      />,
    );

    await openList();

    expect(screen.getByText('노드 설명')).toBeOnTheScreen();
    expect(getRow('사과')).toHaveProp('accessibilityLabel', '사과');
  });
});

describe('토큰 기반 시각', () => {
  it('목록 패널은 canonical 표면·테두리·radius 를 쓴다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(queryList()).toHaveStyle({
      backgroundColor: T.color.background.surface,
      borderColor: T.color.field.border,
      borderWidth: T.border.primary.width,
      borderRadius: T.radius.xl,
    });
  });

  it('선택된 행만 selected 표면을 얻는다', async () => {
    await renderWithTheme(
      <SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} defaultValue="apple" />,
    );

    await openList();

    expect(getRow('사과')).toHaveStyle({ backgroundColor: T.color.background.selected });
    expect(getRow('바나나')).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('비활성 행 라벨은 disable 텍스트 색이다', async () => {
    await renderWithTheme(<SearchField accessibilityLabel="검색" suggestions={SUGGESTIONS} />);

    await openList();

    expect(screen.getByText('체리')).toHaveStyle({ color: T.color.text.disable });
    expect(screen.getByText('바나나')).toHaveStyle({ color: T.color.text.default });
  });

  it('설명은 보조 텍스트 색이다', async () => {
    await renderWithTheme(
      <SearchField
        accessibilityLabel="검색"
        suggestions={[{ id: '1', label: '사과', description: '과일' }]}
      />,
    );

    await openList();

    expect(screen.getByText('과일')).toHaveStyle({ color: T.color.text.light });
  });
});

describe('controlled 소비자 시나리오', () => {
  it('소비자가 질의를 소유해도 목록·선택이 온전히 돈다', async () => {
    const Harness = () => {
      const [query, setQuery] = useState('');

      return (
        <SearchField
          accessibilityLabel="검색"
          value={query}
          onChangeText={setQuery}
          suggestions={SUGGESTIONS}
        />
      );
    };

    await renderWithTheme(<Harness />);

    await openList();
    await fireEvent.press(getRow('사과'));

    expect(getInput()).toHaveDisplayValue('apple');
    expect(queryList()).toBeNull();
  });
});
