import { Switch as NativeSwitch } from 'react-native';

import { Native, type RNTokens, type ThemeName, themes } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';

import * as barrel from './index';
import { Switch } from './Switch';

/**
 * RN Switch 래퍼가 기대는 core `Switch` 의 사실.
 *
 * 래퍼는 역할·상태·누름을 다시 만들지 않는다. 먼저 설치된 RN(0.81)의 core Switch 가
 * switch 역할·이름·value·disabled·값 변경을 스스로 내보내는지 고정한다.
 */
describe('core Switch 사실 (characterization)', () => {
  it('switch 역할과 이름을 갖고 value 가 checked 다', async () => {
    await render(<NativeSwitch accessibilityLabel="알림 받기" value />);

    expect(screen.getByRole('switch', { name: '알림 받기' })).toBeChecked();
  });

  it('value=false 면 checked 가 아니다', async () => {
    await render(<NativeSwitch accessibilityLabel="알림 받기" value={false} />);

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  /**
   * core Switch 의 iOS 분기는 `disabled` 를 **native prop 으로만** 넘기고 `accessibilityState` 를
   * 건드리지 않는다 (Android 분기는 합친다). 실제 iOS 에서는 UISwitch 가 비활성을 스스로
   * 알리지만, 접근성 상태로는 드러나지 않는다 — jest 기본 플랫폼이 iOS 라서 여기서 보인다.
   */
  it('iOS 경로에서 disabled 는 native prop 으로만 가고 접근성 상태에는 없다', async () => {
    await render(<NativeSwitch accessibilityLabel="알림 받기" value={false} disabled />);

    expect(screen.getByRole('switch')).toHaveProp('disabled', true);
    expect(screen.getByRole('switch')).not.toBeDisabled();
  });

  it('값 변경을 onValueChange 로 알린다', async () => {
    const onValueChange = jest.fn();
    await render(
      <NativeSwitch accessibilityLabel="알림 받기" value={false} onValueChange={onValueChange} />,
    );

    await fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

const T = Native.Light.tokens;

const show = (ui: ReactElement, mode: ThemeName = 'light') =>
  render(<ThemeProvider mode={mode}>{ui}</ThemeProvider>);

const control = () => screen.getByRole('switch');

/**
 * 토큰이 core Switch 에 도착했는지는 host 가 받은 prop 으로 본다 (jest 는 iOS 경로다):
 * `trackColor.false → tintColor`, `trackColor.true → onTintColor`, `thumbColor → thumbTintColor`,
 * `ios_backgroundColor → style.backgroundColor`.
 */
const expectTokens = (tokens: RNTokens) => {
  const { selectionControl } = tokens.color;

  expect(control()).toHaveProp('tintColor', selectionControl.trackOff);
  expect(control()).toHaveProp('onTintColor', selectionControl.checked);
  expect(control()).toHaveProp('thumbTintColor', selectionControl.indicator);
  expect(control()).toHaveStyle({ backgroundColor: selectionControl.trackOff });
};

describe('<Switch /> (RN)', () => {
  it('selectionControl 토큰이 Native 트리에 있다', () => {
    for (const key of ['trackOff', 'checked', 'indicator'] as const) {
      expect(T.color.selectionControl[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  describe('core Switch 그대로', () => {
    it('core Switch 하나만 렌더한다 — 접근성 트리를 감싸지 않는다', async () => {
      await show(<Switch accessibilityLabel="알림 받기" value={false} onValueChange={jest.fn()} />);

      expect(screen.getAllByRole('switch')).toHaveLength(1);
      expect(screen.toJSON()).toMatchObject({ type: 'RCTSwitch' });
    });

    it('switch 역할·이름·value 를 core 가 알린다', async () => {
      await show(<Switch accessibilityLabel="알림 받기" value onValueChange={jest.fn()} />);

      expect(screen.getByRole('switch', { name: '알림 받기' })).toBeChecked();
    });

    it('controlled 다 — 값 변경을 알리기만 한다', async () => {
      const onValueChange = jest.fn();
      await show(
        <Switch accessibilityLabel="알림 받기" value={false} onValueChange={onValueChange} />,
      );

      await fireEvent(control(), 'valueChange', true);

      expect(onValueChange).toHaveBeenCalledWith(true);
      expect(control()).not.toBeChecked();
    });

    it('accessibilityHint·testID·style 을 전달한다', async () => {
      await show(
        <Switch
          accessibilityLabel="알림 받기"
          accessibilityHint="새 댓글이 달리면 알려 줍니다"
          testID="alerts"
          style={{ marginTop: 8 }}
          value={false}
          onValueChange={jest.fn()}
        />,
      );

      expect(screen.getByTestId('alerts')).toBe(control());
      expect(control()).toHaveProp('accessibilityHint', '새 댓글이 달리면 알려 줍니다');
      expect(control()).toHaveStyle({ marginTop: 8 });
    });
  });

  describe('disabled', () => {
    /**
     * 두 플랫폼에서 같게 알린다 — core 의 Android 분기가 이미 하는 일을 iOS 에도 한다.
     * 같은 요소에 상태를 맞출 뿐 접근성 트리를 늘리지 않는다.
     */
    it('native disabled 와 접근성 상태를 함께 준다', async () => {
      await show(
        <Switch accessibilityLabel="알림 받기" value={false} onValueChange={jest.fn()} disabled />,
      );

      expect(control()).toHaveProp('disabled', true);
      expect(control()).toBeDisabled();
    });

    it('소비자 accessibilityState 가 disabled 를 덮을 수 없고 나머지는 남는다', async () => {
      await show(
        <Switch
          accessibilityLabel="알림 받기"
          accessibilityState={{ disabled: true, busy: true }}
          value={false}
          onValueChange={jest.fn()}
        />,
      );

      expect(control()).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ disabled: false, busy: true }),
      );
    });

    it('FormControl 의 disabled 를 상속하고 명시 prop 이 이긴다', async () => {
      await show(
        <FormControl disabled>
          <Switch accessibilityLabel="inherits" value={false} onValueChange={jest.fn()} />
          <Switch
            accessibilityLabel="explicit"
            value={false}
            onValueChange={jest.fn()}
            disabled={false}
          />
        </FormControl>,
      );

      expect(screen.getByRole('switch', { name: 'inherits' })).toBeDisabled();
      expect(screen.getByRole('switch', { name: 'explicit' })).toBeEnabled();
    });
  });

  describe('토큰', () => {
    it('off·on 트랙, thumb, iOS 배경을 selectionControl 에서 가져온다', async () => {
      await show(<Switch accessibilityLabel="알림 받기" value={false} onValueChange={jest.fn()} />);

      expectTokens(T);
    });

    it('테마를 바꾸면 토큰도 바뀐다', async () => {
      const ui = (mode: ThemeName) => (
        <ThemeProvider mode={mode}>
          <Switch accessibilityLabel="알림 받기" value onValueChange={jest.fn()} />
        </ThemeProvider>
      );
      const { rerender } = await render(ui('light'));

      await rerender(ui('dark'));

      expectTokens(Native.Dark.tokens);
      expect(Native.Dark.tokens.color.selectionControl.checked).not.toBe(
        T.color.selectionControl.checked,
      );
    });

    it.each(themes.map((theme) => theme.name))('%s 테마에서 모든 색이 풀린다', async (mode) => {
      await show(
        <Switch accessibilityLabel="알림 받기" value={false} onValueChange={jest.fn()} />,
        mode,
      );

      for (const prop of ['tintColor', 'onTintColor', 'thumbTintColor']) {
        expect(control().props[prop]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  it('이름·value·onValueChange 없이는 컴파일되지 않고 색을 받지 않는다', () => {
    // @ts-expect-error — accessibilityLabel 은 필수다.
    void (<Switch value={false} onValueChange={jest.fn()} />);
    // @ts-expect-error — controlled 전용이라 value 가 필수다.
    void (<Switch accessibilityLabel="a" onValueChange={jest.fn()} />);
    // @ts-expect-error — 트랙 색은 토큰이 소유한다.
    void (<Switch accessibilityLabel="a" value onValueChange={jest.fn()} trackColor={{}} />);
  });

  it('배럴은 Switch 만 공개한다', () => {
    expect(Object.keys(barrel)).toEqual(['Switch']);
  });
});
