/**
 * RN Select 의 값·옵션 기반 계약.
 *
 * 닫힌 상태의 트리거와 값 계약만 다룹니다 — 개폐·선택 상호작용은
 * `Select.interaction.test.tsx` 가 맡습니다.
 *
 * web 의 null 렌더 `MenuItem` + `React.Children` 훑기를 옮기지 않습니다 — 옵션은 데이터입니다.
 * 합성 change 이벤트(`{target:{name,value}}`)도 `onValueChange(next)` 로 대체했습니다.
 */
import { Text, View } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';

import { Select } from './Select';
import { findSelectedOption, nextSingleValue, resolveDisplayNode } from './Select.selection';
import type { SelectOption, SelectProps } from './Select.types';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const OPTIONS = [
  { value: 'kr', label: '대한민국' },
  { value: 'us', label: '미국' },
  { value: 'jp', label: '일본', disabled: true },
] as const satisfies readonly SelectOption<'kr' | 'us' | 'jp'>[];

// 트리거 역할은 `combobox` 입니다 — RN 이 지원하는 역할 중 가장 정확합니다.
const trigger = () => screen.getByRole('combobox', { name: '국가' });

// ─────────────────────────── 순수 선택 로직 ───────────────────────────

describe('findSelectedOption', () => {
  it('값에 해당하는 옵션을 찾는다', () => {
    expect(findSelectedOption(OPTIONS, 'us')?.label).toBe('미국');
  });

  it('값이 없으면 undefined 다', () => {
    expect(findSelectedOption(OPTIONS, undefined)).toBeUndefined();
  });

  it('목록에 없는 값이면 undefined 다', () => {
    expect(findSelectedOption(OPTIONS, 'fr' as 'kr')).toBeUndefined();
  });
});

describe('nextSingleValue — 같은 값 정책과 disabled 가드', () => {
  it('다른 값을 고르면 그 값을 돌려준다', () => {
    expect(nextSingleValue(OPTIONS[0], 'us')).toEqual({ changed: true, value: 'kr' });
  });

  it('이미 선택된 값을 다시 고르면 변경으로 보지 않는다', () => {
    // web Select 는 같은 값이면 닫기만 하고 onChange 를 부르지 않습니다.
    // (SegmentControl 은 반대입니다 — 두 컴포넌트의 web 동작이 실제로 다릅니다.)
    expect(nextSingleValue(OPTIONS[0], 'kr')).toEqual({ changed: false, value: 'kr' });
  });

  it('disabled 옵션은 값을 만들지 못한다', () => {
    expect(nextSingleValue(OPTIONS[2], 'kr')).toEqual({ changed: false, value: 'kr' });
  });

  it('빈 상태에서 고르면 변경이다', () => {
    expect(nextSingleValue(OPTIONS[1], undefined)).toEqual({ changed: true, value: 'us' });
  });
});

describe('resolveDisplayNode — 표시 우선순위', () => {
  const placeholder = '선택하세요';

  it('renderValue 가 있으면 가장 우선한다', () => {
    expect(
      resolveDisplayNode({
        selectedOption: OPTIONS[0],
        value: 'kr',
        placeholder,
        renderValue: (v) => `커스텀:${v}`,
      }),
    ).toBe('커스텀:kr');
  });

  it('값이 있으면 선택된 옵션의 label 을 그대로 쓴다', () => {
    expect(resolveDisplayNode({ selectedOption: OPTIONS[0], value: 'kr', placeholder })).toBe(
      '대한민국',
    );
  });

  it('값이 없으면 placeholder 를 쓴다', () => {
    expect(resolveDisplayNode({ selectedOption: undefined, value: undefined, placeholder })).toBe(
      placeholder,
    );
  });

  it('값도 placeholder 도 없으면 null 이다', () => {
    expect(resolveDisplayNode({ selectedOption: undefined, value: undefined })).toBeNull();
  });

  it('label 이 ReactNode 면 문자열로 만들지 않고 그대로 돌려준다', () => {
    const node = <Text>🇰🇷</Text>;
    const option = { value: 'kr', label: node } as const;

    expect(resolveDisplayNode({ selectedOption: option, value: 'kr' })).toBe(node);
  });
});

