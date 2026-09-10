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

  it('공유되는 시맨틱 키만 가진다', () => {
    // 거부 검사(@ts-expect-error)는 키가 **들어오는** 것만 막는다. 계약이 넓어지는 방향은
    // 잡지 못하므로, 다른 계약(button·icon-button·field·box)과 같은 키셋 단언을 둔다 —
    // 승격하려면 이 목록을 손대야 하고, 그러면 승격이 리뷰에 보인다.
    expect(Object.keys(full).sort()).toEqual(['color', 'disabled', 'shape', 'size']);
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
