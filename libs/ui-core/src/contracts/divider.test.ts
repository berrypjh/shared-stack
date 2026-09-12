/**
 * Divider 계약의 **타입 수준** 검증.
 *
 * 런타임 동작이 아니라 "무엇을 받고 무엇을 거부하는가"가 계약이므로 검사도 타입 수준이다.
 * `@ts-expect-error` 는 `tsc -p tsconfig.spec.json` 이 확인한다 — 에러가 사라지면
 * "unused directive" 로 실패하므로 계약이 느슨해지면 빌드가 깨진다.
 *
 * Divider 는 **분리 축 하나**만 공유한다. 선의 두께·색은 토큰이 정하고(`semanticBorder.divider`,
 * `stroke.light`), 시맨틱 여부(`decorative`)는 web 만 표현할 수 있어 승격하지 않는다.
 */
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

  /**
   * 미지정은 `horizontal` 이다. 두 렌더러가 같은 기본값을 쓴다 — Stack 의 `direction` 과 달리
   * 플랫폼 기본값이 갈리지 않지만(어느 쪽도 기본 구분선을 그리지 않는다), 기본값을 계약이
   * 정해 두어야 두 렌더러가 같은 모양으로 시작한다.
   */
  it('축은 두 가지다', () => {
    const orientations: DividerOrientation[] = ['horizontal', 'vertical'];

    expect(orientations).toHaveLength(2);
    expect(orientation).toBe('horizontal');
    expect(horizontal.orientation).toBe('horizontal');
    expect(vertical.orientation).toBe('vertical');
  });
});

/**
 * 초과 프로퍼티 에러는 객체 리터럴당 **첫 번째 것만** 보고된다.
 * 그래서 금지 prop 은 리터럴 하나에 하나씩 둔다 — 묶으면 뒤쪽 directive 가 침묵한다.
 */
describe('Divider 계약이 거부하는 것', () => {
  /**
   * Stack 의 `direction` 어휘(`column`·`row`)와 **일부러 다르다.**
   *
   * Stack 은 자식이 흐르는 축을, Divider 는 선이 **가르는** 축을 말한다. 같은 단어를 쓰면
   * 가로 구분선이 세로 목록을 가른다는 사실이 이름에서 뒤집혀 읽힌다. `horizontal`·`vertical`
   * 은 ARIA `aria-orientation` 어휘와도 같아서 web 렌더러가 그대로 옮긴다.
   */
  it('Stack 의 축 어휘를 거부한다', () => {
    const column: DividerSemanticProps = {
      // @ts-expect-error Divider 는 흐름 축이 아니라 가르는 축을 말한다
      orientation: 'column',
    };
    const row: DividerSemanticProps = {
      // @ts-expect-error 같은 이유로 'row' 도 아니다
      orientation: 'row',
    };

    expect([column, row]).toHaveLength(2);
  });

  /**
   * `decorative` 는 **web 전용이다 — 실격이 아니라 표현 불가다.**
   *
   * web 은 `<hr>` 의 native separator 시맨틱을 `role="presentation"` 으로 끌 수 있다. RN 은
   * 그 반대편(시맨틱 separator)을 만들 수단이 없다 — `accessibilityRole` 유니온에 `separator`
   * 가 없고, 이 저장소는 bare `role` prop 을 쓰지 않는다. 한쪽만 표현 가능한 키는 승격하지
   * 않는다 (`IconButtonSemanticProps` 의 `edge`·`loading` 과 같은 규칙).
   */
  it('한쪽 렌더러만 표현할 수 있는 시맨틱 키를 거부한다', () => {
    const decorative: DividerSemanticProps = {
      // @ts-expect-error web 전용. react-ui 의 DividerProps 가 가진다
      decorative: true,
    };

    expect(decorative).toBeDefined();
  });

  /**
   * 두께·색은 토큰이 정한다.
   *
   * `semanticBorder.divider`(1)와 `stroke.light` 는 현재 7개 테마 전부에 있다. prop 으로
   * 열면 소비자가 토큰 밖으로 나갈 길이 생기고, 실제로 굵기나 색을 바꾸는 사용처는 저장소에
   * 하나도 없다.
   */
  it('토큰이 정하는 시각 값을 prop 으로 받지 않는다', () => {
    const thickness: DividerSemanticProps = {
      // @ts-expect-error 두께는 semanticBorder.divider 가 정한다
      thickness: 2,
    };
    const color: DividerSemanticProps = {
      // @ts-expect-error 색은 stroke.light 가 정한다
      color: 'stroke.default',
    };
    const inset: DividerSemanticProps = {
      // @ts-expect-error 들여쓰기 사용처가 없다. 필요하면 Box 로 감싼다
      inset: 'md',
    };
    const spacing: DividerSemanticProps = {
      // @ts-expect-error 주변 여백은 Stack 의 gap 이 가진다
      spacing: 'lg',
    };

    expect([thickness, color, inset, spacing]).toHaveLength(4);
  });
});
