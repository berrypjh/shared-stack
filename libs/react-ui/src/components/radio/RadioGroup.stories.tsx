import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { FormControl } from '../form-control';
import { FormHelperText } from '../form-helper-text';

import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Components/Selection/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: '배송 방법',
  },
  argTypes: {
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const matrixStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
  gap: '16px',
  alignItems: 'start',
} as const;

const Options = () => (
  <>
    <Radio value="standard">일반 배송</Radio>
    <Radio value="express">빠른 배송</Radio>
    <Radio value="pickup">매장 방문</Radio>
  </>
);

/**
 * 정적으로 그릴 수 있는 상태 전부 — 미선택·선택, 비활성 선택지(미선택), 비활성 그룹(선택),
 * 그룹 오류, 보이는 라벨 없는 그룹. hover 는 CSS `:hover` 라서 스크린샷에 담기지 않고
 * `Radio.test.tsx` 의 스타일 계약이 소스 수준에서 본다. 포커스는 `Keyboard` 가 play 로 켠다.
 *
 * `name` 은 그룹마다 `useId` 로 생긴다 — 테마마다 반복해도 그룹끼리 섞이지 않는다.
 */
const RadioMatrix = () => (
  <div style={matrixStyle}>
    <RadioGroup label="미선택 · 선택" defaultValue="express">
      <Options />
    </RadioGroup>
    <RadioGroup label="비활성 선택지" defaultValue="standard">
      <Radio value="standard">일반 배송</Radio>
      <Radio value="express" disabled>
        빠른 배송 (품절)
      </Radio>
    </RadioGroup>
    <RadioGroup label="비활성 그룹" defaultValue="standard" disabled>
      <Options />
    </RadioGroup>
    <RadioGroup label="오류" error>
      <Options />
    </RadioGroup>
    <RadioGroup aria-label="보이는 라벨 없음" defaultValue="list">
      <Radio value="list">목록</Radio>
      <Radio value="grid">격자</Radio>
    </RadioGroup>
  </div>
);

/** controlled — 그룹 `value` 가 선택을 정한다. */
export const Playground: Story = {
  render: () => {
    const [value, setValue] = useState('express');
    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        <RadioGroup label="배송 방법" value={value} onValueChange={setValue}>
          <Options />
        </RadioGroup>
        <output>선택: {value}</output>
      </div>
    );
  },
};

/** 등록된 모든 테마에서 같은 상태 매트릭스를 한 스크린샷에 담는다. */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => <ThemeGallery>{() => <RadioMatrix />}</ThemeGallery>,
};

/**
 * 키보드는 브라우저가 소유한다 — 컴포넌트는 키를 가로채지 않는다.
 *
 * Tab 은 선택된 radio 에 한 번 멈추고, 방향키(Down·Right 다음, Up·Left 이전)가 비활성을
 * 건너뛰며 선택을 옮기고, 포커스는 `:focus-visible` outline 으로 보인다. Shift+Tab 은 그룹을
 * 다시 한 정지점으로 돌아온다. (키 입력은 user-event 시뮬레이션이다.)
 */
export const Keyboard: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', justifyItems: 'start' }}>
      <button type="button">이전</button>
      <RadioGroup label="배송 방법" defaultValue="standard">
        <Radio value="standard">일반 배송</Radio>
        <Radio value="express">빠른 배송</Radio>
        <Radio value="pickup" disabled>
          매장 방문 (준비 중)
        </Radio>
        <Radio value="dawn">새벽 배송</Radio>
      </RadioGroup>
      <button type="button">다음</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = (name: string) => canvas.getByRole('radio', { name });

    canvas.getByRole('button', { name: '이전' }).focus();
    await userEvent.tab();
    await expect(radio('일반 배송')).toHaveFocus();
    await expect(getComputedStyle(radio('일반 배송')).outlineStyle).toBe('solid');

    await userEvent.keyboard('{ArrowDown}');
    await expect(radio('빠른 배송')).toBeChecked();

    await userEvent.keyboard('{ArrowRight}');
    await expect(radio('새벽 배송')).toBeChecked();
    await expect(radio('매장 방문 (준비 중)')).not.toBeChecked();

    await userEvent.keyboard('{ArrowUp}');
    await expect(radio('빠른 배송')).toBeChecked();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(radio('일반 배송')).toBeChecked();

    await userEvent.keyboard(' ');
    await expect(radio('일반 배송')).toBeChecked();

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: '다음' })).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(radio('일반 배송')).toHaveFocus();
  },
};

/**
 * 그룹 수준의 필수·오류·설명. `required` 는 모든 선택지에 native 로 가고, 오류는 FormControl
 * 에서 상속하며, 설명은 그룹의 `aria-describedby` 로 잇는다.
 */
export const Validation: Story = {
  name: 'Validation / Description',
  render: () => (
    <form style={{ display: 'grid', gap: '12px' }} onSubmit={(event) => event.preventDefault()}>
      <FormControl error required>
        <RadioGroup label="배송 방법" name="ship" aria-describedby="ship-error">
          <Options />
        </RadioGroup>
        <FormHelperText id="ship-error">배송 방법을 골라 주세요</FormHelperText>
      </FormControl>
      <button type="submit">주문</button>
    </form>
  ),
};

export const LongLabels: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }}>
      <RadioGroup label="개인정보 보관 기간" defaultValue="year">
        <Radio value="year">1년 동안 보관하고 이후 자동으로 파기합니다</Radio>
        <Radio value="withdraw">회원 탈퇴 시까지 보관하며 탈퇴하면 즉시 파기합니다</Radio>
      </RadioGroup>
    </div>
  ),
};

/**
 * Windows 고대비. native 외형으로 돌아가 OS 가 경계·점·비활성을 시스템 색으로 그린다.
 * Chromatic 이 `forcedColors` 로 찍고, 로컬에서는 DevTools 렌더링 에뮬레이션으로 본다.
 */
export const ForcedColors: Story = {
  parameters: { chromatic: { forcedColors: 'active', prefersReducedMotion: 'reduce' } },
  render: () => <RadioMatrix />,
  play: async ({ canvasElement }) => {
    // 매트릭스의 여러 그룹이 같은 선택지 이름을 쓴다 — 첫 그룹 안으로 좁혀서, Tab 이 그 그룹의
    // **선택된** radio(`defaultValue="express"`)에 멈추는지 본다.
    const firstGroup = within(canvasElement).getByRole('group', { name: '미선택 · 선택' });

    await userEvent.tab();
    await expect(within(firstGroup).getByRole('radio', { name: '빠른 배송' })).toHaveFocus();
  },
};
