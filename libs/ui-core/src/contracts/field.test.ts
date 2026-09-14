import type { FieldSemanticProps, InputFieldSemanticProps } from './field';

const field: FieldSemanticProps = {
  variant: 'boxed',
  size: 'md',
  color: 'primary',
  disabled: true,
  error: true,
  fullWidth: true,
};

const inputField: InputFieldSemanticProps = {
  variant: 'plain',
  size: 'sm',
  color: 'secondary',
  disabled: false,
  error: false,
  fullWidth: false,
  autoFocus: true,
  readOnly: true,
  multiline: true,
};

describe('Field 계약이 받는 것', () => {
  it('공유되는 시맨틱 키만 가진다', () => {
    expect(Object.keys(field).sort()).toEqual([
      'color',
      'disabled',
      'error',
      'fullWidth',
      'size',
      'variant',
    ]);
  });

  it('입력 필드는 세 가지를 더 가진다', () => {
    expect(Object.keys(inputField).sort()).toEqual([
      'autoFocus',
      'color',
      'disabled',
      'error',
      'fullWidth',
      'multiline',
      'readOnly',
      'size',
      'variant',
    ]);
  });

  it('세 variant 어휘를 모두 받는다', () => {
    const variants: FieldSemanticProps['variant'][] = ['plain', 'filled', 'boxed'];

    expect(variants).toHaveLength(3);
  });
});

describe('Field 계약이 거부하는 것', () => {
  it('어휘에 없는 스칼라 값을 거부한다', () => {
    const variant: FieldSemanticProps = {
      // @ts-expect-error variant는 plain|filled|boxed뿐이다
      variant: 'outlined',
    };
    const size: FieldSemanticProps = {
      // @ts-expect-error field size는 sm|md뿐이다 — lg는 Button 어휘다
      size: 'lg',
    };
    const color: FieldSemanticProps = {
      // @ts-expect-error color는 primary|secondary뿐이다
      color: 'error',
    };

    expect([variant, size, color]).toHaveLength(3);
  });

  it('RN에 구현이 없는 required를 거부한다', () => {
    const required: FieldSemanticProps = {
      // @ts-expect-error RN 구현은 있으나 불변식이 달라 승격하지 않는다 — react-ui가 가진다
      required: true,
    };

    expect(required).toBeDefined();
  });

  it('web 전용 폼 규약을 거부한다', () => {
    const margin: FieldSemanticProps = {
      // @ts-expect-error margin은 web 폼 밀도 규약이다
      margin: 'dense',
    };
    const hiddenLabel: FieldSemanticProps = {
      // @ts-expect-error hiddenLabel은 web 레이블 규약이다
      hiddenLabel: true,
    };
    const rows: InputFieldSemanticProps = {
      // @ts-expect-error rows는 textarea 어휘다 — RN TextInputProps에는 없다
      rows: 3,
    };
    const type: InputFieldSemanticProps = {
      // @ts-expect-error type은 HTML input 어휘다
      type: 'email',
    };
    const name: InputFieldSemanticProps = {
      // @ts-expect-error name은 HTML 폼 계약이다
      name: 'email',
    };
    const id: InputFieldSemanticProps = {
      // @ts-expect-error id는 DOM 식별자다
      id: 'email',
    };

    expect([margin, hiddenLabel, rows, type, name, id]).toHaveLength(6);
  });

  it('값과 이벤트를 거부한다', () => {
    const value: InputFieldSemanticProps = {
      // @ts-expect-error 값 도메인이 렌더러마다 다르다
      value: 'abc',
    };
    const onChange: InputFieldSemanticProps = {
      // @ts-expect-error DOM 이벤트 타입이다
      onChange: () => undefined,
    };
    const onChangeText: InputFieldSemanticProps = {
      // @ts-expect-error RN 전용 콜백이다
      onChangeText: () => undefined,
    };

    expect([value, onChange, onChangeText]).toHaveLength(3);
  });

  it('렌더러 prop과 슬롯을 거부한다', () => {
    const className: FieldSemanticProps = {
      // @ts-expect-error className은 web 렌더러 소유다
      className: 'x',
    };
    const style: FieldSemanticProps = {
      // @ts-expect-error style 타입은 렌더러마다 다르다
      style: {},
    };
    const containerStyle: FieldSemanticProps = {
      // @ts-expect-error containerStyle은 RN ViewStyle이다
      containerStyle: {},
    };
    const keyboardType: InputFieldSemanticProps = {
      // @ts-expect-error 키보드 prop은 RN 소유다
      keyboardType: 'email-address',
    };
    const inputMode: InputFieldSemanticProps = {
      // @ts-expect-error inputMode는 렌더러 입력 힌트다
      inputMode: 'email',
    };
    const accessibilityLabel: FieldSemanticProps = {
      // @ts-expect-error 접근성 이름은 렌더러 소유다 — RN이 타입에서 필수로 요구한다
      accessibilityLabel: '이메일',
    };
    const startAdornment: InputFieldSemanticProps = {
      // @ts-expect-error 슬롯은 ReactNode라 렌더러 소유다
      startAdornment: null,
    };
    const endAdornment: InputFieldSemanticProps = {
      // @ts-expect-error 슬롯은 ReactNode라 렌더러 소유다
      endAdornment: null,
    };
    const inputProps: InputFieldSemanticProps = {
      // @ts-expect-error web DOM prop 통로다
      inputProps: {},
    };

    expect([
      className,
      style,
      containerStyle,
      keyboardType,
      inputMode,
      accessibilityLabel,
      startAdornment,
      endAdornment,
      inputProps,
    ]).toHaveLength(9);
  });

  it('filled 값 상태 개념을 거부한다', () => {
    const onFilled: InputFieldSemanticProps = {
      // @ts-expect-error FormControl label float 신호다 — RN 소비자가 없다
      onFilled: () => undefined,
    };
    const onEmpty: InputFieldSemanticProps = {
      // @ts-expect-error FormControl label float 신호다 — RN 소비자가 없다
      onEmpty: () => undefined,
    };
    const filled: FieldSemanticProps = {
      // @ts-expect-error 신호만이 아니라 상태 자체도 아니다 — web FormControl 안에서만 산다
      filled: true,
    };
    const adornedStart: FieldSemanticProps = {
      // @ts-expect-error 장식 유무는 web FormControl이 자식을 훑어 만드는 파생 상태다
      adornedStart: true,
    };

    expect([onFilled, onEmpty, filled, adornedStart]).toHaveLength(4);
  });

  it('포커스 상태와 포커스 알림을 거부한다', () => {
    const focused: FieldSemanticProps = {
      // @ts-expect-error FormControl 컨테이너의 상태다 — 입력 시맨틱이 아니다
      focused: true,
    };
    const onFocus: InputFieldSemanticProps = {
      // @ts-expect-error 포커스 수집 수단이 렌더러마다 다르다 (DOM 버블링 vs 입력 콜백)
      onFocus: () => undefined,
    };
    const onBlur: InputFieldSemanticProps = {
      // @ts-expect-error 위와 같다
      onBlur: () => undefined,
    };

    expect([focused, onFocus, onBlur]).toHaveLength(3);
  });
});
