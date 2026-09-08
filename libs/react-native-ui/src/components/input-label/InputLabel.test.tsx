/**
 * InputLabel의 동작 계약.
 *
 * 정적 라벨이다 — float/shrink·transform·애니메이션이 없다. 핵심 불변식: 보이는 라벨은
 * 입력의 접근 가능한 이름이 아니고, 형제 입력의 `accessibilityLabel`을 건드리지 않는다.
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';
import { PlainInput } from '../plain-input';

import * as barrel from './index';
import { InputLabel } from './InputLabel';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const label = () => screen.getByTestId('label');

describe('원시와 prop 전달', () => {
  it('실제 RN Text 를 렌더하고 children 을 담는다', async () => {
    await show(<InputLabel testID="label">이메일</InputLabel>);

    expect(label().type).toBe('Text');
    expect(screen.getByText('이메일')).toBeOnTheScreen();
  });

  it('일반 TextProps 를 전달한다', async () => {
    await show(
      <InputLabel testID="label" numberOfLines={1} selectable>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveProp('numberOfLines', 1);
    expect(label()).toHaveProp('selectable', true);
  });

  it('소비자 style 이 병합된다', async () => {
    await show(
      <InputLabel testID="label" style={{ opacity: 0.5 }}>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ opacity: 0.5 });
  });

  it('소비자 style 이 토큰 색보다 뒤에 온다 — 평범한 외형은 덮을 수 있다', async () => {
    // 라벨은 상태 색이 잠기지 않는다 — Input 의 chrome 과 다르다.
    await show(
      <InputLabel testID="label" error style={{ color: 'rgb(1, 2, 3)' }}>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });

  it('ref 가 Text 에 닿는다', async () => {
    const ref = { current: null } as { current: Text | null };

    await show(
      <InputLabel testID="label" ref={ref}>
        이메일
      </InputLabel>,
    );

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.measure).toBe('function');
  });
});

describe('기본값', () => {
  it('FormControl 없이도 기본 상태로 렌더된다', async () => {
    await show(<InputLabel testID="label">이메일</InputLabel>);

    expect(label()).toHaveStyle({
      color: T.color.text.default,
      fontSize: T.typography.body.smallStrong.fontSize,
      marginBottom: T.spacing.xs,
    });
  });
});

describe('FormControl 상속', () => {
  it('color 를 상속한다 (focus 상태에서 드러난다)', async () => {
    await show(
      <FormControl color="secondary" focused>
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.secondary });
  });

  it('size 를 상속한다', async () => {
    await show(
      <FormControl size="sm">
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ fontSize: T.typography.body.tinyStrong.fontSize });
  });

  it('disabled 를 상속한다', async () => {
    await show(
      <FormControl disabled>
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.disable });
  });

  it('error 를 상속한다', async () => {
    await show(
      <FormControl error>
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.error });
  });

  it('focused 를 상속한다', async () => {
    await show(
      <FormControl focused>
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.primary });
  });

  it('required 를 상속해 표시를 그린다', async () => {
    await show(
      <FormControl required>
        <InputLabel testID="label">이메일</InputLabel>
      </FormControl>,
    );

    expect(screen.getByText('*', { exact: false })).toBeOnTheScreen();
  });
});

describe('명시 prop 이 context 를 이긴다', () => {
  it('size', async () => {
    await show(
      <FormControl size="md">
        <InputLabel testID="label" size="sm">
          이메일
        </InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ fontSize: T.typography.body.tinyStrong.fontSize });
  });

  it('color', async () => {
    await show(
      <FormControl color="primary" focused>
        <InputLabel testID="label" color="secondary">
          이메일
        </InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.secondary });
  });

  it('focused={false} 가 FormControl focused 를 이긴다', async () => {
    await show(
      <FormControl focused>
        <InputLabel testID="label" focused={false}>
          이메일
        </InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.default });
  });

  it('required={false} 가 FormControl required 를 이긴다', async () => {
    await show(
      <FormControl required>
        <InputLabel testID="label" required={false}>
          이메일
        </InputLabel>
      </FormControl>,
    );

    expect(screen.queryByText('*', { exact: false })).toBeNull();
  });

  it('disabled={false} 가 FormControl disabled 를 이긴다', async () => {
    await show(
      <FormControl disabled>
        <InputLabel testID="label" disabled={false}>
          이메일
        </InputLabel>
      </FormControl>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.default });
  });
});

describe('토큰 기반 상태 색', () => {
  it('focused primary 는 text.primary 를 쓴다', async () => {
    await show(
      <InputLabel testID="label" focused color="primary">
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.primary });
  });

  it('focused secondary 는 text.secondary 를 쓴다', async () => {
    await show(
      <InputLabel testID="label" focused color="secondary">
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.secondary });
  });

  it('sm / md 타이포가 갈린다', async () => {
    await show(
      <InputLabel testID="label" size="sm">
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({
      fontSize: T.typography.body.tinyStrong.fontSize,
      lineHeight: T.typography.body.tinyStrong.lineHeight,
    });
  });
});

describe('동시 상태 우선순위', () => {
  // `InputBase.borderSpec` 과 같은 순서 — disabled > error > focused > 평상시.
  it('disabled 가 error 를 이긴다', async () => {
    await show(
      <InputLabel testID="label" disabled error>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.disable });
  });

  it('disabled 가 focused 를 이긴다', async () => {
    await show(
      <InputLabel testID="label" disabled focused>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.disable });
  });

  it('error 가 focused 를 이긴다', async () => {
    await show(
      <InputLabel testID="label" error focused>
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.error });
  });
});

describe('접근성', () => {
  it('web 의 htmlFor 같은 연결 API 가 없다', async () => {
    await show(<InputLabel testID="label">이메일</InputLabel>);

    // 연결을 흉내 내는 prop 을 두지 않는다.
    expect(label().props.htmlFor).toBeUndefined();
    expect(label().props.accessibilityLabelledBy).toBeUndefined();
  });

  it('nativeID 를 그대로 전달한다', async () => {
    // Android 전용 `accessibilityLabelledBy` 를 소비자가 쓰려면 id 가 필요하다.
    await show(
      <InputLabel testID="label" nativeID="email-label">
        이메일
      </InputLabel>,
    );

    expect(label()).toHaveProp('nativeID', 'email-label');
  });

  it('형제 Input 의 accessibilityLabel 을 건드리지 않는다', async () => {
    await show(
      <FormControl>
        <InputLabel testID="label">이메일</InputLabel>
        <PlainInput accessibilityLabel="이메일 주소" />
      </FormControl>,
    );

    // 라벨이 있다고 Input 의 이름이 바뀌지 않는다.
    expect(screen.getByLabelText('이메일 주소')).toBeOnTheScreen();
  });

  it('required 표시는 시각 표시일 뿐이다 — 라벨 텍스트에 섞여 읽힌다', async () => {
    await show(
      <InputLabel testID="label" required>
        이메일
      </InputLabel>,
    );

    // `aria-required` 에 해당하는 수단이 없어 표시가 라벨 텍스트의 일부로 읽힌다.
    expect(label()).toHaveTextContent('이메일 *');
  });
});

describe('공개 경계', () => {
  it('배럴은 InputLabel 만 내보낸다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['InputLabel']);
  });
});
