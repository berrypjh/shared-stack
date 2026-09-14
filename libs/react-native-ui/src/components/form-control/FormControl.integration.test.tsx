/**
 * FormControl ↔ Input 계열 통합 계약. 공개 컴포넌트만 쓴다.
 *
 * 진짜 TextInput 이벤트가 focus를 움직이는지, context 상속이 Input 기본값에 가려지지 않는지,
 * 기존 Input 불변식이 그대로인지를 본다. 라벨/헬퍼의 자동 연결은 검증 대상이 아니다 —
 * RN에 그 수단이 없다.
 */
import { Text } from 'react-native';

import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { BoxedInput } from '../boxed-input';
import { FormHelperText } from '../form-helper-text';
import { IconButton } from '../icon-button';
import { InputLabel } from '../input-label';

import { FormControl } from './FormControl';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);
const input = () => screen.getByLabelText('이메일');
const wrapper = () => input().parent!;
const label = () => screen.getByTestId('label');
const helper = () => screen.getByTestId('helper');

const Field = (props: Record<string, unknown>) => (
  <FormControl {...props}>
    <InputLabel testID="label">이메일</InputLabel>
    <BoxedInput accessibilityLabel="이메일" />
    <FormHelperText testID="helper">회사 이메일을 입력하세요</FormHelperText>
  </FormControl>
);

describe('focus 가 FormControl 을 통해 흐른다', () => {
  it('Input focus 가 라벨을 focused 로 만든다', async () => {
    await show(<Field />);
    expect(label()).toHaveStyle({ color: T.color.text.default });

    await fireEvent(input(), 'focus');

    expect(label()).toHaveStyle({ color: T.color.text.primary });
  });

  it('blur 가 라벨을 평상시로 되돌린다', async () => {
    await show(<Field />);

    await fireEvent(input(), 'focus');
    await fireEvent(input(), 'blur');

    expect(label()).toHaveStyle({ color: T.color.text.default });
  });

  it('Input 의 시각 focus 도 FormControl 을 따른다', async () => {
    await show(<Field />);

    await fireEvent(input(), 'focus');

    expect(wrapper()).toHaveStyle({
      borderColor: T.border.primary.color,
      borderWidth: T.component.field.focusRingWidth,
    });
  });

  it('controlled focused={true} 는 blur 에도 유지된다', async () => {
    await show(<Field focused />);

    await fireEvent(input(), 'blur');

    expect(label()).toHaveStyle({ color: T.color.text.primary });
    expect(wrapper()).toHaveStyle({ borderColor: T.border.primary.color });
  });

  it('controlled focused={false} 는 focus 에도 유지된다', async () => {
    await show(<Field focused={false} />);

    await fireEvent(input(), 'focus');

    expect(label()).toHaveStyle({ color: T.color.text.default });
    expect(wrapper()).toHaveStyle({ borderColor: T.color.field.border });
  });

  it('소비자 onFocus/onBlur 콜백도 그대로 호출된다', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" onFocus={onFocus} onBlur={onBlur} />
      </FormControl>,
    );

    await fireEvent(input(), 'focus');
    await fireEvent(input(), 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('FormControl 밖에서는 기존 로컬 focus 동작이 그대로다', async () => {
    await show(<BoxedInput accessibilityLabel="이메일" />);

    await fireEvent(input(), 'focus');

    expect(wrapper()).toHaveStyle({ borderColor: T.border.primary.color });
  });
});

describe('disabled 상속', () => {
  it('FormControl disabled 가 실제 TextInput 을 잠근다', async () => {
    await show(<Field disabled />);

    expect(input()).toHaveProp('editable', false);
    expect(input()).toHaveProp('accessibilityState', { disabled: true });
  });

  it('라벨과 헬퍼도 disabled 표현이 된다', async () => {
    await show(<Field disabled />);

    expect(label()).toHaveStyle({ color: T.color.text.disable });
    expect(helper()).toHaveStyle({ color: T.color.text.disable });
  });

  it('입력 텍스트도 disabled 색이 된다', async () => {
    await show(<Field disabled />);

    expect(input()).toHaveStyle({ color: T.color.text.disable });
  });

  it('disabled 면 focus 알림이 와도 focused 가 되지 않는다', async () => {
    await show(<Field disabled />);

    await fireEvent(input(), 'focus');

    expect(label()).toHaveStyle({ color: T.color.text.disable });
  });

  it('disabled 를 켰다 끄면 라벨이 포커스를 주장하지 않는다', async () => {
    const view = await show(<Field />);

    await fireEvent(input(), 'focus');
    expect(label()).toHaveStyle({ color: T.color.text.primary });

    // 비활성화되는 동안 네이티브 blur 알림은 오지 않을 수 있다.
    await view.rerender(
      <ThemeProvider>
        <Field disabled />
      </ThemeProvider>,
    );
    expect(label()).toHaveStyle({ color: T.color.text.disable });

    // 다시 켰을 때 포커스를 가진 것은 아무것도 없다.
    await view.rerender(
      <ThemeProvider>
        <Field />
      </ThemeProvider>,
    );

    expect(label()).toHaveStyle({ color: T.color.text.default });
  });
});

describe('error 상속', () => {
  it('Input chrome·라벨·헬퍼가 함께 error 가 된다', async () => {
    await show(<Field error />);

    expect(wrapper()).toHaveStyle({ borderColor: T.color.stroke.error });
    expect(label()).toHaveStyle({ color: T.color.text.error });
    expect(helper()).toHaveStyle({ color: T.color.text.error });
  });
});

describe('color / size / fullWidth 상속', () => {
  it('color 를 상속한다', async () => {
    await show(<Field color="secondary" />);

    await fireEvent(input(), 'focus');

    expect(wrapper()).toHaveStyle({ borderColor: T.color.stroke.secondary });
    expect(label()).toHaveStyle({ color: T.color.text.secondary });
  });

  it('size 를 상속한다', async () => {
    await show(<Field size="sm" />);

    expect(input()).toHaveStyle({ fontSize: T.typography.body.small.fontSize });
    expect(label()).toHaveStyle({ fontSize: T.typography.body.tinyStrong.fontSize });
  });

  it('fullWidth 를 상속한다', async () => {
    await show(<Field fullWidth />);

    expect(wrapper()).toHaveStyle({ alignSelf: 'stretch' });
  });
});

describe('명시 prop 이 context 를 이긴다', () => {
  it('Input 의 disabled={false} 가 FormControl disabled 를 이긴다', async () => {
    await show(
      <FormControl disabled>
        <BoxedInput accessibilityLabel="이메일" disabled={false} />
      </FormControl>,
    );

    expect(input()).toHaveProp('editable', true);
    expect(input()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('Input 의 size 가 FormControl size 를 이긴다', async () => {
    await show(
      <FormControl size="sm">
        <BoxedInput accessibilityLabel="이메일" size="md" />
      </FormControl>,
    );

    expect(input()).toHaveStyle({ fontSize: T.typography.body.medium.fontSize });
  });

  it('Input 의 error={false} 가 FormControl error 를 이긴다', async () => {
    await show(
      <FormControl error>
        <BoxedInput accessibilityLabel="이메일" error={false} />
      </FormControl>,
    );

    expect(wrapper()).toHaveStyle({ borderColor: T.color.field.border });
  });
});

describe('중첩', () => {
  it('가장 가까운 FormControl 이 이긴다', async () => {
    await show(
      <FormControl error>
        <FormControl color="secondary">
          <BoxedInput accessibilityLabel="이메일" />
        </FormControl>
      </FormControl>,
    );

    expect(wrapper()).toHaveStyle({ borderColor: T.color.field.border });
  });
});

describe('기존 Input 불변식이 그대로다', () => {
  it('readOnly 는 여전히 disabled 와 다르다', async () => {
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" readOnly />
      </FormControl>,
    );

    expect(input()).toHaveProp('editable', false);
    expect(input()).toHaveProp('accessibilityState', { disabled: false });
  });

  it('readOnly 는 상속되지 않는다', async () => {
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" />
      </FormControl>,
    );

    expect(input()).toHaveProp('editable', true);
  });

  it('controlled value 는 여전히 소비자 것이다', async () => {
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" value="fixed" onChangeText={jest.fn()} />
      </FormControl>,
    );

    await fireEvent.changeText(input(), 'typed');

    expect(input()).toHaveProp('value', 'fixed');
  });

  it('uncontrolled 는 여전히 네이티브 소유다', async () => {
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" defaultValue="initial" />
      </FormControl>,
    );

    await fireEvent.changeText(input(), 'typed');

    expect(input().props.value).toBeUndefined();
    expect(input()).toHaveDisplayValue('typed');
  });

  it('multiline 이어도 TextInput 은 하나다', async () => {
    await show(
      <FormControl>
        <BoxedInput accessibilityLabel="이메일" multiline />
      </FormControl>,
    );

    expect(screen.getAllByLabelText('이메일')).toHaveLength(1);
  });

  it('래퍼는 접근성 집합체가 아니다', async () => {
    await show(<Field />);

    expect(wrapper().props.accessible).not.toBe(true);
  });
});

