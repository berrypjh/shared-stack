/**
 * FormControl의 동작 계약.
 *
 * web의 DOM 포커스 아키텍처(root 버블링, `relatedTarget`)는 옮기지 않았다 — 입력이
 * `onInputFocus`/`onInputBlur`로 직접 알린다. Context에는 소비자가 있는 값만 둔다.
 */
import { Pressable, Text, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { FormControl } from './FormControl';
import * as barrel from './index';
import { useFormControl } from './useFormControl';

/** context 값을 화면으로 흘려보내 assert 가능하게 만든다. */
const ContextProbe = ({ id = 'ctx' }: { id?: string }) => {
  const formControl = useFormControl();

  return (
    <>
      <Text testID={id}>{formControl ? JSON.stringify(readable(formControl)) : 'no-provider'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${id}-focus`}
        onPress={() => formControl?.onInputFocus()}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${id}-blur`}
        onPress={() => formControl?.onInputBlur()}
      />
    </>
  );
};

const readable = (v: NonNullable<ReturnType<typeof useFormControl>>) => ({
  color: v.color,
  size: v.size,
  disabled: v.disabled,
  error: v.error,
  required: v.required,
  fullWidth: v.fullWidth,
  focused: v.focused,
});

const ctx = (id = 'ctx') => JSON.parse(screen.getByTestId(id).props.children as string);
const press = async (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));

const show = (ui: ReactElement) => render(ui);

describe('원시와 prop 전달', () => {
  it('실제 RN View 를 렌더하고 children 을 담는다', async () => {
    await show(
      <FormControl testID="root">
        <Text>child</Text>
      </FormControl>,
    );

    expect(screen.getByTestId('root').type).toBe('View');
    expect(screen.getByText('child')).toBeOnTheScreen();
  });

  it('일반 ViewProps 를 전달한다', async () => {
    await show(<FormControl testID="root" pointerEvents="box-none" collapsable={false} />);

    expect(screen.getByTestId('root')).toHaveProp('pointerEvents', 'box-none');
    expect(screen.getByTestId('root')).toHaveProp('collapsable', false);
  });

  it('소비자 style 이 병합된다', async () => {
    await show(<FormControl testID="root" style={{ opacity: 0.5 }} />);

    expect(screen.getByTestId('root')).toHaveStyle({ opacity: 0.5 });
  });

  it('ref 가 View 에 닿는다', async () => {
    const ref = { current: null } as { current: View | null };

    await show(<FormControl ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.measure).toBe('function');
  });

  it('접근성 집합체가 되지 않는다', async () => {
    await show(
      <FormControl testID="root">
        <Text>child</Text>
      </FormControl>,
    );

    expect(screen.getByTestId('root').props.accessible).not.toBe(true);
  });

  it('fullWidth 는 자기 루트를 늘린다', async () => {
    await show(<FormControl testID="root" fullWidth />);

    expect(screen.getByTestId('root')).toHaveStyle({ alignSelf: 'stretch' });
  });
});

describe('Context 기본값', () => {
  it('Provider 밖에서는 undefined 다', async () => {
    await show(<ContextProbe />);

    expect(screen.getByTestId('ctx')).toHaveTextContent('no-provider');
  });

  it('지정하지 않은 값은 기본값으로 내려간다', async () => {
    await show(
      <FormControl>
        <ContextProbe />
      </FormControl>,
    );

    expect(ctx()).toEqual({
      color: 'primary',
      size: 'md',
      disabled: false,
      error: false,
      required: false,
      fullWidth: false,
      focused: false,
    });
  });

  it('prop 이 그대로 context 로 내려간다', async () => {
    await show(
      <FormControl color="secondary" size="sm" disabled error required fullWidth>
        <ContextProbe />
      </FormControl>,
    );

    expect(ctx()).toMatchObject({
      color: 'secondary',
      size: 'sm',
      error: true,
      required: true,
      fullWidth: true,
    });
  });
});

