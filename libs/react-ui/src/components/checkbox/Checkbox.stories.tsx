import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { FormControl } from '../form-control';
import { FormHelperText } from '../form-helper-text';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Selection/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    children: '이용 약관에 동의합니다',
  },
  argTypes: {
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

const matrixStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
  gap: '8px 16px',
} as const;

const stackStyle = { display: 'grid', gap: '8px', justifyItems: 'start' } as const;

/**
 * 정적으로 그릴 수 있는 상태 전부. hover·pressed 는 여기 없다 — CSS `:hover`·`:active` 는
 * play 의 합성 이벤트로 켜지지 않아 스크린샷에 담기지 않고, 그 규칙은 `Checkbox.test.tsx` 의
 * 스타일 계약이 소스 수준에서 본다. pressed 는 시각이 없다(색이 아니라 위치라는 토큰 결정).
 * 포커스는 `Keyboard` 가 play 로 켠다.
 *
 * 테마마다 반복되므로 id 를 쓰지 않는다 — 문서 안에서 id 가 겹친다.
 */
const CheckboxMatrix = () => (
  <div style={matrixStyle}>
    <Checkbox>미선택</Checkbox>
    <Checkbox defaultChecked>선택</Checkbox>
    <Checkbox indeterminate>혼합</Checkbox>
    <Checkbox disabled>비활성 · 미선택</Checkbox>
    <Checkbox disabled defaultChecked>
      비활성 · 선택
    </Checkbox>
    <Checkbox disabled indeterminate>
      비활성 · 혼합
    </Checkbox>
    <Checkbox error>오류 · 미선택</Checkbox>
    <Checkbox error defaultChecked>
      오류 · 선택
    </Checkbox>
    <Checkbox aria-label="보이는 라벨 없음" />
  </div>
);

export const Playground: Story = {};

/** 등록된 모든 테마에서 같은 상태 매트릭스를 한 스크린샷에 담는다. */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => <ThemeGallery>{() => <CheckboxMatrix />}</ThemeGallery>,
};

/**
 * `indeterminate` 는 DOM property 다. 누르면 브라우저가 지우고 checked 를 뒤집는다 —
 * 컴포넌트는 그 뒤 소비자가 다시 렌더할 때 prop 을 다시 적용할 뿐이다.
 */
export const Indeterminate: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  args: { children: '전체 선택', indeterminate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole<HTMLInputElement>('checkbox', { name: '전체 선택' });

    await expect(checkbox.indeterminate).toBe(true);
    await expect(checkbox).toBePartiallyChecked();

    await userEvent.click(canvas.getByText('전체 선택'));
    await expect(checkbox.indeterminate).toBe(false);
    await expect(checkbox).toBeChecked();
  },
};

/** FormControl 의 `error` 를 상속해 `aria-invalid` 를 말하고, 헬퍼는 `aria-describedby` 로 잇는다. */
export const Validation: Story = {
  name: 'Validation / Description',
  render: () => (
    <FormControl error>
      <Checkbox aria-describedby="terms-error">이용 약관에 동의합니다</Checkbox>
      <FormHelperText id="terms-error">약관에 동의해야 계속할 수 있습니다</FormHelperText>
    </FormControl>
  ),
};

export const LongLabel: Story = {
  args: {
    children:
      '서비스 개선을 위해 익명화된 사용 기록을 수집하는 데 동의합니다. 이 설정은 계정 설정에서 언제든지 바꿀 수 있습니다.',
  },
  render: (args) => (
    <div style={{ maxWidth: '320px' }}>
      <Checkbox {...args} />
    </div>
  ),
};

/**
 * 키보드·라벨 클릭은 native 가 소유한다. Tab 이 들어오면 `:focus-visible` outline 이 보이고
 * Space 가 토글하며, 보이는 라벨을 누르면 토글된다. (키 입력은 user-event 시뮬레이션이다.)
 */
export const Keyboard: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  render: () => (
    <div style={stackStyle}>
      <Checkbox>이용 약관에 동의합니다</Checkbox>
      <Checkbox>마케팅 정보 수신</Checkbox>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const terms = canvas.getByRole('checkbox', { name: '이용 약관에 동의합니다' });
    const marketing = canvas.getByRole('checkbox', { name: '마케팅 정보 수신' });

    await userEvent.tab();
    await expect(terms).toHaveFocus();
    await expect(getComputedStyle(terms).outlineStyle).toBe('solid');

    await userEvent.keyboard(' ');
    await expect(terms).toBeChecked();

    await userEvent.click(canvas.getByText('마케팅 정보 수신'));
    await expect(marketing).toBeChecked();
  },
};

/**
 * Windows 고대비. 이 모드에서는 native 외형으로 돌아가 OS 가 경계·체크·혼합·비활성을 시스템
 * 색으로 그린다. Chromatic 이 `forcedColors` 로 찍고, 로컬에서는 DevTools 렌더링 에뮬레이션으로 본다.
 */
export const ForcedColors: Story = {
  parameters: { chromatic: { forcedColors: 'active', prefersReducedMotion: 'reduce' } },
  render: () => <CheckboxMatrix />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('checkbox', { name: '미선택' })).toHaveFocus();
  },
};
