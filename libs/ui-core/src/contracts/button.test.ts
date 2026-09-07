/**
 * Button 시맨틱 계약의 **타입 수준** 검증.
 *
 * 이 계약이 ui-core 에 있는 근거는 "이름이 같다" 가 아니라 **두 렌더러가 같은 불변식을 실제로
 * 구현한다** 는 것이다 — variant/size/color 는 web SCSS(`$sizes`·`$colors`)와 RN
 * `Button.styles.ts` 가 같은 세 값을 각각 토큰으로 풀고, `disabled`·`loading` 은 양쪽 모두
 * "활성화 불가 + 상태 고지" 로 구현한다.
 *
 * 렌더러 개념(DOM·RN prop·슬롯)은 여기 들어오면 안 된다. `@ts-expect-error` 가 사라지면
 * "unused directive" 로 실패하므로, 계약이 느슨해지는 순간 빌드가 깨진다.
 */
import type {
  ButtonColor,
  ButtonLoadingPosition,
  ButtonSemanticProps,
  ButtonSize,
  ButtonVariant,
} from './button';

const full: ButtonSemanticProps = {
  variant: 'outlined',
  size: 'lg',
  color: 'secondary',
  disabled: true,
  fullWidth: true,
  loading: true,
  loadingPosition: 'end',
};

const variants: ButtonVariant[] = ['contained', 'outlined', 'text'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
const colors: ButtonColor[] = ['primary', 'secondary'];
const positions: ButtonLoadingPosition[] = ['start', 'center', 'end'];

describe('Button 계약이 받는 것', () => {
  it('문서화된 어휘를 전부 받는다', () => {
    expect(variants).toHaveLength(3);
    expect(sizes).toHaveLength(3);
    expect(colors).toHaveLength(2);
    expect(positions).toHaveLength(3);
    expect(full.loadingPosition).toBe('end');
  });

  it('모든 prop 이 선택이다 — 기본값은 렌더러가 정한다', () => {
    const empty: ButtonSemanticProps = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });
});

describe('Button 계약이 거부하는 것', () => {
  it('어휘 밖의 값을 거부한다', () => {
    // 초과 프로퍼티 에러는 리터럴당 첫 번째만 보고되므로 하나씩 나눈다.
    const badVariant: ButtonSemanticProps = {
      // @ts-expect-error 세 가지 variant 뿐이다
      variant: 'ghost',
    };
    const badSize: ButtonSemanticProps = {
      // @ts-expect-error 세 가지 size 뿐이다
      size: 'xl',
    };
    const badColor: ButtonSemanticProps = {
      // @ts-expect-error web SCSS 에는 error 팔레트가 있지만 계약에는 없다
      color: 'error',
    };
    const badPosition: ButtonSemanticProps = {
      // @ts-expect-error start/center/end 뿐이다
      loadingPosition: 'middle',
    };

    expect([badVariant, badSize, badColor, badPosition]).toHaveLength(4);
  });

  it('DOM 개념을 거부한다', () => {
    const href: ButtonSemanticProps = {
      // @ts-expect-error 링크는 web 렌더러 관심사다
      href: '/docs',
    };
    const component: ButtonSemanticProps = {
      // @ts-expect-error 다형성은 web 렌더러 관심사다
      component: 'a',
    };
    const className: ButtonSemanticProps = {
      // @ts-expect-error className 은 DOM 이다
      className: 'x',
    };
    const onClick: ButtonSemanticProps = {
      // @ts-expect-error DOM 이벤트다
      onClick: () => undefined,
    };

    expect([href, component, className, onClick]).toHaveLength(4);
  });

  it('RN 개념을 거부한다', () => {
    const onPress: ButtonSemanticProps = {
      // @ts-expect-error RN 이벤트다
      onPress: () => undefined,
    };
    const role: ButtonSemanticProps = {
      // @ts-expect-error 접근성 prop 은 렌더러 소유다
      accessibilityRole: 'button',
    };
    const label: ButtonSemanticProps = {
      // @ts-expect-error 접근성 이름은 렌더러 소유다
      accessibilityLabel: '저장',
    };
    const hitSlop: ButtonSemanticProps = {
      // @ts-expect-error RN 전용 터치 확장이다
      hitSlop: 8,
    };
    const style: ButtonSemanticProps = {
      // @ts-expect-error style 표현은 렌더러 소유다
      style: {},
    };

    expect([onPress, role, label, hitSlop, style]).toHaveLength(5);
  });

  it('ReactNode 슬롯을 거부한다', () => {
    const children: ButtonSemanticProps = {
      // @ts-expect-error 슬롯은 렌더러 타입(ReactNode)이라 ui-core 에 들어올 수 없다
      children: 'Save',
    };
    const startIcon: ButtonSemanticProps = {
      // @ts-expect-error 슬롯은 렌더러 소유다
      startIcon: 'icon',
    };
    const loadingIndicator: ButtonSemanticProps = {
      // @ts-expect-error 슬롯은 렌더러 소유다
      loadingIndicator: 'spinner',
    };

    expect([children, startIcon, loadingIndicator]).toHaveLength(3);
  });
});
