import { Pressable, Text, View } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';

import * as barrel from './index';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

/**
 * RN Radio·RadioGroup 이 기대는 host 의 사실.
 *
 * 설치된 RN(0.81)과 RNTL 이 radiogroup·radio 역할과 checked 를 실제로 모델링하는지 먼저
 * 고정한다. RN Select 의 선택지 목록이 같은 역할을 이미 쓴다.
 */
describe('RN radio 사실 (characterization)', () => {
  it('radio 는 접근성 요소로 checked 를 알리고 자식 글자가 이름이 된다', async () => {
    await render(
      <View>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: true }}>
          <Text>일반</Text>
        </Pressable>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: false }}>
          <Text>빠른</Text>
        </Pressable>
      </View>,
    );

    expect(screen.getByRole('radio', { name: '일반' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '빠른' })).not.toBeChecked();
  });

  /**
   * radiogroup 컨테이너는 **접근성 요소가 아니다** — `accessible` 을 켜면 자식 radio 를 하나로
   * 삼켜 각각 누를 수 없게 된다 (RN Select 패널과 같은 이유). 그래서 역할로 조회되지 않고,
   * 역할·이름은 컨테이너의 prop 으로 존재한다. 테스트도 그 prop 을 본다.
   */
  it('radiogroup 컨테이너는 역할 조회에 잡히지 않고 역할·이름을 prop 으로 갖는다', async () => {
    await render(
      <View testID="group" accessibilityRole="radiogroup" accessibilityLabel="배송 방법">
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: true }}>
          <Text>일반</Text>
        </Pressable>
      </View>,
    );

    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByTestId('group')).toHaveProp('accessibilityRole', 'radiogroup');
    expect(screen.getByTestId('group')).toHaveProp('accessibilityLabel', '배송 방법');
    expect(screen.getByRole('radio', { name: '일반' })).toBeOnTheScreen();
  });
});

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

type ShippingProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const Shipping = (props: ShippingProps) => (
  <RadioGroup testID="group" label="배송 방법" {...props}>
    <Radio value="standard" label="일반" />
    <Radio value="express" label="빠른" />
    <Radio value="pickup" label="방문" disabled />
  </RadioGroup>
);

const radio = (name: string) => screen.getByRole('radio', { name });

/** 시각 원은 Pressable 의 첫 자식 View 다. */
const visualCircle = (name: string) => {
  const [first] = radio(name).children;
  if (typeof first === 'string' || first === undefined) throw new Error('visual circle not found');
  return first;
};

