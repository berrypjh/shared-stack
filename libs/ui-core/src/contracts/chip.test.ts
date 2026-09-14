import type { ChipSemanticProps } from './chip';

const full: ChipSemanticProps = {
  size: 'sm',
  variant: 'outlined',
  selected: true,
  disabled: false,
};

describe('Chip 계약이 받는 것', () => {
  it('어휘와 상태 넷만 공유한다', () => {
    expect(Object.keys(full).sort()).toEqual(['disabled', 'selected', 'size', 'variant']);
  });

  it('size 는 두 단계다 — Badge 와 같고 Avatar 의 세 단계와 다르다', () => {
    const sizes: ChipSemanticProps['size'][] = ['sm', 'md'];

    expect(sizes).toHaveLength(2);
  });

  it('variant 는 outlined·filled 두 가지다', () => {
    const variants: ChipSemanticProps['variant'][] = ['outlined', 'filled'];

    expect(variants).toHaveLength(2);
  });
});

describe('Chip 계약이 거부하는 것', () => {
  it('V1 에 없는 intent 를 거부한다', () => {
    const intent: ChipSemanticProps = {
      // @ts-expect-error selected 강조(base selectionControl.checked = primary.pr700)와 겹친다
      intent: 'primary',
    };

    expect(intent).toBeDefined();
  });

  it('라벨·leading 슬롯을 거부한다', () => {
    const children: ChipSemanticProps = {
      // @ts-expect-error 라벨은 ReactNode라 렌더러 소유다
      children: '필터',
    };
    const leading: ChipSemanticProps = {
      // @ts-expect-error leading 슬롯도 ReactNode다
      leading: 'icon',
    };

    expect([children, leading]).toHaveLength(2);
  });

  it('플랫폼 이벤트를 거부한다', () => {
    const onClick: ChipSemanticProps = {
      // @ts-expect-error web MouseEvent 핸들러다
      onClick: () => undefined,
    };
    const onPress: ChipSemanticProps = {
      // @ts-expect-error RN GestureResponderEvent 핸들러다
      onPress: () => undefined,
    };

    expect([onClick, onPress]).toHaveLength(2);
  });

  it('렌더러가 소유한 접근성 prop 을 거부한다', () => {
    const pressed: ChipSemanticProps = {
      // @ts-expect-error aria-pressed는 web 통로다. RN에는 대응이 없다
      'aria-pressed': true,
    };
    const label: ChipSemanticProps = {
      // @ts-expect-error RN 접근성 이름이다
      accessibilityLabel: '필터',
    };
    const hint: ChipSemanticProps = {
      // @ts-expect-error RN 전용 힌트다
      accessibilityHint: '두 번 눌러 선택',
    };

    expect([pressed, label, hint]).toHaveLength(3);
  });

  it('스타일 수단을 거부한다', () => {
    const className: ChipSemanticProps = {
      // @ts-expect-error className은 web 렌더링 개념이다
      className: 'x',
    };
    const style: ChipSemanticProps = {
      // @ts-expect-error style 객체는 렌더러마다 다르다
      style: {},
    };

    expect([className, style]).toHaveLength(2);
  });

  /** remove/delete는 DEFER다. 계약에 자리를 미리 만들어 두지 않는다. */
  it('DEFER 한 remove 액션을 거부한다', () => {
    const onDelete: ChipSemanticProps = {
      // @ts-expect-error dual-action은 별도 접근성 구조가 필요해 DEFER했다
      onDelete: () => undefined,
    };
    const deletable: ChipSemanticProps = {
      // @ts-expect-error 같은 이유로 플래그도 두지 않는다
      deletable: true,
    };

    expect([onDelete, deletable]).toHaveLength(2);
  });

  it('V1 범위 밖 상태를 거부한다', () => {
    const loading: ChipSemanticProps = {
      // @ts-expect-error V1에 필요성이 없다
      loading: true,
    };
    const error: ChipSemanticProps = {
      // @ts-expect-error V1에 필요성이 없다
      error: true,
    };

    expect([loading, error]).toHaveLength(2);
  });
});