describe('uncontrolled focus', () => {
  it('onInputFocus 가 focused 를 켠다', async () => {
    await show(
      <FormControl>
        <ContextProbe />
      </FormControl>,
    );
    expect(ctx().focused).toBe(false);

    await press('ctx-focus');

    expect(ctx().focused).toBe(true);
  });

  it('onInputBlur 가 focused 를 끈다', async () => {
    await show(
      <FormControl>
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-focus');
    await press('ctx-blur');

    expect(ctx().focused).toBe(false);
  });
});

describe('controlled focus', () => {
  it('focused={true} 는 blur 알림에도 유지된다', async () => {
    await show(
      <FormControl focused>
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-blur');

    expect(ctx().focused).toBe(true);
  });

  it('focused={false} 는 focus 알림에도 유지된다', async () => {
    await show(
      <FormControl focused={false}>
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-focus');

    expect(ctx().focused).toBe(false);
  });
});

describe('disabled 가 최우선이다', () => {
  it('disabled 는 controlled focused 를 누른다', async () => {
    await show(
      <FormControl disabled focused>
        <ContextProbe />
      </FormControl>,
    );

    expect(ctx()).toMatchObject({ disabled: true, focused: false });
  });

  it('disabled 는 내부 focus 상태도 누른다', async () => {
    await show(
      <FormControl disabled>
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-focus');

    expect(ctx().focused).toBe(false);
  });

  /**
   * disabled 를 지나면 내부 focus 상태는 버려져야 한다.
   *
   * `disabled ? false : …` 는 값을 **가릴 뿐**이라, 가려진 사이 `true` 로 남아 있던 상태가
   * 다시 켤 때 되살아난다. 그러면 실제로는 아무것도 포커스를 갖고 있지 않은데 라벨과 테두리가
   * 포커스를 주장한다.
   *
   * RN 은 blur 알림이 반드시 온다고 기대할 수 없다 — `editable={false}` 가 네이티브 blur 를
   * 부르는지는 플랫폼 구현에 달렸고, 포커스를 아예 알리지 않는 자손(Select)도 같은
   * FormControl 을 쓴다. 그래서 상태 기계가 알림에 기대지 않고 스스로 정리해야 한다.
   */
  it('disabled 를 켰다 끄면 내부 focus 상태가 남지 않는다', async () => {
    const view = await show(
      <FormControl>
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-focus');
    expect(ctx().focused).toBe(true);

    await view.rerender(
      <FormControl disabled>
        <ContextProbe />
      </FormControl>,
    );
    expect(ctx().focused).toBe(false);

    await view.rerender(
      <FormControl>
        <ContextProbe />
      </FormControl>,
    );

    expect(ctx().focused).toBe(false);
  });
});

/**
 * context 값의 참조 안정성.
 *
 * 자손이 전부 `useContext` 로 붙어 있어서, 값이 매 렌더 새 객체면 부모가 다시 그릴 때마다
 * 라벨·입력·헬퍼가 통째로 다시 그려진다. `useMemo` 가 실제로 그것을 막고 있는지 본다.
 *
 * 동시에 **과하게 얼지도 않았는지** 확인한다 — 값이 바뀌었는데 같은 객체를 재사용하면
 * 자손이 갱신을 놓친다.
 */
describe('context 참조 안정성', () => {
  const identities = new Set<unknown>();

  const IdentityProbe = () => {
    identities.add(useFormControl());

    return <Text testID="identity">{String(identities.size)}</Text>;
  };

  beforeEach(() => identities.clear());

  it('prop 이 그대로면 다시 렌더해도 같은 객체다', async () => {
    const view = await show(
      <FormControl color="primary" size="md">
        <IdentityProbe />
      </FormControl>,
    );

    await view.rerender(
      <FormControl color="primary" size="md">
        <IdentityProbe />
      </FormControl>,
    );

    expect(identities.size).toBe(1);
  });

  it('prop 이 바뀌면 새 객체다', async () => {
    const view = await show(
      <FormControl size="md">
        <IdentityProbe />
      </FormControl>,
    );

    await view.rerender(
      <FormControl size="sm">
        <IdentityProbe />
      </FormControl>,
    );

    expect(identities.size).toBe(2);
  });

  it('focus 알림도 새 객체를 만든다 — 자손이 상태 변화를 본다', async () => {
    await show(
      <FormControl>
        <IdentityProbe />
        <ContextProbe />
      </FormControl>,
    );

    await press('ctx-focus');

    expect(identities.size).toBe(2);
    expect(ctx().focused).toBe(true);
  });
});

describe('중첩', () => {
  it('가장 가까운 Provider 가 이긴다', async () => {
    await show(
      <FormControl color="secondary" size="sm">
        <ContextProbe id="outer" />
        <FormControl error required>
          <ContextProbe id="inner" />
        </FormControl>
      </FormControl>,
    );

    expect(ctx('outer')).toMatchObject({ color: 'secondary', size: 'sm', error: false });
    expect(ctx('inner')).toMatchObject({
      color: 'primary',
      size: 'md',
      error: true,
      required: true,
    });
  });

  it('안쪽 focus 알림이 바깥 FormControl 을 건드리지 않는다', async () => {
    await show(
      <FormControl>
        <ContextProbe id="outer" />
        <FormControl>
          <ContextProbe id="inner" />
        </FormControl>
      </FormControl>,
    );

    await press('inner-focus');

    expect(ctx('inner').focused).toBe(true);
    expect(ctx('outer').focused).toBe(false);
  });
});

describe('공개 경계', () => {
  it('배럴은 FormControl 만 내보낸다 — Context/hook 은 비공개다', () => {
    // `FormControlProps` 는 타입이라 런타임 키에 없다.
    expect(Object.keys(barrel).sort()).toEqual(['FormControl']);
  });
});
