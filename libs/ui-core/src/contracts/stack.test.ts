import type { StackAlign, StackDirection, StackJustify, StackSemanticProps } from './stack';

const vertical: StackSemanticProps = {};
const horizontal: StackSemanticProps = { direction: 'row' };

const tokenGap: StackSemanticProps = { gap: 'md' };
const numericGap: StackSemanticProps = { gap: 12 };
const zeroGap: StackSemanticProps = { gap: 0 };

const alignment: StackSemanticProps = {
  align: 'center',
  justify: 'between',
  wrap: true,
};

const full: StackSemanticProps = {
  direction: 'row',
  gap: 'lg',
  align: 'stretch',
  justify: 'end',
  wrap: false,
};

const direction: StackDirection = 'column';
const align: StackAlign = 'start';
const justify: StackJustify = 'between';

describe('Stack 계약이 받는 것', () => {
  it('다섯 키만 공유한다', () => {
    expect(Object.keys(full).sort()).toEqual(['align', 'direction', 'gap', 'justify', 'wrap']);
  });

  it('전부 선택이다 — 빈 객체가 유효하다', () => {
    expect(Object.keys(vertical)).toHaveLength(0);
    expect(horizontal.direction).toBe('row');
  });

  it('direction 은 두 축뿐이다', () => {
    const directions: StackDirection[] = ['column', 'row'];

    expect(directions).toHaveLength(2);
    expect(direction).toBe('column');
  });

  it('gap 은 토큰 이름과 원시 숫자를 함께 받는다', () => {
    expect(tokenGap.gap).toBe('md');
    expect(numericGap.gap).toBe(12);
  });

  it('gap 0 은 미지정과 다르다', () => {
    expect(zeroGap.gap).toBe(0);
    expect('gap' in zeroGap).toBe(true);
    expect('gap' in vertical).toBe(false);
  });

  it('align 은 네 가지다', () => {
    const aligns: StackAlign[] = ['start', 'center', 'end', 'stretch'];

    expect(aligns).toHaveLength(4);
    expect(align).toBe('start');
  });

  it('justify 는 네 가지다', () => {
    const justifies: StackJustify[] = ['start', 'center', 'end', 'between'];

    expect(justifies).toHaveLength(4);
    expect(justify).toBe('between');
  });

  it('wrap 은 boolean 이다 — 문자열 어휘가 아니다', () => {
    expect(alignment.wrap).toBe(true);
    expect(full.wrap).toBe(false);
  });
});