describe('접근성 합성', () => {
  it('라벨·헬퍼는 보이고, Input 이름은 자기 accessibilityLabel 에서 온다', async () => {
    await show(<Field />);

    expect(screen.getByText('이메일')).toBeOnTheScreen();
    expect(screen.getByText('회사 이메일을 입력하세요')).toBeOnTheScreen();
    // 자동 연결을 주장하지 않습니다 — 이름은 Input 자신의 계약에서 옵니다.
    expect(input()).toHaveAccessibleName('이메일');
    expect(input().props.accessibilityLabelledBy).toBeUndefined();
  });

  it('상호작용 장식을 눌러도 FormControl 이 blur 되지 않는다', async () => {
    const onPress = jest.fn();
    await show(
      <FormControl>
        <InputLabel testID="label">이메일</InputLabel>
        <BoxedInput
          accessibilityLabel="이메일"
          endAdornment={
            <IconButton
              accessibilityLabel="지우기"
              size="sm"
              icon={<Text>×</Text>}
              onPress={onPress}
            />
          }
        />
      </FormControl>,
    );

    await fireEvent(input(), 'focus');
    await fireEvent.press(screen.getByRole('button', { name: '지우기' }));

    // RN 은 View 가 포커스를 버블링하지 않아 합성 blur 자체가 생기지 않는다.
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(label()).toHaveStyle({ color: T.color.text.primary });
  });
});
