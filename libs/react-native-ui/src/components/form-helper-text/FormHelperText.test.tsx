/**
 * FormHelperText의 동작 계약.
 *
 * 셋을 분리한다: 보이는 텍스트(이 컴포넌트가 하는 일), 입력과의 설명 관계(교차 플랫폼 수단이
 * 없어 지어내지 않는다), 오류 고지(자동으로 켜지 않고 네이티브 prop만 전달한다).
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';

import { FormHelperText } from './FormHelperText';
import type { FormHelperTextProps } from './FormHelperText.types';
import * as barrel from './index';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const helper = () => screen.getByTestId('helper');

describe('원시와 prop 전달', () => {
  it('실제 RN Text 를 렌더하고 children 을 담는다', async () => {
    await show(<FormHelperText testID="helper">회사 이메일을 입력하세요</FormHelperText>);

    expect(helper().type).toBe('Text');
    expect(screen.getByText('회사 이메일을 입력하세요')).toBeOnTheScreen();
  });

  it('일반 TextProps 를 전달한다', async () => {
    await show(
      <FormHelperText testID="helper" numberOfLines={2} selectable>
        도움말
      </FormHelperText>,
    );

    expect(helper()).toHaveProp('numberOfLines', 2);
    expect(helper()).toHaveProp('selectable', true);
  });

  it('소비자 style 이 토큰 뒤에 온다', async () => {
    await show(
      <FormHelperText testID="helper" error style={{ color: 'rgb(1, 2, 3)' }}>
        도움말
      </FormHelperText>,
    );

    expect(helper()).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });

  it('ref 가 Text 에 닿는다', async () => {
    const ref = { current: null } as { current: Text | null };

    await show(
      <FormHelperText testID="helper" ref={ref}>
        도움말
      </FormHelperText>,
    );

    expect(typeof ref.current?.measure).toBe('function');
  });
});

describe('토큰 기반 표현', () => {
  it('평상시에는 text.light 와 caption.small 을 쓴다', async () => {
    await show(<FormHelperText testID="helper">도움말</FormHelperText>);

    expect(helper()).toHaveStyle({
      color: T.color.text.light,
      fontSize: T.typography.caption.small.fontSize,
      lineHeight: T.typography.caption.small.lineHeight,
      marginTop: T.spacing.xs,
    });
  });

  it('error 는 text.error 를 쓴다', async () => {
    await show(
      <FormHelperText testID="helper" error>
        이메일 형식이 아닙니다
      </FormHelperText>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.error });
  });

  it('disabled 는 text.disable 을 쓴다', async () => {
    await show(
      <FormHelperText testID="helper" disabled>
        도움말
      </FormHelperText>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.disable });
  });

  it('disabled 가 error 를 이긴다', async () => {
    // InputBase.borderSpec·InputLabel 과 같은 순서다.
    await show(
      <FormHelperText testID="helper" disabled error>
        도움말
      </FormHelperText>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.disable });
  });
});

describe('FormControl 상속과 override', () => {
  it('disabled 를 상속한다', async () => {
    await show(
      <FormControl disabled>
        <FormHelperText testID="helper">도움말</FormHelperText>
      </FormControl>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.disable });
  });

  it('error 를 상속한다', async () => {
    await show(
      <FormControl error>
        <FormHelperText testID="helper">도움말</FormHelperText>
      </FormControl>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.error });
  });

  it('명시 error={false} 가 context 를 이긴다', async () => {
    await show(
      <FormControl error>
        <FormHelperText testID="helper" error={false}>
          도움말
        </FormHelperText>
      </FormControl>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.light });
  });

  it('명시 disabled={false} 가 context 를 이긴다', async () => {
    await show(
      <FormControl disabled>
        <FormHelperText testID="helper" disabled={false}>
          도움말
        </FormHelperText>
      </FormControl>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.light });
  });

  it('FormControl 의 다른 값(focused·required)은 헬퍼를 바꾸지 않는다', async () => {
    await show(
      <FormControl focused required color="secondary">
        <FormHelperText testID="helper">도움말</FormHelperText>
      </FormControl>,
    );

    expect(helper()).toHaveStyle({ color: T.color.text.light });
  });
});

describe('빈 내용 정책', () => {
  it('children 을 준 그대로 렌더한다 — web 의 zero-width-space sentinel 을 옮기지 않는다', async () => {
    // RN 에 예약 높이 규약이 없고 저장소에 그 sentinel 사용처도 없다.
    await show(<FormHelperText testID="helper"> </FormHelperText>);

    expect(helper()).not.toHaveTextContent('​');
  });

  it('children 이 없으면 빈 Text 로 남는다', async () => {
    await show(<FormHelperText testID="helper" />);

    expect(helper()).toBeOnTheScreen();
    expect(helper()).toHaveTextContent('');
  });
});

describe('접근성 경계', () => {
  it('평범한 헬퍼는 live region 이 아니다', async () => {
    await show(<FormHelperText testID="helper">도움말</FormHelperText>);

    expect(helper().props.accessibilityLiveRegion).toBeUndefined();
    expect(helper().props['aria-live']).toBeUndefined();
  });

  it('error 여도 자동으로 고지하지 않는다', async () => {
    // 모든 헬퍼를 live region 으로 만들면 오류가 서로를 덮어쓴다. 정책은 소비자가 정한다.
    await show(
      <FormHelperText testID="helper" error>
        이메일 형식이 아닙니다
      </FormHelperText>,
    );

    expect(helper().props.accessibilityLiveRegion).toBeUndefined();
    expect(helper().props.accessibilityRole).toBeUndefined();
  });

  it('입력과의 설명 관계를 지어내지 않는다', async () => {
    await show(<FormHelperText testID="helper">도움말</FormHelperText>);

    // `aria-describedby` 에 해당하는 교차 플랫폼 수단이 없다.
    expect(helper().props['aria-describedby']).toBeUndefined();
    expect(helper().props.accessibilityLabelledBy).toBeUndefined();
  });

  it('소비자가 고른 접근성 prop 은 그대로 전달한다', async () => {
    await show(
      <FormHelperText
        testID="helper"
        nativeID="email-helper"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        error
      >
        이메일 형식이 아닙니다
      </FormHelperText>,
    );

    expect(helper()).toHaveProp('nativeID', 'email-helper');
    expect(helper()).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(helper()).toHaveProp('accessibilityRole', 'alert');
  });
});

/**
 * 글자 크기 확대. `InputLabel`·`InputBase` 와 같은 규약이다 — 끄지 않고, 높이를 고정하지 않는다.
 */
