/**
 * Fab 시맨틱 계약의 타입 수준 검증.
 *
 * `shape` 는 web(`Fab.utils.tsx` 의 circular/extended 클래스)과 RN(`Fab.styles.ts` 의
 * footprint 분기)이 같은 두 값을 같은 뜻으로 구현한다. 아이콘·라벨 슬롯은 렌더러 소유다.
 */
import type { FabSemanticProps, FabShape } from './fab';

const full: FabSemanticProps = {
  shape: 'extended',
  size: 'md',
  color: 'secondary',
  disabled: true,
};

const shapes: FabShape[] = ['circular', 'extended'];

describe('Fab 계약이 받는 것', () => {
  it('두 shape 와 Button 어휘를 공유한다', () => {
    expect(shapes).toHaveLength(2);
    expect(full.shape).toBe('extended');
  });
});

describe('Fab 계약이 거부하는 것', () => {
  it('어휘 밖의 shape 를 거부한다', () => {
    const bad: FabSemanticProps = {
      // @ts-expect-error circular/extended 뿐이다
      shape: 'square',
    };

    expect(bad).toBeDefined();
  });

  it('슬롯과 렌더러 prop 을 거부한다', () => {
    const icon: FabSemanticProps = {
      // @ts-expect-error 아이콘은 ReactNode 슬롯이라 렌더러 소유다
      icon: 'plus',
    };
    const children: FabSemanticProps = {
      // @ts-expect-error 라벨 슬롯은 렌더러 소유다
      children: '만들기',
    };
    const href: FabSemanticProps = {
      // @ts-expect-error 링크는 web 렌더러 관심사다
      href: '/new',
    };
    const label: FabSemanticProps = {
      // @ts-expect-error 접근성 이름은 렌더러 소유다 — RN circular Fab 이 필수로 요구한다
      accessibilityLabel: '추가',
    };

    expect([icon, children, href, label]).toHaveLength(4);
  });
});