describe('Stack 계약이 거부하는 것', () => {
  it('플랫폼마다 뜻이 갈리는 direction 어휘를 거부한다', () => {
    const horizontalWord: StackSemanticProps = {
      // @ts-expect-error CSS도 RN도 'horizontal'을 쓰지 않는다
      direction: 'horizontal',
    };
    const verticalWord: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 'vertical'도 아니다
      direction: 'vertical',
    };
    const reverse: StackSemanticProps = {
      // @ts-expect-error 역방향은 V1에 없다 — RTL과 겹쳐 의미가 흐려진다
      direction: 'row-reverse',
    };

    expect([horizontalWord, verticalWord, reverse]).toHaveLength(3);
  });

  it('토큰이 아닌 gap 값을 거부한다', () => {
    const bogusToken: StackSemanticProps = {
      // @ts-expect-error spacing 토큰 이름이 아니다
      gap: 'huge',
    };
    const cssLength: StackSemanticProps = {
      // @ts-expect-error 단위 문자열은 web 전용 표현이다. 숫자는 각 렌더러의 기본 길이 단위다
      gap: '12px',
    };

    expect([bogusToken, cssLength]).toHaveLength(2);
  });

  it('V1 어휘 밖의 align 값을 거부한다', () => {
    const baseline: StackSemanticProps = {
      // @ts-expect-error DEFER. 실격이 아니라 아직 넣지 않았을 뿐이다
      align: 'baseline',
    };
    const cssKeyword: StackSemanticProps = {
      // @ts-expect-error 계약 어휘는 정규화된 이름이다 — 'flex-start'는 렌더러 표현이다
      align: 'flex-start',
    };

    expect([baseline, cssKeyword]).toHaveLength(2);
  });

  it('렌더러 표현 그대로의 justify 값을 거부한다', () => {
    const cssKeyword: StackSemanticProps = {
      // @ts-expect-error 'between'으로 정규화한다. 매핑은 각 렌더러가 한다
      justify: 'space-between',
    };
    const around: StackSemanticProps = {
      // @ts-expect-error V1에 소비자 근거가 없다
      justify: 'space-around',
    };
    const evenly: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 없다
      justify: 'space-evenly',
    };

    expect([cssKeyword, around, evenly]).toHaveLength(3);
  });

  it('wrap 을 문자열로 받지 않는다', () => {
    const wrapWord: StackSemanticProps = {
      // @ts-expect-error boolean이다
      wrap: 'wrap',
    };
    const reverse: StackSemanticProps = {
      // @ts-expect-error 역방향 줄바꿈은 V1에 없다
      wrap: 'wrap-reverse',
    };

    expect([wrapWord, reverse]).toHaveLength(2);
  });

  it('item 자리의 prop 을 거부한다', () => {
    const grow: StackSemanticProps = {
      // @ts-expect-error 자식이 얼마나 자라는지는 자식이 정한다
      grow: 1,
    };
    const shrink: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 컨테이너 계약이 아니다
      shrink: 0,
    };
    const basis: StackSemanticProps = {
      // @ts-expect-error 길이 표현이 플랫폼마다 다르고, 자식 몫이다
      basis: '50%',
    };
    const order: StackSemanticProps = {
      // @ts-expect-error 순서는 자식이 정한다
      order: 1,
    };
    const alignSelf: StackSemanticProps = {
      // @ts-expect-error self 정렬은 자식이 정한다
      alignSelf: 'center',
    };

    expect([grow, shrink, basis, order, alignSelf]).toHaveLength(5);
  });

  it('2차원 배치 prop 을 거부한다', () => {
    const columns: StackSemanticProps = {
      // @ts-expect-error 2차원은 Stack의 역할이 아니다
      columns: 3,
    };
    const rows: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 없다
      rows: 2,
    };

    expect([columns, rows]).toHaveLength(2);
  });

  it('Box 의 visual prop 을 거부한다', () => {
    const padding: StackSemanticProps = {
      // @ts-expect-error 여백은 Box가 가진다
      p: 'md',
    };
    const margin: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 Box가 가진다
      m: 'md',
    };
    const bg: StackSemanticProps = {
      // @ts-expect-error 면 색은 Box가 가진다
      bg: 'background.surface',
    };
    const radius: StackSemanticProps = {
      // @ts-expect-error 모서리는 Box가 가진다
      radius: 'md',
    };

    expect([padding, margin, bg, radius]).toHaveLength(4);
  });

  it('반응형 객체를 거부한다', () => {
    const responsive: StackSemanticProps = {
      // @ts-expect-error 브레이크포인트는 공유 어휘가 아니다 — web 전용이면 react-ui가 가진다
      direction: { base: 'column', md: 'row' },
    };

    expect(responsive).toBeDefined();
  });

  it('상호작용 상태를 거부한다 — Stack 은 누를 수 없다', () => {
    const pressed: StackSemanticProps = {
      // @ts-expect-error 레이아웃 컨테이너에 눌림 상태가 없다
      pressed: true,
    };
    const hovered: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 없다
      hovered: true,
    };
    const disabled: StackSemanticProps = {
      // @ts-expect-error 비활성화할 동작이 없다
      disabled: true,
    };

    expect([pressed, hovered, disabled]).toHaveLength(3);
  });
});

describe('렌더러 prop 은 계약에 없다', () => {
  it('web 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error className은 react-ui가 덧붙인다
    const className: StackSemanticProps = { className: 'root' };
    // @ts-expect-error style은 react-ui가 덧붙인다
    const style: StackSemanticProps = { style: {} };
    // @ts-expect-error 슬롯은 렌더러 타입이다
    const children: StackSemanticProps = { children: 'x' };

    expect([className, style, children]).toHaveLength(3);
  });

  it('RN 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error testID는 react-native-ui가 덧붙인다
    const testID: StackSemanticProps = { testID: 'stack' };
    // @ts-expect-error onLayout은 react-native-ui가 덧붙인다
    const onLayout: StackSemanticProps = { onLayout: () => undefined };
    // @ts-expect-error 접근성 역할은 소비자가 준다. 레이아웃이 지어내지 않는다
    const accessibilityRole: StackSemanticProps = { accessibilityRole: 'none' };

    expect([testID, onLayout, accessibilityRole]).toHaveLength(3);
  });
});
