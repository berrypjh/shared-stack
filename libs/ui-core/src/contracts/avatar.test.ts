import type { AvatarSemanticProps } from './avatar';

const full: AvatarSemanticProps = {
  size: 'sm',
  shape: 'circle',
};

describe('Avatar 계약이 받는 것', () => {
  it('size·shape 만 공유한다', () => {
    expect(Object.keys(full).sort()).toEqual(['shape', 'size']);
  });

  it('size 는 세 단계다', () => {
    const sizes: AvatarSemanticProps['size'][] = ['sm', 'md', 'lg'];

    expect(sizes).toHaveLength(3);
  });

  it('shape 는 두 가지다', () => {
    const shapes: AvatarSemanticProps['shape'][] = ['circle', 'rounded'];

    expect(shapes).toHaveLength(2);
  });
});

describe('Avatar 계약이 거부하는 것', () => {
  it('플랫폼마다 도메인이 다른 이미지 출처를 거부한다', () => {
    const src: AvatarSemanticProps = {
      // @ts-expect-error web은 URL 문자열, RN은 ImageSourcePropType이다
      src: 'https://example.test/a.png',
    };
    const source: AvatarSemanticProps = {
      // @ts-expect-error RN 전용 이미지 출처다
      source: { uri: 'https://example.test/a.png' },
    };

    expect([src, source]).toHaveLength(2);
  });

  it('렌더러가 소유한 접근성 이름을 거부한다', () => {
    const alt: AvatarSemanticProps = {
      // @ts-expect-error DOM alt다. 빈 문자열이 "장식"을 뜻하는 3-상태는 web만의 것이다
      alt: '홍길동',
    };
    const label: AvatarSemanticProps = {
      // @ts-expect-error RN 접근성 이름이다
      accessibilityLabel: '홍길동',
    };

    expect([alt, label]).toHaveLength(2);
  });

  it('슬롯과 렌더러 prop 을 거부한다', () => {
    const children: AvatarSemanticProps = {
      // @ts-expect-error fallback 슬롯은 ReactNode라 렌더러 소유다
      children: '길동',
    };
    const onError: AvatarSemanticProps = {
      // @ts-expect-error 이미지 실패 이벤트 타입이 플랫폼마다 다르다
      onError: () => undefined,
    };
    const className: AvatarSemanticProps = {
      // @ts-expect-error className은 web 렌더링 개념이다
      className: 'x',
    };

    expect([children, onError, className]).toHaveLength(3);
  });

  it('상호작용 상태를 거부한다 — Avatar 는 정적 identity visual 이다', () => {
    const disabled: AvatarSemanticProps = {
      // @ts-expect-error 비상호작용 컴포넌트에 비활성 상태가 없다
      disabled: true,
    };
    const selected: AvatarSemanticProps = {
      // @ts-expect-error 선택 상태가 없다
      selected: true,
    };

    expect([disabled, selected]).toHaveLength(2);
  });
});
