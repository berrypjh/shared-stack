/**
 * RN 렌더러 테스트 하네스의 스모크 테스트.
 *
 * 컴포넌트 동작이 아니라 하네스 자체를 검증합니다 — RN 호스트 트리가 렌더되는지, Pressable이
 * 접근성 트리에서 button으로 잡히는지, ThemeProvider로 RN 토큰이 보이는지.
 *
 * RNTL 14의 `render`/`fireEvent`는 비동기입니다. `await`를 빼면 screen이 비어 있어
 * "`render` function has not been called"로 실패합니다.
 */
import { Pressable, Text, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../theme';
import { useTheme } from '../theme/useTheme';

/**
 * `accessibilityRole="button"`은 생략할 수 없습니다. web `<button>`과 달리 RN `Pressable`은
 * 암묵적 button 시맨틱이 없어 빼면 접근성 트리에 `View`로 남습니다.
 */
const Probe = ({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) => (
  <View>
    <Text>probe-label</Text>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="probe-button"
      disabled={disabled}
      onPress={onPress}
    >
      <Text>press me</Text>
    </Pressable>
  </View>
);

/** 테마에서 읽은 토큰 값을 화면으로 흘려보내 assert 가능하게 만듭니다. */
const TokenProbe = () => {
  const theme = useTheme();

  return <Text testID="token">{`${theme.mode}:${theme.tokens.spacing.md}`}</Text>;
};

describe('RN 테스트 환경', () => {
  it('jsdom 이 아니라 node 기반 RN 환경에서 돈다', () => {
    // RN preset의 testEnvironment는 node 파생입니다. document가 생기면 jsdom이 새어 들어간
    // 것입니다. (`window`는 RN이 global 별칭으로 정의하므로 판별 기준이 못 됩니다.)
    // `dom` lib을 켜서 확인하지는 않습니다 — RN 패키지에 DOM 타입이 들어옵니다.
    expect('document' in globalThis).toBe(false);
    expect((globalThis as { window?: unknown }).window).toBe(globalThis);
  });
});

describe('RN 렌더러', () => {
  it('View/Text 가 렌더된다', async () => {
    await render(<Probe onPress={() => undefined} />);

    expect(screen.getByText('probe-label')).toBeOnTheScreen();
  });

  it('Pressable 이 button role 로 조회된다', async () => {
    await render(<Probe onPress={() => undefined} />);

    expect(screen.getByRole('button', { name: 'probe-button' })).toBeOnTheScreen();
  });

  it('press 가 콜백을 호출한다', async () => {
    const onPress = jest.fn();
    await render(<Probe onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'probe-button' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled Pressable 은 콜백을 호출하지 않는다', async () => {
    const onPress = jest.fn();
    await render(<Probe onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'probe-button' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('accessibilityLabel 과 disabled state 를 읽을 수 있다', async () => {
    await render(<Probe onPress={() => undefined} disabled />);

    const button = screen.getByLabelText('probe-button');

    expect(button).toHaveAccessibleName('probe-button');
    expect(button).toBeDisabled();
    // 원본 accessibilityState까지 읽을 수 있어야 loading(busy) 같은 상태도 검증할 수 있습니다.
    expect(button).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
  });
});

describe('ThemeProvider 하네스', () => {
  it('ThemeProvider 안에서 canonical RN 토큰이 보인다', async () => {
    await render(
      <ThemeProvider mode="dark">
        <TokenProbe />
      </ThemeProvider>,
    );

    // RN 산출물은 숫자(12), web은 "0.75rem"입니다. 숫자가 아니면 web 트리가 들어온 것입니다.
    expect(screen.getByTestId('token')).toHaveTextContent('dark:12');
  });

  it('ThemeProvider 없이 useTheme 을 쓰면 실패한다', async () => {
    await expect(render(<TokenProbe />)).rejects.toThrow(/ThemeProvider/);
  });
});
