import type { IconButtonSemanticProps } from './icon-button';

const full: IconButtonSemanticProps = {
  size: 'sm',
  color: 'primary',
  disabled: true,
};

describe('IconButton 계약이 받는 것', () => {
  it('size·color·disabled 만 공유한다', () => {
    expect(Object.keys(full).sort()).toEqual(['color', 'disabled', 'size']);
  });
});

describe('IconButton 계약이 거부하는 것', () => {
  it('web 전용 edge 를 거부한다', () => {
    const edge: IconButtonSemanticProps = {
      // @ts-expect-error edge는 RN에 대응 개념이 없는 web 레이아웃 관용구다
      edge: 'start',
    };

    expect(edge).toBeDefined();
  });

  it('의미가 갈라진 loading 을 거부한다', () => {
    const loading: IconButtonSemanticProps = {
      // @ts-expect-error web은 boolean|null 3-상태, RN은 boolean 2-상태다
      loading: true,
    };

    expect(loading).toBeDefined();
  });

  it('슬롯과 렌더러 prop 을 거부한다', () => {
    const icon: IconButtonSemanticProps = {
      // @ts-expect-error 아이콘 슬롯은 렌더러 소유다
      icon: 'star',
    };
    const children: IconButtonSemanticProps = {
      // @ts-expect-error 슬롯은 렌더러 소유다
      children: 'star',
    };
    const label: IconButtonSemanticProps = {
      // @ts-expect-error 접근성 이름은 렌더러 소유다 — RN이 타입에서 필수로 요구한다
      accessibilityLabel: '즐겨찾기',
    };
    const href: IconButtonSemanticProps = {
      // @ts-expect-error 링크는 web 렌더러 관심사다
      href: '/x',
    };
    const hitSlop: IconButtonSemanticProps = {
      // @ts-expect-error RN 전용 터치 확장이다
      hitSlop: 8,
    };

    expect([icon, children, label, href, hitSlop]).toHaveLength(5);
  });
});
