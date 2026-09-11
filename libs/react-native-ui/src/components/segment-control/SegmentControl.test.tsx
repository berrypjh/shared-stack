/**
 * RN SegmentControl의 동작 계약.
 *
 * web 과 같은 **controlled 전용** 입니다 — `value`·`onChange`·`options` 가 모두 필수이고
 * `defaultValue`·`size`·`fullWidth`·루트 `disabled` 는 없습니다. web 에도 없습니다.
 *
 * 시맨틱은 web 의 `<button aria-pressed>` 에 대응하는 Pressable + `accessibilityState.selected`
 * 입니다. 상호배타 선택이라는 이유만으로 radio/tab 으로 바꾸지 않습니다 — 화면 전환도,
 * 폼 radio 도 아닙니다.
 */
import { Text, View } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';

import * as barrel from './index';
import { SegmentControl } from './SegmentControl';
import type { SegmentControlProps, SegmentOption } from './SegmentControl.types';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const OPTIONS = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '월', disabled: true },
] as const satisfies readonly SegmentOption<'day' | 'week' | 'month'>[];

const seg = (name: string) => screen.getByRole('button', { name });

describe('구조와 prop 전달', () => {
  it('루트 View 와 옵션당 Pressable 하나를 렌더한다', async () => {
    await show(<SegmentControl testID="root" value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(screen.getByTestId('root').type).toBe('View');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('옵션 라벨을 렌더한다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    for (const label of ['일', '주', '월']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });

  it('일반 ViewProps 를 전달한다', async () => {
    await show(
      <SegmentControl
        testID="root"
        value="day"
        onChange={jest.fn()}
        options={OPTIONS}
        pointerEvents="box-none"
      />,
    );

    expect(screen.getByTestId('root')).toHaveProp('pointerEvents', 'box-none');
  });

  it('ref 가 루트 View 에 닿는다', async () => {
    const ref = { current: null } as { current: View | null };

    await show(<SegmentControl ref={ref} value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(typeof ref.current?.measure).toBe('function');
  });

  it('루트가 접근성 집합체가 되지 않는다', async () => {
    await show(<SegmentControl testID="root" value="day" onChange={jest.fn()} options={OPTIONS} />);

    // 켜면 세 옵션이 하나로 뭉쳐 각각 누를 수 없게 됩니다.
    expect(screen.getByTestId('root').props.accessible).not.toBe(true);
  });
});

describe('선택 상태는 value prop 이 유일한 권한', () => {
  it('value 가 가리키는 옵션만 selected 다', async () => {
    await show(<SegmentControl value="week" onChange={jest.fn()} options={OPTIONS} />);

    expect(seg('주')).toBeSelected();
    expect(seg('일')).not.toBeSelected();
  });

  it('value 가 바뀌면 선택 상태가 따라간다', async () => {
    const view = await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);
    expect(seg('일')).toBeSelected();

    await view.rerender(
      <ThemeProvider>
        <SegmentControl value="week" onChange={jest.fn()} options={OPTIONS} />
      </ThemeProvider>,
    );

    expect(seg('주')).toBeSelected();
    expect(seg('일')).not.toBeSelected();
  });

  it('누른다고 스스로 선택을 바꾸지 않는다 — 내부 선택 상태가 없다', async () => {
    // onChange 를 무시하는 소비자라면 화면도 바뀌면 안 됩니다.
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    await fireEvent.press(seg('주'));

    expect(seg('일')).toBeSelected();
    expect(seg('주')).not.toBeSelected();
  });
});

describe('press 동작', () => {
  it('활성 옵션을 누르면 정확한 값으로 한 번 호출한다', async () => {
    const onChange = jest.fn();
    await show(<SegmentControl value="day" onChange={onChange} options={OPTIONS} />);

    await fireEvent.press(seg('주'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('disabled 옵션은 호출하지 않는다', async () => {
    const onChange = jest.fn();
    await show(<SegmentControl value="day" onChange={onChange} options={OPTIONS} />);

    await fireEvent.press(seg('월'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('이미 선택된 옵션을 눌러도 호출한다 (web 과 같은 의미)', async () => {
    // web `onClick={() => onChange(opt.value)}` 에 가드가 없습니다. 같은 의미를 지킵니다.
    const onChange = jest.fn();
    await show(<SegmentControl value="day" onChange={onChange} options={OPTIONS} />);

    await fireEvent.press(seg('일'));

    expect(onChange).toHaveBeenCalledWith('day');
  });
});

describe('접근성', () => {
  it('보이는 텍스트 라벨이 접근 가능한 이름이 된다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(seg('주')).toHaveAccessibleName('주');
  });

  it('텍스트가 아닌 라벨은 accessibilityLabel 로 이름을 준다', async () => {
    const iconOptions = [
      { value: 'list', label: <Text>≡</Text>, accessibilityLabel: '목록 보기' },
      { value: 'grid', label: <Text>▦</Text>, accessibilityLabel: '격자 보기' },
    ] as const satisfies readonly SegmentOption<'list' | 'grid'>[];

    await show(<SegmentControl value="list" onChange={jest.fn()} options={iconOptions} />);

    expect(screen.getByRole('button', { name: '격자 보기' })).toBeOnTheScreen();
  });

  it('selected 와 disabled 가 접근성 상태로 노출된다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(seg('일')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true, disabled: false }),
    );
    expect(seg('월')).toBeDisabled();
    expect(seg('주')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: false }),
    );
  });

  it('선택된 disabled 옵션은 selected 와 disabled 를 함께 알리고 누를 수 없다', async () => {
    const onChange = jest.fn();
    await show(<SegmentControl value="month" onChange={onChange} options={OPTIONS} />);

    expect(seg('월')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true, disabled: true }),
    );
    // 표면은 선택을, 라벨색은 비활성을 말한다 (disabled > selected — web 과 같은 우선순위).
    expect(seg('월')).toHaveStyle({ backgroundColor: T.color.background.primary });
    expect(screen.getByText('월')).toHaveStyle({ color: T.color.text.disable });

    await fireEvent.press(seg('월'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('옵션이 최소 터치 타깃을 지킨다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(seg('일')).toHaveStyle({
      minWidth: T.spacing['4xl'],
      minHeight: T.spacing['4xl'],
    });
  });
});

describe('토큰 기반 표현', () => {
  it('선택된 옵션은 primary 표면과 대비 라벨을 쓴다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(seg('일')).toHaveStyle({ backgroundColor: T.color.background.primary });
    expect(screen.getByText('일')).toHaveStyle({ color: T.color.text.contrastText });
  });

  it('선택되지 않은 옵션은 light 라벨을 쓰고 표면이 없다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(screen.getByText('주')).toHaveStyle({ color: T.color.text.light });
    expect(seg('주')).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('disabled 옵션은 disable 라벨색을 쓴다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(screen.getByText('월')).toHaveStyle({ color: T.color.text.disable });
  });

  it('루트는 canonical 트랙 표면·radius·간격을 쓴다', async () => {
    await show(<SegmentControl testID="root" value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(screen.getByTestId('root')).toHaveStyle({
      backgroundColor: T.color.background.default,
      borderRadius: T.radius.xs,
      padding: T.spacing['2xs'],
      gap: T.spacing.xs,
    });
  });

  it('라벨이 canonical 타이포를 쓴다', async () => {
    await show(<SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />);

    expect(screen.getByText('일')).toHaveStyle({
      fontSize: T.typography.body.smallStrong.fontSize,
    });
  });

  it('테마를 바꾸면 시맨틱 토큰이 따라간다', async () => {
    const D = Native.Dark.tokens;
    expect(D.color.background.primary).not.toBe(T.color.background.primary);

    await render(
      <ThemeProvider mode="dark">
        <SegmentControl value="day" onChange={jest.fn()} options={OPTIONS} />
      </ThemeProvider>,
    );

    expect(seg('일')).toHaveStyle({ backgroundColor: D.color.background.primary });
  });
});

describe('소비자 style 우선순위', () => {
  it('소비자 style 이 선택 표현을 지울 수 없다', async () => {
    await show(
      <SegmentControl
        testID="root"
        value="day"
        onChange={jest.fn()}
        options={OPTIONS}
        style={{ backgroundColor: 'rgb(1, 2, 3)' }}
      />,
    );

    // 루트 트랙은 상태 피드백이 아니라 소비자가 덮을 수 있습니다.
    expect(screen.getByTestId('root')).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
    // 그래도 옵션의 선택 표현은 유지됩니다.
    expect(seg('일')).toHaveStyle({ backgroundColor: T.color.background.primary });
  });
});

describe('공개 경계', () => {
  it('배럴은 SegmentControl 만 내보낸다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['SegmentControl']);
  });
});

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof SegmentControlProps<string> ? true : false;

/** web 에도 없는 API 를 지어내지 않습니다. */
export type RejectsInventedProps = [
  Expect<HasProp<'defaultValue'> extends false ? true : false>,
  Expect<HasProp<'size'> extends false ? true : false>,
  Expect<HasProp<'fullWidth'> extends false ? true : false>,
  Expect<HasProp<'disabled'> extends false ? true : false>,
  Expect<HasProp<'children'> extends false ? true : false>,
];

/** web DOM 개념은 없습니다. (`role` 은 web 전용이 아니라 진짜 RN `ViewProps` 입니다.) */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'className'> extends false ? true : false>,
  Expect<HasProp<'onClick'> extends false ? true : false>,
];

/** 멀쩡한 ViewProps 는 남습니다. */
export type KeepsValidViewProps = [
  Expect<HasProp<'testID'>>,
  Expect<HasProp<'style'>>,
  Expect<HasProp<'role'>>,
  Expect<HasProp<'pointerEvents'>>,
];

/** 제네릭이 좁혀지고 options 와 value 가 같은 T 를 씁니다. */
export const genericNarrowing = () => {
  const ok = (
    <SegmentControl
      value="day"
      onChange={(next) => {
        const narrowed: 'day' | 'week' = next;
        return narrowed;
      }}
      options={[
        { value: 'day', label: '일' },
        { value: 'week', label: '주' },
      ]}
    />
  );

  const mismatched = (
    <SegmentControl
      // @ts-expect-error value 는 options 의 T 에 속해야 합니다.
      value="year"
      onChange={() => undefined}
      options={[
        { value: 'day', label: '일' },
        { value: 'week', label: '주' },
      ]}
    />
  );

  const nonString = (
    <SegmentControl
      // @ts-expect-error 값 도메인은 문자열입니다.
      value={1}
      onChange={() => undefined}
      // @ts-expect-error 값 도메인은 문자열입니다.
      options={[{ value: 1, label: '하나' }]}
    />
  );

  return [ok, mismatched, nonString];
};