describe('글자 크기 확대', () => {
  it('allowFontScaling 을 건드리지 않는다 — RN 기본값(확대 허용)이 남는다', async () => {
    await show(<FormHelperText testID="helper">회사 이메일을 입력하세요</FormHelperText>);

    expect(helper().props.allowFontScaling).toBeUndefined();
  });

  it('소비자가 확대를 끌 수 있다', async () => {
    await show(
      <FormHelperText testID="helper" allowFontScaling={false}>
        회사 이메일을 입력하세요
      </FormHelperText>,
    );

    expect(helper().props.allowFontScaling).toBe(false);
  });

  it('높이를 고정하지 않는다', async () => {
    await show(<FormHelperText testID="helper">회사 이메일을 입력하세요</FormHelperText>);

    expect(helper()).not.toHaveStyle({ height: expect.anything() });
    expect(helper()).not.toHaveStyle({ maxHeight: expect.anything() });
  });
});

describe('공개 경계', () => {
  it('배럴은 FormHelperText 만 내보낸다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['FormHelperText']);
  });
});

/** 타입 수준 계약. jest 는 타입을 지우므로 `tsc -b` 가 검증한다. */
type Expect<T extends true> = T;
type HasProp<K extends string> = K extends keyof FormHelperTextProps ? true : false;

/** `size` 는 없다 — web 의 sm/md 가 시각적으로 완전히 같아서 아무 일도 하지 않는다. */
export type RejectsNoOpProps = [
  Expect<HasProp<'size'> extends false ? true : false>,
  Expect<HasProp<'focused'> extends false ? true : false>,
  Expect<HasProp<'required'> extends false ? true : false>,
  Expect<HasProp<'variant'> extends false ? true : false>,
  Expect<HasProp<'filled'> extends false ? true : false>,
  Expect<HasProp<'adornedStart'> extends false ? true : false>,
];

/** web DOM 개념도 받지 않습니다. */
export type RejectsWebOnlyProps = [
  Expect<HasProp<'className'> extends false ? true : false>,
  Expect<HasProp<'htmlFor'> extends false ? true : false>,
];

/** 멀쩡한 TextProps 는 그대로 남습니다. */
export type KeepsValidTextProps = [
  Expect<HasProp<'numberOfLines'>>,
  Expect<HasProp<'nativeID'>>,
  Expect<HasProp<'accessibilityLiveRegion'>>,
  Expect<HasProp<'accessibilityRole'>>,
  Expect<HasProp<'testID'>>,
];