describe('<RadioGroup /> · <Radio /> (RN)', () => {
  it('selectionControl 토큰이 Native 트리에 있다', () => {
    expect(T.color.selectionControl.checked).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(T.color.selectionControl.indicator).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  describe('그룹과 이름', () => {
    it('radiogroup 역할과 문자열 라벨 이름을 갖고 라벨을 보여 준다', async () => {
      await show(<Shipping />);
      const group = screen.getByTestId('group');

      expect(group).toHaveProp('accessibilityRole', 'radiogroup');
      expect(group).toHaveProp('accessibilityLabel', '배송 방법');
      expect(group.props.accessible).not.toBe(true);
      expect(screen.getByText('배송 방법')).toBeOnTheScreen();
    });

    it('accessibilityLabel 이 보이는 라벨을 이긴다', async () => {
      await show(
        <RadioGroup testID="group" label="배송" accessibilityLabel="배송 방법 선택">
          <Radio value="a" label="A" />
        </RadioGroup>,
      );

      expect(screen.getByTestId('group')).toHaveProp('accessibilityLabel', '배송 방법 선택');
    });

    it('radio 는 역할과 라벨 이름을 갖고 힌트를 전달한다', async () => {
      await show(
        <RadioGroup accessibilityLabel="크기">
          <Radio value="s" label="S" accessibilityHint="가장 작은 크기" />
        </RadioGroup>,
      );

      expect(radio('S')).toHaveProp('accessibilityHint', '가장 작은 크기');
    });

    it('RadioGroup 밖의 Radio 는 명확한 오류로 실패한다', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(show(<Radio value="a" label="A" />)).rejects.toThrow(
        'Radio must be used within <RadioGroup>.',
      );

      error.mockRestore();
    });

    it('이름 없이는 컴파일되지 않는다', () => {
      void (
        (
          // @ts-expect-error — 그룹 라벨도 accessibilityLabel 도 없다.
          <RadioGroup>
            <Radio value="a" label="A" />
          </RadioGroup>
        )
      );
      // @ts-expect-error — 노드 라벨은 이름이 될 수 없다.
      void (<Radio value="a" label={<Text>A</Text>} />);
      // @ts-expect-error — value 는 필수다.
      void (<Radio label="A" />);
    });
  });

  describe('선택', () => {
    it('기본값이 없으면 아무것도 선택되지 않는다', async () => {
      await show(<Shipping />);

      for (const name of ['일반', '빠른', '방문']) expect(radio(name)).not.toBeChecked();
    });

    it('uncontrolled 면 defaultValue 로 시작해 누른 것 하나만 선택하고 알린다', async () => {
      const onValueChange = jest.fn();
      await show(<Shipping defaultValue="standard" onValueChange={onValueChange} />);

      expect(radio('일반')).toBeChecked();
      await fireEvent.press(radio('빠른'));

      expect(radio('빠른')).toBeChecked();
      expect(radio('일반')).not.toBeChecked();
      expect(onValueChange).toHaveBeenCalledWith('express');
    });

    it('이미 선택된 radio 를 다시 누르면 해제되지도 알리지도 않는다', async () => {
      const onValueChange = jest.fn();
      await show(<Shipping defaultValue="standard" onValueChange={onValueChange} />);

      await fireEvent.press(radio('일반'));

      expect(radio('일반')).toBeChecked();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('controlled 면 알리기만 하고 스스로 바뀌지 않는다', async () => {
      const onValueChange = jest.fn();
      await show(<Shipping value="standard" onValueChange={onValueChange} />);

      await fireEvent.press(radio('빠른'));

      expect(onValueChange).toHaveBeenCalledWith('express');
      expect(radio('일반')).toBeChecked();
      expect(radio('빠른')).not.toBeChecked();
    });

    it('controlled value 갱신이 선택을 옮긴다', async () => {
      const { rerender } = await show(<Shipping value="standard" onValueChange={jest.fn()} />);

      await rerender(
        <ThemeProvider>
          <Shipping value="express" onValueChange={jest.fn()} />
        </ThemeProvider>,
      );

      expect(radio('빠른')).toBeChecked();
      expect(radio('일반')).not.toBeChecked();
    });
  });

  describe('disabled', () => {
    it('비활성 선택지는 disabled 를 알리고 눌러도 바뀌지 않는다', async () => {
      const onValueChange = jest.fn();
      await show(<Shipping onValueChange={onValueChange} />);

      await fireEvent.press(radio('방문'));

      expect(radio('방문')).toBeDisabled();
      expect(radio('방문')).not.toBeChecked();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('그룹 disabled 는 모든 선택지를 막는다', async () => {
      const onValueChange = jest.fn();
      await show(<Shipping disabled onValueChange={onValueChange} />);

      await fireEvent.press(radio('빠른'));

      for (const name of ['일반', '빠른', '방문']) expect(radio(name)).toBeDisabled();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('FormControl 의 disabled·error 를 상속한다', async () => {
      await show(
        <FormControl disabled error>
          <Shipping />
        </FormControl>,
      );

      expect(radio('일반')).toBeDisabled();
      expect(visualCircle('일반')).toHaveStyle({ borderColor: T.border.disabled.color });
    });
  });

  describe('터치 타깃과 토큰', () => {
    it('시각 원과 별개로 최소 터치 타깃을 지킨다', async () => {
      await show(<Shipping />);

      expect(radio('일반')).toHaveStyle({
        minWidth: T.spacing['4xl'],
        minHeight: T.spacing['4xl'],
      });
      expect(visualCircle('일반')).toHaveStyle({
        width: T.spacing.lg,
        height: T.spacing.lg,
        borderRadius: T.radius.rounded,
      });
    });

    it('평상시는 field.border 경계, 선택은 selectionControl 면과 가운데 점이다', async () => {
      await show(<Shipping defaultValue="standard" />);

      expect(visualCircle('빠른')).toHaveStyle({
        borderColor: T.color.field.border,
        backgroundColor: 'transparent',
      });
      expect(visualCircle('일반')).toHaveStyle({
        borderColor: T.color.selectionControl.checked,
        backgroundColor: T.color.selectionControl.checked,
      });

      const [dot] = visualCircle('일반').children;
      if (typeof dot === 'string' || dot === undefined) throw new Error('dot not found');
      expect(dot).toHaveStyle({
        width: T.spacing.sm,
        height: T.spacing.sm,
        backgroundColor: T.color.selectionControl.indicator,
      });
    });

    it('그룹 error 는 경계를 stroke.error 로 바꾸고 disabled 는 error 를 이긴다', async () => {
      await show(<Shipping error defaultValue="standard" />);

      expect(visualCircle('빠른')).toHaveStyle({ borderColor: T.color.stroke.error });
      expect(visualCircle('방문')).toHaveStyle({ borderColor: T.border.disabled.color });
    });
  });

  it('배럴은 Radio·RadioGroup 만 공개한다', () => {
    expect(Object.keys(barrel).sort()).toEqual(['Radio', 'RadioGroup']);
  });
});
