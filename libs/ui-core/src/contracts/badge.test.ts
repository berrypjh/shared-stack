import type { BadgeSemanticProps } from './badge';

const full: BadgeSemanticProps = {
  variant: 'dot',
  size: 'sm',
  intent: 'error',
  placement: 'top-end',
  count: 3,
  max: 99,
  invisible: false,
};

describe('Badge 계약이 받는 것', () => {
  it('어휘와 숫자만 공유한다', () => {
    expect(Object.keys(full).sort()).toEqual([
      'count',
      'intent',
      'invisible',
      'max',
      'placement',
      'size',
      'variant',
    ]);
  });

  it('variant 는 count·dot 두 가지다', () => {
    const variants: BadgeSemanticProps['variant'][] = ['count', 'dot'];

    expect(variants).toHaveLength(2);
  });

  it('size 는 두 단계다 — Avatar 의 세 단계와 다르다', () => {
    const sizes: BadgeSemanticProps['size'][] = ['sm', 'md'];

    expect(sizes).toHaveLength(2);
  });

  /**
   * `warning`·`success`가 없는 것은 의도다.
   * 7개 테마에서 실측한 결과 두 면 위의 `text.contrastText`가 ember에서 4.35·4.34로 WCAG AA(4.5)에 미달한다.
   * 값을 넣고 기준을 낮추는 대신 어휘에서 뺐다 — 필요해지면 그 테마의 시맨틱을 다시 잡아야 한다.
   */
  it('intent 는 대비가 검증된 네 가지다', () => {
    const intents: BadgeSemanticProps['intent'][] = ['primary', 'secondary', 'error', 'neutral'];

    expect(intents).toHaveLength(4);
  });

  it('placement 는 논리 방향 네 가지다 — left/right 가 아니다', () => {
    const placements: BadgeSemanticProps['placement'][] = [
      'top-end',
      'top-start',
      'bottom-end',
      'bottom-start',
    ];

    expect(placements).toHaveLength(4);
  });
});

describe('Badge 계약이 거부하는 것', () => {
  it('앵커와 content 슬롯을 거부한다', () => {
    const children: BadgeSemanticProps = {
      // @ts-expect-error 앵커는 ReactNode라 렌더러 소유다
      children: 'icon',
    };
    const content: BadgeSemanticProps = {
      // @ts-expect-error 임의 content도 ReactNode다
      content: 'NEW',
    };

    expect([children, content]).toHaveLength(2);
  });

  it('렌더러가 소유한 접근성 이름·숨김을 거부한다', () => {
    const label: BadgeSemanticProps = {
      // @ts-expect-error web은 aria-label, RN은 accessibilityLabel이다
      label: '읽지 않은 알림 3개',
    };
    const hidden: BadgeSemanticProps = {
      // @ts-expect-error aria-hidden은 DOM 통로다
      'aria-hidden': true,
    };
    const role: BadgeSemanticProps = {
      // @ts-expect-error ARIA role은 web 전용이다
      role: 'status',
    };

    expect([label, hidden, role]).toHaveLength(3);
  });

  it('위치 좌표와 스타일을 거부한다 — placement 어휘만 공유한다', () => {
    const offset: BadgeSemanticProps = {
      // @ts-expect-error 좌표는 렌더러의 스타일 시스템이 만든다
      offset: 4,
    };
    const zIndex: BadgeSemanticProps = {
      // @ts-expect-error 쌓임 순서는 공유 토큰이 아니다
      zIndex: 1,
    };
    const className: BadgeSemanticProps = {
      // @ts-expect-error className은 web 렌더링 개념이다
      className: 'x',
    };

    expect([offset, zIndex, className]).toHaveLength(3);
  });

  it('상호작용 상태와 이벤트를 거부한다 — Badge 는 누를 수 없다', () => {
    const onPress: BadgeSemanticProps = {
      // @ts-expect-error overlay는 자체 이벤트를 제공하지 않는다
      onPress: () => undefined,
    };
    const onClick: BadgeSemanticProps = {
      // @ts-expect-error overlay는 자체 이벤트를 제공하지 않는다
      onClick: () => undefined,
    };
    const selected: BadgeSemanticProps = {
      // @ts-expect-error 선택 상태가 없다
      selected: true,
    };
    const disabled: BadgeSemanticProps = {
      // @ts-expect-error 비활성 상태가 없다 — 앵커가 가진다
      disabled: true,
    };

    expect([onPress, onClick, selected, disabled]).toHaveLength(4);
  });
});
