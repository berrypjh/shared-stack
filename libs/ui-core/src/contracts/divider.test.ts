import type { DividerOrientation, DividerSemanticProps } from './divider';

/** 전부 선택이다. 빈 객체는 "가로 구분선"을 뜻한다. */
const implicitHorizontal: DividerSemanticProps = {};
const horizontal: DividerSemanticProps = { orientation: 'horizontal' };
const vertical: DividerSemanticProps = { orientation: 'vertical' };

const orientation: DividerOrientation = 'horizontal';

describe('Divider 계약이 받는 것', () => {
  it('한 키만 공유한다', () => {
    expect(Object.keys(vertical)).toEqual(['orientation']);
  });

  it('전부 선택이다 — 빈 객체가 유효하다', () => {
    expect(Object.keys(implicitHorizontal)).toHaveLength(0);
  });

  it('축은 두 가지다', () => {
    const orientations: DividerOrientation[] = ['horizontal', 'vertical'];

    expect(orientations).toHaveLength(2);
    expect(orientation).toBe('horizontal');
    expect(horizontal.orientation).toBe('horizontal');
    expect(vertical.orientation).toBe('vertical');
  });
});

describe('Divider 계약이 거부하는 것', () => {
  it('Stack 의 축 어휘를 거부한다', () => {
    const column: DividerSemanticProps = {
      // @ts-expect-error Divider는 흐름 축이 아니라 가르는 축을 말한다
      orientation: 'column',
    };
    const row: DividerSemanticProps = {
      // @ts-expect-error 같은 이유로 'row'도 아니다
      orientation: 'row',
    };

    expect([column, row]).toHaveLength(2);
  });

  it('한쪽 렌더러만 표현할 수 있는 시맨틱 키를 거부한다', () => {
    const decorative: DividerSemanticProps = {
      // @ts-expect-error web 전용. react-ui의 DividerProps가 가진다
      decorative: true,
    };

    expect(decorative).toBeDefined();
  });

  it('토큰이 정하는 시각 값을 prop 으로 받지 않는다', () => {
    const thickness: DividerSemanticProps = {
      // @ts-expect-error 두께는 semanticBorder.divider가 정한다
      thickness: 2,
    };
    const color: DividerSemanticProps = {
      // @ts-expect-error 색은 stroke.light가 정한다
      color: 'stroke.default',
    };
    const inset: DividerSemanticProps = {
      // @ts-expect-error 들여쓰기 사용처가 없다. 필요하면 Box로 감싼다
      inset: 'md',
    };
    const spacing: DividerSemanticProps = {
      // @ts-expect-error 주변 여백은 Stack의 gap이 가진다
      spacing: 'lg',
    };

    expect([thickness, color, inset, spacing]).toHaveLength(4);
  });
});
