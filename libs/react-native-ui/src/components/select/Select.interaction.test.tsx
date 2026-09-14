/**
 * RN Select 의 개폐·선택·접근성 계약.
 *
 * 메커니즘은 Pressable 트리거 + 코어 RN Modal 입니다.
 * 새 의존성(picker·bottom-sheet·portal·애니메이션 라이브러리)을 쓰지 않습니다.
 *
 * web 의 DOM 해제 메커니즘을 옮기지 않습니다 — `document` 리스너, `Node.contains`,
 * `relatedTarget`, 옵션 DOM ref, `requestAnimationFrame` 포커스 넘김이 모두 없습니다.
 */
import { Native } from '@berrypjh/ui-core';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import { FormControl } from '../form-control';
import { InputLabel } from '../input-label';

import { Select } from './Select';
import type { SelectOption } from './Select.types';

const T = Native.Light.tokens;

const show = (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

const OPTIONS = [
  { value: 'kr', label: '대한민국' },
  { value: 'us', label: '미국' },
  { value: 'jp', label: '일본', disabled: true },
] as const satisfies readonly SelectOption<'kr' | 'us' | 'jp'>[];

const trigger = () => screen.getByRole('combobox', { name: '국가' });
const choice = (name: string) => screen.getByRole('radio', { name });
const panelOpen = () => screen.queryByTestId('select-panel') !== null;

describe('개폐 (uncontrolled)', () => {
  it('기본은 닫혀 있고 선택지가 보이지 않는다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} />);

    expect(panelOpen()).toBe(false);
    expect(screen.queryByRole('radio', { name: '미국' })).toBeNull();
  });

  it('트리거를 누르면 열리고 onOpen 을 부른다', async () => {
    const onOpen = jest.fn();
    await show(<Select accessibilityLabel="국가" options={OPTIONS} onOpen={onOpen} />);

    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('열린 상태에서 트리거를 누르면 닫히고 onClose 를 부른다', async () => {
    const onClose = jest.fn();
    await show(<Select accessibilityLabel="국가" options={OPTIONS} onClose={onClose} />);

    await fireEvent.press(trigger());
    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('defaultOpen 이면 처음부터 열려 있다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(panelOpen()).toBe(true);
  });

  it('disabled Select 는 열리지 않는다', async () => {
    const onOpen = jest.fn();
    await show(<Select accessibilityLabel="국가" options={OPTIONS} disabled onOpen={onOpen} />);

    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

/**
 * disabled 는 open 보다 우선한다. 비활성 컨트롤은 목록을 보여 주지도, 값을 바꾸지도 않는다 —
 * `defaultOpen`·`open` 이 켜져 있어도 마찬가지다.
 */
describe('disabled 는 open 보다 우선한다', () => {
  it('disabled + defaultOpen 이면 Modal 을 보여 주지 않고 expanded=false 다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} disabled defaultOpen />);

    expect(panelOpen()).toBe(false);
    expect(trigger()).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ expanded: false, disabled: true }),
    );
  });

  it('disabled + controlled open 이어도 선택지를 눌러 값을 바꿀 수 없다', async () => {
    const onValueChange = jest.fn();

    await show(
      <Select
        accessibilityLabel="국가"
        options={OPTIONS}
        disabled
        open
        onValueChange={onValueChange}
      />,
    );

    expect(panelOpen()).toBe(false);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('열린 동안 disabled 가 되면 목록이 사라진다', async () => {
    const view = await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(panelOpen()).toBe(true);

    await view.rerender(
      <ThemeProvider>
        <Select accessibilityLabel="국가" options={OPTIONS} defaultOpen disabled />
      </ThemeProvider>,
    );

    expect(panelOpen()).toBe(false);
  });
});

describe('개폐 (controlled)', () => {
  it('open={false} 면 트리거를 눌러도 열리지 않고 onOpen 만 부른다', async () => {
    const onOpen = jest.fn();
    await show(<Select accessibilityLabel="국가" options={OPTIONS} open={false} onOpen={onOpen} />);

    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(false);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('open={true} 면 선택해도 닫히지 않고 onClose 만 부른다', async () => {
    const onClose = jest.fn();
    await show(<Select accessibilityLabel="국가" options={OPTIONS} open onClose={onClose} />);

    await fireEvent.press(choice('미국'));

    expect(panelOpen()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open prop 이 바뀌면 그대로 따른다', async () => {
    const view = await show(<Select accessibilityLabel="국가" options={OPTIONS} open={false} />);
    expect(panelOpen()).toBe(false);

    await view.rerender(
      <ThemeProvider>
        <Select accessibilityLabel="국가" options={OPTIONS} open />
      </ThemeProvider>,
    );

    expect(panelOpen()).toBe(true);
  });
});

describe('선택', () => {
  it('다른 활성 옵션을 고르면 값이 바뀌고 닫힌다', async () => {
    const onValueChange = jest.fn();
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} onValueChange={onValueChange} />,
    );

    await fireEvent.press(trigger());
    await fireEvent.press(choice('미국'));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('us');
    expect(panelOpen()).toBe(false);
    expect(screen.getByText('미국')).toBeOnTheScreen();
  });

  it('이미 선택된 값을 고르면 콜백 없이 닫기만 한다', async () => {
    const onValueChange = jest.fn();
    await show(
      <Select
        accessibilityLabel="국가"
        options={OPTIONS}
        defaultValue="kr"
        onValueChange={onValueChange}
      />,
    );

    await fireEvent.press(trigger());
    await fireEvent.press(choice('대한민국'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(panelOpen()).toBe(false);
  });

  it('disabled 옵션은 값을 바꾸지 못하고 닫지도 않는다', async () => {
    const onValueChange = jest.fn();
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} onValueChange={onValueChange} />,
    );

    await fireEvent.press(trigger());
    await fireEvent.press(choice('일본'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(panelOpen()).toBe(true);
  });

  it('controlled value 는 선택해도 prop 이 최종 권한이다', async () => {
    const onValueChange = jest.fn();
    await show(
      <Select
        accessibilityLabel="국가"
        options={OPTIONS}
        value="kr"
        onValueChange={onValueChange}
      />,
    );

    await fireEvent.press(trigger());
    await fireEvent.press(choice('미국'));

    expect(onValueChange).toHaveBeenCalledWith('us');
    expect(screen.getByText('대한민국')).toBeOnTheScreen();
  });

  it('콜백 페이로드는 RN 네이티브 값이다 — 합성 이벤트가 아니다', async () => {
    const onValueChange = jest.fn();
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} onValueChange={onValueChange} />,
    );

    await fireEvent.press(trigger());
    await fireEvent.press(choice('미국'));

    const arg = onValueChange.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect((arg as unknown as { target?: unknown }).target).toBeUndefined();
  });
});

describe('해제 경로', () => {
  it('Android 하드웨어 back(onRequestClose)으로 닫힌다', async () => {
    const onClose = jest.fn();
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultOpen onClose={onClose} />,
    );

    await fireEvent(screen.getByTestId('select-modal'), 'requestClose');

    expect(panelOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경을 눌러 닫는다', async () => {
    const onClose = jest.fn();
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultOpen onClose={onClose} />,
    );

    await fireEvent.press(screen.getByTestId('select-backdrop'));

    expect(panelOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경은 기본적으로 접근성 요소가 아니다', async () => {
    // 이름 없는 버튼으로 읽히면 안 됩니다. 스크린리더 사용자는 back/escape 를 씁니다.
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(screen.getByTestId('select-backdrop').props.accessible).not.toBe(true);
  });

  it('소비자가 라벨을 주면 배경이 접근 가능한 해제 버튼이 된다', async () => {
    // 영어 기본 문자열을 API 불변식으로 박지 않습니다 — 현지화 규약이 저장소에 없습니다.
    await show(
      <Select
        accessibilityLabel="국가"
        options={OPTIONS}
        defaultOpen
        dismissAccessibilityLabel="닫기"
      />,
    );

    expect(screen.getByRole('button', { name: '닫기' })).toBeOnTheScreen();
  });
});

describe('접근성', () => {
  it('트리거가 combobox 역할과 expanded 상태를 노출한다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} />);
    expect(trigger()).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ expanded: false, disabled: false }),
    );

    await fireEvent.press(trigger());

    expect(trigger()).toHaveProp('accessibilityState', expect.objectContaining({ expanded: true }));
  });

  it('선택된 값이 문자열이면 accessibilityValue 로 전달된다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} value="kr" />);

    expect(trigger()).toHaveProp('accessibilityValue', { text: '대한민국' });
  });

  it('label 이 임의의 노드면 값을 지어내지 않는다', async () => {
    const nodeOptions = [
      { value: 'kr', label: <></> },
    ] as const satisfies readonly SelectOption<'kr'>[];

    await show(<Select accessibilityLabel="국가" options={nodeOptions} value="kr" />);

    // RN 은 `accessibilityValue` 를 항상 {max,min,now,text} 객체로 정규화합니다.
    // 중요한 것은 말할 텍스트가 없다는 것입니다.
    expect(trigger().props.accessibilityValue?.text).toBeUndefined();
  });

  it('옵션의 accessibilityLabel 이 있으면 그것을 값으로 쓴다', async () => {
    const nodeOptions = [
      { value: 'kr', label: <></>, accessibilityLabel: '대한민국' },
    ] as const satisfies readonly SelectOption<'kr'>[];

    await show(<Select accessibilityLabel="국가" options={nodeOptions} value="kr" />);

    expect(trigger()).toHaveProp('accessibilityValue', { text: '대한민국' });
  });

  it('disabled 트리거가 접근성으로 알려진다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} disabled />);

    expect(trigger()).toBeDisabled();
  });

  it('선택지는 radio 역할과 checked 상태를 쓴다 — 없는 option 역할을 지어내지 않는다', async () => {
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultValue="kr" defaultOpen />,
    );

    expect(choice('대한민국')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ checked: true }),
    );
    expect(choice('미국')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ checked: false }),
    );
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  });

  it('disabled 선택지가 접근성으로 알려진다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(choice('일본')).toBeDisabled();
  });

  it('선택된 disabled 선택지는 checked 와 disabled 를 함께 알린다', async () => {
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultValue="jp" defaultOpen />,
    );

    expect(choice('일본')).toHaveProp('accessibilityState', { checked: true, disabled: true });
  });

  it('목록 컨테이너가 radiogroup 이고 자식을 삼키지 않는다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    const panel = screen.getByTestId('select-panel');
    expect(panel).toHaveProp('accessibilityRole', 'radiogroup');
    expect(panel.props.accessible).not.toBe(true);
  });
});