// ─────────────────────────── 컴포넌트 기반 ───────────────────────────

describe('트리거 기반', () => {
  it('선택된 옵션의 label 을 보여준다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="us" />);

    expect(screen.getByText('미국')).toBeOnTheScreen();
  });

  it('값이 없으면 placeholder 를 보여준다', async () => {
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} placeholder="국가를 고르세요" />,
    );

    expect(screen.getByText('국가를 고르세요')).toBeOnTheScreen();
  });

  it('트리거가 combobox 역할과 접근 가능한 이름을 가진다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" />);

    expect(trigger()).toBeOnTheScreen();
  });

  it('일반 ViewProps 와 ref 가 루트에 닿는다', async () => {
    const ref = { current: null } as { current: View | null };

    await show(<Select testID="root" ref={ref} accessibilityLabel="국가" options={OPTIONS} />);

    expect(screen.getByTestId('root').type).toBe('View');
    expect(typeof ref.current?.measure).toBe('function');
  });

  it('루트가 접근성 집합체가 되지 않는다', async () => {
    await show(<Select testID="root" accessibilityLabel="국가" options={OPTIONS} />);

    expect(screen.getByTestId('root').props.accessible).not.toBe(true);
  });
});

describe('controlled / uncontrolled', () => {
  it('controlled value 는 prop 이 최종 권한이다', async () => {
    const view = await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" />);
    expect(screen.getByText('대한민국')).toBeOnTheScreen();

    await view.rerender(
      <ThemeProvider>
        <Select accessibilityLabel="국가" options={OPTIONS} value="us" />
      </ThemeProvider>,
    );

    expect(screen.getByText('미국')).toBeOnTheScreen();
  });

  it('uncontrolled 는 defaultValue 로 한 번만 초기화된다', async () => {
    const view = await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultValue="kr" />,
    );
    expect(screen.getByText('대한민국')).toBeOnTheScreen();

    // defaultValue 가 바뀌어도 이미 초기화된 상태를 다시 덮지 않습니다.
    await view.rerender(
      <ThemeProvider>
        <Select accessibilityLabel="국가" options={OPTIONS} defaultValue="us" />
      </ThemeProvider>,
    );

    expect(screen.getByText('대한민국')).toBeOnTheScreen();
  });

  it('빈 값은 undefined 로 표현한다', async () => {
    await show(
      <Select
        accessibilityLabel="국가"
        options={OPTIONS}
        value={undefined}
        placeholder="비어 있음"
      />,
    );

    expect(screen.getByText('비어 있음')).toBeOnTheScreen();
  });
});

