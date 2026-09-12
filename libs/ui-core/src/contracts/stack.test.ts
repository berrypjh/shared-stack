/**
 * Stack 계약의 **타입 수준** 검증.
 *
 * 런타임 동작이 아니라 "무엇을 받고 무엇을 거부하는가"가 계약이므로 검사도 타입 수준이다.
 * `@ts-expect-error` 는 `tsc -p tsconfig.spec.json` 이 확인한다 — 에러가 사라지면
 * "unused directive" 로 실패하므로 계약이 느슨해지면 빌드가 깨진다.
 *
 * Stack 은 **1차원 배치 축**만 가진다. 면·여백·모서리는 Box 가 이미 가지므로 상속하지 않는다
 * (`p`·`m`·`bg`·`radius`). 두 primitive 는 합성해서 쓰는 관계지 계승 관계가 아니다.
 */
import type { StackAlign, StackDirection, StackJustify, StackSemanticProps } from './stack';

/** 전부 선택이다. 빈 객체는 "세로로 쌓고 간격 없음"을 뜻한다. */
const vertical: StackSemanticProps = {};
const horizontal: StackSemanticProps = { direction: 'row' };

/** `gap` 은 Box 와 같은 값 도메인이다 — 토큰 이름 또는 원시 길이. */
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

  /** Box 와 같은 `BoxSpacingValue` 다. 별도 gap 토큰 어휘를 만들지 않는다. */
  it('gap 은 토큰 이름과 원시 숫자를 함께 받는다', () => {
    expect(tokenGap.gap).toBe('md');
    expect(numericGap.gap).toBe(12);
  });

  /** `0` 은 "미지정"이 아니라 "간격 없음"이다. 두 렌더러가 같게 읽는다. */
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

  /** 어휘는 정규화된 이름이다 — `space-between` 이 아니라 `between`. 매핑은 렌더러가 한다. */
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

/**
 * 초과 프로퍼티 에러는 객체 리터럴당 **첫 번째 것만** 보고된다.
 * 그래서 금지 prop 은 리터럴 하나에 하나씩 둔다 — 묶으면 뒤쪽 directive 가 침묵한다.
 */
describe('Stack 계약이 거부하는 것', () => {
  it('플랫폼마다 뜻이 갈리는 direction 어휘를 거부한다', () => {
    const horizontalWord: StackSemanticProps = {
      // @ts-expect-error CSS 도 RN 도 'horizontal' 을 쓰지 않는다
      direction: 'horizontal',
    };
    const verticalWord: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 'vertical' 도 아니다
      direction: 'vertical',
    };
    const reverse: StackSemanticProps = {
      // @ts-expect-error 역방향은 V1 에 없다 — RTL 과 겹쳐 의미가 흐려진다
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

  /**
   * `baseline` 은 **DEFER 다 — 실격이 아니다.**
   *
   * 양 플랫폼이 지원하고 의미도 같다 (web `items-baseline` 4곳, RN `alignItems: 'baseline'`
   * 1곳에서 실제로 쓰인다). V1 에 넣지 않는 이유는 union 멤버 **추가는 non-breaking 이고
   * 제거는 breaking** 이라서다. 필요해지면 이 케이스를 지우고 어휘에 더하면 된다.
   */
  it('V1 어휘 밖의 align 값을 거부한다', () => {
    const baseline: StackSemanticProps = {
      // @ts-expect-error DEFER. 실격이 아니라 아직 넣지 않았을 뿐이다
      align: 'baseline',
    };
    const cssKeyword: StackSemanticProps = {
      // @ts-expect-error 계약 어휘는 정규화된 이름이다 — 'flex-start' 는 렌더러 표현이다
      align: 'flex-start',
    };

    expect([baseline, cssKeyword]).toHaveLength(2);
  });

  it('렌더러 표현 그대로의 justify 값을 거부한다', () => {
    const cssKeyword: StackSemanticProps = {
      // @ts-expect-error 'between' 으로 정규화한다. 매핑은 각 렌더러가 한다
      justify: 'space-between',
    };
    const around: StackSemanticProps = {
      // @ts-expect-error V1 에 소비자 근거가 없다
      justify: 'space-around',
    };
    const evenly: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 없다
      justify: 'space-evenly',
    };

    expect([cssKeyword, around, evenly]).toHaveLength(3);
  });

  /** wrap 은 boolean 이다. 문자열 어휘를 받으면 `'nowrap'` 과 `false` 가 둘 다 존재하게 된다. */
  it('wrap 을 문자열로 받지 않는다', () => {
    const wrapWord: StackSemanticProps = {
      // @ts-expect-error boolean 이다
      wrap: 'wrap',
    };
    const reverse: StackSemanticProps = {
      // @ts-expect-error 역방향 줄바꿈은 V1 에 없다
      wrap: 'wrap-reverse',
    };

    expect([wrapWord, reverse]).toHaveLength(2);
  });

  /** Stack 은 컨테이너의 축만 정한다. 자식이 자기 자리를 정하는 prop 은 자식 몫이다. */
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

  /** 2차원 배치는 Stack 의 역할이 아니다. Grid 계약도 두지 않는다. */
  it('2차원 배치 prop 을 거부한다', () => {
    const columns: StackSemanticProps = {
      // @ts-expect-error 2차원은 Stack 의 역할이 아니다
      columns: 3,
    };
    const rows: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 없다
      rows: 2,
    };

    expect([columns, rows]).toHaveLength(2);
  });

  /** 면·여백·모서리는 Box 가 가진다. Stack 은 Box 를 상속하지 않는다. */
  it('Box 의 visual prop 을 거부한다', () => {
    const padding: StackSemanticProps = {
      // @ts-expect-error 여백은 Box 가 가진다
      p: 'md',
    };
    const margin: StackSemanticProps = {
      // @ts-expect-error 같은 이유로 Box 가 가진다
      m: 'md',
    };
    const bg: StackSemanticProps = {
      // @ts-expect-error 면 색은 Box 가 가진다
      bg: 'background.surface',
    };
    const radius: StackSemanticProps = {
      // @ts-expect-error 모서리는 Box 가 가진다
      radius: 'md',
    };

    expect([padding, margin, bg, radius]).toHaveLength(4);
  });

  /** 반응형은 브레이크포인트 어휘를 요구하고, 그 어휘가 두 플랫폼에 공통으로 없다. */
  it('반응형 객체를 거부한다', () => {
    const responsive: StackSemanticProps = {
      // @ts-expect-error 브레이크포인트는 공유 어휘가 아니다 — web 전용이면 react-ui 가 가진다
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
    // @ts-expect-error className 은 react-ui 가 덧붙인다
    const className: StackSemanticProps = { className: 'root' };
    // @ts-expect-error style 은 react-ui 가 덧붙인다
    const style: StackSemanticProps = { style: {} };
    // @ts-expect-error 슬롯은 렌더러 타입이다
    const children: StackSemanticProps = { children: 'x' };

    expect([className, style, children]).toHaveLength(3);
  });

  it('RN 전용 prop 을 받지 않는다', () => {
    // @ts-expect-error testID 는 react-native-ui 가 덧붙인다
    const testID: StackSemanticProps = { testID: 'stack' };
    // @ts-expect-error onLayout 은 react-native-ui 가 덧붙인다
    const onLayout: StackSemanticProps = { onLayout: () => undefined };
    // @ts-expect-error 접근성 역할은 소비자가 준다. 레이아웃이 지어내지 않는다
    const accessibilityRole: StackSemanticProps = { accessibilityRole: 'none' };

    expect([testID, onLayout, accessibilityRole]).toHaveLength(3);
  });
});