describe('FormControl 통합', () => {
  it('disabled 를 상속해 열리지 않는다', async () => {
    await show(
      <FormControl disabled>
        <Select accessibilityLabel="국가" options={OPTIONS} />
      </FormControl>,
    );

    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(false);
    expect(trigger()).toBeDisabled();
  });

  it('error 를 상속한다', async () => {
    await show(
      <FormControl error>
        <Select accessibilityLabel="국가" options={OPTIONS} />
      </FormControl>,
    );

    expect(trigger()).toHaveStyle({ borderColor: T.color.stroke.error });
  });

  it('명시 prop 이 상속을 이긴다', async () => {
    await show(
      <FormControl disabled>
        <Select accessibilityLabel="국가" options={OPTIONS} disabled={false} />
      </FormControl>,
    );

    await fireEvent.press(trigger());

    expect(panelOpen()).toBe(true);
  });

  it('가장 가까운 FormControl 이 이긴다', async () => {
    await show(
      <FormControl error>
        <FormControl>
          <Select accessibilityLabel="국가" options={OPTIONS} />
        </FormControl>
      </FormControl>,
    );

    expect(trigger()).toHaveStyle({ borderColor: T.color.field.border });
  });

  it('Select 는 FormControl 의 입력 focus 를 가로채지 않는다', async () => {
    // Context 의 `onInputFocus`/`onInputBlur` 는 TextInput 포커스 계약입니다.
    // 트리거를 누르는 것은 그것이 아니므로 라벨이 focus 색으로 바뀌면 안 됩니다.
    await show(
      <FormControl>
        <InputLabel testID="label">국가</InputLabel>
        <Select accessibilityLabel="국가" options={OPTIONS} />
      </FormControl>,
    );

    await fireEvent.press(trigger());

    expect(screen.getByTestId('label')).toHaveStyle({ color: T.color.text.default });
  });
});

describe('토큰 기반 패널 표현', () => {
  it('패널이 canonical surface·테두리·radius 를 쓴다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(screen.getByTestId('select-panel')).toHaveStyle({
      backgroundColor: T.color.background.surface,
      borderColor: T.color.field.border,
      borderRadius: T.radius.md,
    });
  });

  it('선택된 선택지가 selected 배경을 쓴다', async () => {
    await show(
      <Select accessibilityLabel="국가" options={OPTIONS} defaultValue="kr" defaultOpen />,
    );

    expect(choice('대한민국')).toHaveStyle({ backgroundColor: T.color.background.selected });
    expect(choice('미국')).toHaveStyle({ backgroundColor: 'transparent' });
  });

  it('disabled 선택지가 disable 텍스트색을 쓴다', async () => {
    await show(<Select accessibilityLabel="국가" options={OPTIONS} defaultOpen />);

    expect(screen.getByText('일본')).toHaveStyle({ color: T.color.text.disable });
  });
});