describe('FormControl 상속', () => {
  it('disabled 를 상속해 트리거를 잠근다', async () => {
    await show(
      <FormControl disabled>
        <Select accessibilityLabel="국가" options={OPTIONS} value="kr" />
      </FormControl>,
    );

    expect(trigger()).toBeDisabled();
  });

  it('error 를 상속해 error 테두리를 쓴다', async () => {
    await show(
      <FormControl error>
        <Select testID="root" accessibilityLabel="국가" options={OPTIONS} value="kr" />
      </FormControl>,
    );

    expect(trigger()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('size 를 상속한다', async () => {
    await show(
      <FormControl size="sm">
        <Select accessibilityLabel="국가" options={OPTIONS} value="kr" />
      </FormControl>,
    );

    expect(screen.getByText('대한민국')).toHaveStyle({
      fontSize: T.typography.body.small.fontSize,
    });
  });

  it('fullWidth 를 상속한다', async () => {
    await show(
      <FormControl fullWidth>
        <Select testID="root" accessibilityLabel="국가" options={OPTIONS} />
      </FormControl>,
    );

    expect(screen.getByTestId('root')).toHaveStyle({ alignSelf: 'stretch' });
  });

  it('명시 prop 이 FormControl 을 이긴다', async () => {
    await show(
      <FormControl disabled>
        <Select accessibilityLabel="국가" options={OPTIONS} value="kr" disabled={false} />
      </FormControl>,
    );

    expect(trigger()).not.toBeDisabled();
  });

  it('variant 는 FormControl 에서 상속하지 않고 Select 가 가진다', async () => {
    // FormControl Context 에 variant 를 넣지 않습니다 — Plain/Filled/Boxed Input 처럼
    // Select 도 자기 variant 를 가집니다.
    await show(
      <FormControl>
        <Select testID="root" accessibilityLabel="국가" options={OPTIONS} variant="plain" />
      </FormControl>,
    );

    expect(trigger()).toHaveStyle({ borderRadius: 0 });
  });
});

describe('토큰 기반 표현', () => {
  it('기본 boxed 트리거가 canonical 필드 토큰을 쓴다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" />);

    expect(trigger()).toHaveStyle({
      borderColor: T.color.field.border,
      borderWidth: T.border.primary.width,
      borderRadius: T.radius.md,
      backgroundColor: 'transparent',
    });
  });

  it('선택된 값은 기본 텍스트색, placeholder 는 placeholder 색을 쓴다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" />);
    expect(screen.getByText('대한민국')).toHaveStyle({ color: T.color.text.default });

    await render(
      <ThemeProvider>
        <Select accessibilityLabel="국가" options={OPTIONS} placeholder="고르세요" />
      </ThemeProvider>,
    );
    expect(screen.getByText('고르세요')).toHaveStyle({ color: T.color.text.placeholder });
  });

  it('disabled 는 disabled 텍스트·테두리 색을 쓴다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" disabled />);

    expect(screen.getByText('대한민국')).toHaveStyle({ color: T.color.text.disable });
    expect(trigger()).toHaveStyle({ borderColor: T.border.disabled.color });
  });
});

/** 타입 수준 계약. jest는 타입을 지우므로 이 블록은 `tsc -b`가 검증합니다. */
type Expect<TT extends true> = TT;
type HasProp<K extends string> = K extends keyof SelectProps<string> ? true : false;

/** web DOM/폼 개념은 없습니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'name'> extends false ? true : false>,
  Expect<HasProp<'onChange'> extends false ? true : false>,
  Expect<HasProp<'children'> extends false ? true : false>,
  Expect<HasProp<'className'> extends false ? true : false>,
  // web 의 `displayEmpty` 는 RN 에서 "placeholder 를 주지 않는다"로 표현됩니다.
  Expect<HasProp<'displayEmpty'> extends false ? true : false>,
];

/** 개폐 상태. 값 상태와 독립입니다. */
export type DisclosureContract = [
  Expect<HasProp<'open'>>,
  Expect<HasProp<'defaultOpen'>>,
  Expect<HasProp<'onOpen'>>,
  Expect<HasProp<'onClose'>>,
];

/** multiple 은 이번 범위에서 지원하지 않습니다. */
export type MultipleDeferred = [Expect<HasProp<'multiple'> extends false ? true : false>];

/** 값 계약. */
export type ValueContract = [
  Expect<SelectProps<'a' | 'b'>['value'] extends 'a' | 'b' | undefined ? true : false>,
  Expect<HasProp<'onValueChange'>>,
  Expect<HasProp<'renderValue'>>,
];

export const typeContract = () => {
  const ok = (
    <Select
      accessibilityLabel="국가"
      options={[
        { value: 'kr', label: '대한민국' },
        { value: 'us', label: '미국' },
      ]}
      value="kr"
      onValueChange={(next) => {
        const narrowed: 'kr' | 'us' = next;
        return narrowed;
      }}
    />
  );

  const mismatched = (
    <Select
      accessibilityLabel="국가"
      options={[{ value: 'kr', label: '대한민국' }]}
      // @ts-expect-error value 는 options 의 T 에 속해야 합니다.
      value="fr"
    />
  );

  const nonString = (
    <Select
      accessibilityLabel="국가"
      // @ts-expect-error 값 도메인은 문자열입니다.
      options={[{ value: 1, label: '하나' }]}
    />
  );

  const missingName = (
    // @ts-expect-error accessibilityLabel 은 필수입니다.
    <Select options={[{ value: 'kr', label: '대한민국' }]} />
  );

  return [ok, mismatched, nonString, missingName];
};
