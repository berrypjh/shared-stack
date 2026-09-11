import { type AccessibilityState, Pressable, Text } from 'react-native';

import { Native, type ThemeName } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';

import { Checkbox } from './Checkbox';
import * as barrel from './index';

/**
 * RN Checkbox 가 기대는 host 의 사실.
 *
 * 설치된 RN(0.81)과 RNTL 이 checkbox 역할·checked·mixed·disabled 를 실제로 모델링하는지 먼저
 * 고정한다. 컴포넌트는 이 위에 서 있다 — 여기가 깨지면 아래 테스트의 근거가 사라진다.
 */
describe('RN checkbox 사실 (characterization)', () => {
  it('Pressable 은 checkbox 역할과 checked 를 알리고 자식 글자가 이름이 된다', async () => {
    await render(
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: true }}>
        <Text>약관 동의</Text>
      </Pressable>,
    );

    expect(screen.getByRole('checkbox', { name: '약관 동의' })).toBeChecked();
  });

  it("혼합 상태는 checked: 'mixed' 로 표현된다", async () => {
    const mixed: AccessibilityState = { checked: 'mixed' };

    await render(
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={mixed}
        accessibilityLabel="전체 선택"
      />,
    );

    expect(screen.getByRole('checkbox', { name: '전체 선택' })).toBePartiallyChecked();
  });

  it('disabled Pressable 은 누름을 전달하지 않고 disabled 를 알린다', async () => {
    const onPress = jest.fn();

    await render(
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="probe"
        disabled
        onPress={onPress}
      />,
    );
    await fireEvent.press(screen.getByRole('checkbox'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});

const T = Native.Light.tokens;

const show = (ui: ReactElement, mode: ThemeName = 'light') =>
  render(<ThemeProvider mode={mode}>{ui}</ThemeProvider>);

const box = () => screen.getByRole('checkbox');

/** 시각 상자는 Pressable 의 첫 자식 View 다. 상태 색은 여기서 읽는다. */
const visualBox = () => {
  const [first] = box().children;
  if (typeof first === 'string' || first === undefined) throw new Error('visual box not found');
  return first;
};

describe('<Checkbox /> (RN)', () => {
  /**
   * 기대값과 실제값을 둘 다 토큰에서 읽으므로, 토큰이 빠지면 둘 다 `undefined` 가 되어
   * 거짓 green 이 난다. 토큰이 실제로 있다는 사실부터 못박는다.
   */
  it('selectionControl 토큰이 Native 트리에 있다', () => {
    expect(T.color.selectionControl.checked).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(T.color.selectionControl.indicator).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  describe('역할과 이름', () => {
    it('checkbox 역할이고 문자열 라벨이 이름이 된다', async () => {
      await show(<Checkbox label="약관 동의" />);

      expect(screen.getByRole('checkbox', { name: '약관 동의' })).toBeOnTheScreen();
      expect(screen.getByText('약관 동의')).toBeOnTheScreen();
    });

    it('accessibilityLabel 이 보이는 라벨을 이긴다', async () => {
      await show(<Checkbox label="동의" accessibilityLabel="이용 약관 동의" />);

      expect(screen.getByRole('checkbox', { name: '이용 약관 동의' })).toBeOnTheScreen();
    });

    it('라벨 없이 accessibilityLabel 만으로 이름을 갖는다', async () => {
      await show(<Checkbox accessibilityLabel="이 행 선택" />);

      expect(screen.getByRole('checkbox', { name: '이 행 선택' })).toBeOnTheScreen();
    });

    it('accessibilityHint 를 전달한다', async () => {
      await show(<Checkbox label="약관 동의" accessibilityHint="다음 단계로 가려면 필요합니다" />);

      expect(box()).toHaveProp('accessibilityHint', '다음 단계로 가려면 필요합니다');
    });

    it('이름 없이는 컴파일되지 않는다', () => {
      // @ts-expect-error — 라벨도 accessibilityLabel 도 없다.
      void (<Checkbox />);
      // @ts-expect-error — 노드 라벨은 이름이 될 수 없다.
      void (<Checkbox label={<Text>약관</Text>} />);
      void (<Checkbox label={<Text>약관</Text>} accessibilityLabel="약관" />);
    });
  });

  describe('checked 상태', () => {
    it('기본은 unchecked 다', async () => {
      await show(<Checkbox label="약관 동의" />);

      expect(box()).not.toBeChecked();
    });

    it('checked 를 알린다', async () => {
      await show(<Checkbox label="약관 동의" checked onCheckedChange={jest.fn()} />);

      expect(box()).toBeChecked();
    });

    it("indeterminate 는 checked 와 무관하게 'mixed' 로 알린다", async () => {
      await show(<Checkbox label="전체 선택" checked indeterminate onCheckedChange={jest.fn()} />);

      expect(box()).toBePartiallyChecked();
    });

    it('소비자 accessibilityState 가 checked·disabled 를 덮을 수 없다', async () => {
      await show(
        <Checkbox
          label="약관 동의"
          accessibilityState={{ checked: true, disabled: true, busy: true }}
        />,
      );

      expect(box()).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ checked: false, disabled: false, busy: true }),
      );
    });
  });

  describe('누름', () => {
    it('uncontrolled 면 defaultChecked 로 시작해 스스로 토글하고 알린다', async () => {
      const onCheckedChange = jest.fn();
      await show(<Checkbox label="약관 동의" onCheckedChange={onCheckedChange} />);

      await fireEvent.press(box());

      expect(box()).toBeChecked();
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('defaultChecked 가 초기값이다', async () => {
      await show(<Checkbox label="약관 동의" defaultChecked />);

      expect(box()).toBeChecked();
    });

    it('controlled 면 알리기만 하고 스스로 바뀌지 않는다', async () => {
      const onCheckedChange = jest.fn();
      await show(<Checkbox label="약관 동의" checked={false} onCheckedChange={onCheckedChange} />);

      await fireEvent.press(box());

      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(box()).not.toBeChecked();
    });

    it('controlled prop 갱신이 반영된다', async () => {
      const { rerender } = await show(
        <Checkbox label="약관 동의" checked={false} onCheckedChange={jest.fn()} />,
      );

      await rerender(
        <ThemeProvider>
          <Checkbox label="약관 동의" checked onCheckedChange={jest.fn()} />
        </ThemeProvider>,
      );

      expect(box()).toBeChecked();
    });

    it('indeterminate 를 누르면 web 과 같이 checked 를 뒤집어 알린다', async () => {
      const onCheckedChange = jest.fn();
      await show(
        <Checkbox
          label="전체 선택"
          checked={false}
          indeterminate
          onCheckedChange={onCheckedChange}
        />,
      );

      await fireEvent.press(box());

      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('disabled 면 바뀌지도 알리지도 않는다', async () => {
      const onCheckedChange = jest.fn();
      await show(<Checkbox label="약관 동의" disabled onCheckedChange={onCheckedChange} />);

      await fireEvent.press(box());

      expect(box()).toBeDisabled();
      expect(box()).not.toBeChecked();
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('FormControl', () => {
    it('disabled·error 를 상속한다', async () => {
      await show(
        <FormControl disabled error>
          <Checkbox label="약관 동의" />
        </FormControl>,
      );

      expect(box()).toBeDisabled();
      expect(visualBox()).toHaveStyle({ borderColor: T.border.disabled.color });
    });

    it('명시 prop 이 FormControl 을 이긴다', async () => {
      await show(
        <FormControl disabled error>
          <Checkbox label="약관 동의" disabled={false} error={false} />
        </FormControl>,
      );

      expect(box()).toBeEnabled();
      expect(visualBox()).toHaveStyle({ borderColor: T.color.field.border });
    });
  });

  describe('터치 타깃과 style', () => {
    it('시각 상자와 별개로 최소 터치 타깃을 지킨다', async () => {
      await show(<Checkbox label="약관 동의" />);

      expect(box()).toHaveStyle({ minWidth: T.spacing['4xl'], minHeight: T.spacing['4xl'] });
      expect(visualBox()).toHaveStyle({ width: T.spacing.lg, height: T.spacing.lg });
    });

    it('소비자 style 은 적용되지만 터치 타깃을 줄일 수 없다', async () => {
      await show(
        <Checkbox label="약관 동의" style={{ marginTop: 8, minHeight: 0, minWidth: 0 }} />,
      );

      expect(box()).toHaveStyle({
        marginTop: 8,
        minWidth: T.spacing['4xl'],
        minHeight: T.spacing['4xl'],
      });
    });
  });

  describe('토큰 매핑 — disabled > error > checked > 평상시', () => {
    it('평상시 상자는 field.border 경계에 투명 면이다', async () => {
      await show(<Checkbox label="약관 동의" />);

      expect(visualBox()).toHaveStyle({
        borderColor: T.color.field.border,
        backgroundColor: 'transparent',
      });
    });

    it('checked 는 selectionControl.checked 면과 경계를 쓴다', async () => {
      await show(<Checkbox label="약관 동의" checked onCheckedChange={jest.fn()} />);

      expect(visualBox()).toHaveStyle({
        borderColor: T.color.selectionControl.checked,
        backgroundColor: T.color.selectionControl.checked,
      });
    });

    it('error 경계는 checked 경계를 이긴다', async () => {
      await show(<Checkbox label="약관 동의" checked error onCheckedChange={jest.fn()} />);

      expect(visualBox()).toHaveStyle({
        borderColor: T.color.stroke.error,
        backgroundColor: T.color.selectionControl.checked,
      });
    });

    it('disabled 는 error 와 checked 를 이긴다', async () => {
      await show(<Checkbox label="약관 동의" checked error disabled onCheckedChange={jest.fn()} />);

      expect(visualBox()).toHaveStyle({
        borderColor: T.color.background.disable,
        backgroundColor: T.color.background.disable,
      });
    });

    it('disabled 라벨은 text.disable 이다', async () => {
      await show(<Checkbox label="약관 동의" disabled />);

      expect(screen.getByText('약관 동의')).toHaveStyle({ color: T.color.text.disable });
    });

    it('테마를 따른다', async () => {
      await show(<Checkbox label="약관 동의" checked onCheckedChange={jest.fn()} />, 'dark');

      expect(visualBox()).toHaveStyle({
        backgroundColor: Native.Dark.tokens.color.selectionControl.checked,
      });
    });
  });

  it('배럴은 Checkbox 만 공개한다', () => {
    expect(Object.keys(barrel)).toEqual(['Checkbox']);
  });
});
