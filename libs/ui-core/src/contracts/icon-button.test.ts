/**
 * IconButton 시맨틱 계약의 타입 수준 검증.
 *
 * 공유되는 것은 `size`·`color`·`disabled` 뿐이다.
 *
 * - `edge` 는 web 전용이다. 컨테이너 가장자리에 아이콘을 광학 정렬하려고 자체 padding 을
 *   음수 margin 으로 상쇄하는 레이아웃 관용구이고 RN 에 대응 개념이 없다.
 * - `loading` 은 **의미가 다르다.** web 은 `boolean | null` 3-상태다
 *   (`IconButton.utils.tsx` 가 `typeof loading !== 'boolean'` 이면 래퍼를 아예 렌더하지 않아
 *   `null`=기능 꺼짐 / `false`=자리만 확보 / `true`=진행 중). RN 은 2-상태 boolean 이다.
 *   이름이 같다고 같은 불변식이 아니므로 승격하지 않는다.
 */
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
      // @ts-expect-error edge 는 RN 에 대응 개념이 없는 web 레이아웃 관용구다
      edge: 'start',
    };

    expect(edge).toBeDefined();
  });

  it('의미가 갈라진 loading 을 거부한다', () => {
    const loading: IconButtonSemanticProps = {
      // @ts-expect-error web 은 boolean|null 3-상태, RN 은 boolean 2-상태다
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
      // @ts-expect-error 접근성 이름은 렌더러 소유다 — RN 이 타입에서 필수로 요구한다
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
