import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { Avatar } from '../avatar';

import { Chip } from './Chip';

/**
 * Chip 은 두 모드만 있다.
 *
 * - **passive** (`onClick` 없음) — 태그·라벨. 포커스 대상이 아니다.
 * - **interactive** (`onClick` 있음) — native `<button>`. `selected` 를 주면 `aria-pressed` toggle.
 *
 * `Intents` 스토리가 없다 — V1 에 `intent` 가 없다. 선택 강조가 이미
 * `selectionControl.checked`(= `{primary.pr700}`)라서 `intent='primary'` 와 `selected` 가 같은
 * 색으로 겹친다. 카테고리 색은 `Badge` 가 가진다.
 *
 * `onDelete` 스토리도 없다 — DEFER 했다 (중첩 상호작용 문제).
 */
const meta = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: '디자인 시스템',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
    children: { control: 'text' },
    leading: { control: false },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

const rowStyle = { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } as const;
const stackStyle = { display: 'grid', gap: '16px', justifyItems: 'start' } as const;

/** 태그·라벨. `<span>` 이고 포커스 대상이 아니다. */
export const Passive: Story = {};

/** `onClick` 을 주면 native `<button type="button">` 이 된다. */
export const Interactive: Story = {
  args: { onClick: () => undefined },
};

/**
 * `selected` 를 주면 `aria-pressed` toggle 이 된다.
 *
 * 선택 표시는 **면과 테두리를 함께** 바꾼다 — 색 하나에만 기대면 그 색을 구분하지 못하는
 * 사용자에게 상태가 사라진다.
 */
export const Selected: Story = {
  args: { onClick: () => undefined, selected: true },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Chip {...args} onClick={() => undefined} disabled>
        비활성
      </Chip>
      <Chip {...args} onClick={() => undefined} selected disabled>
        비활성 · 선택됨
      </Chip>
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={stackStyle}>
      <div style={rowStyle}>
        <Chip {...args} variant="outlined">
          outlined
        </Chip>
        <Chip {...args} variant="filled">
          filled
        </Chip>
      </div>
      <div style={rowStyle}>
        <Chip {...args} variant="outlined" onClick={() => undefined} selected>
          outlined · 선택됨
        </Chip>
        <Chip {...args} variant="filled" onClick={() => undefined} selected>
          filled · 선택됨
        </Chip>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Chip {...args} size="sm">
        sm
      </Chip>
      <Chip {...args} size="md">
        md
      </Chip>
    </div>
  ),
};

export const LeadingIcon: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Chip {...args} leading={<span>◆</span>}>
        아이콘
      </Chip>
      <Chip {...args} leading={<span>◆</span>} onClick={() => undefined} selected>
        선택된 아이콘
      </Chip>
    </div>
  ),
};

/**
 * `leading` 은 그냥 노드다 — `Avatar` 에 강결합하지 않는다.
 *
 * 슬롯은 `aria-hidden` 이라 Avatar 의 이름이 chip 의 접근 가능한 이름을 오염시키지 않는다.
 */
export const WithAvatar: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Chip
        {...args}
        size="md"
        leading={
          <Avatar size="sm" alt="">
            길동
          </Avatar>
        }
      >
        홍길동
      </Chip>
      <Chip
        {...args}
        size="md"
        onClick={() => undefined}
        selected
        leading={
          <Avatar size="sm" alt="">
            철수
          </Avatar>
        }
      >
        김철수
      </Chip>
    </div>
  ),
};

/**
 * 실제 filter set — 소비자가 선택 상태를 소유한다.
 *
 * play 로 키보드 경로를 확인한다: 탭으로 도달하고 Space 로 토글되며 `aria-pressed` 가 따라온다.
 */
export const KeyboardFocus: Story = {
  render: () => {
    const FilterSet = () => {
      const [picked, setPicked] = useState<string[]>(['디자인']);
      const toggle = (name: string) =>
        setPicked((prev) =>
          prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
        );

      return (
        <div style={rowStyle}>
          {['디자인', '개발', '기획'].map((name) => (
            <Chip key={name} onClick={() => toggle(name)} selected={picked.includes(name)}>
              {name}
            </Chip>
          ))}
        </div>
      );
    };

    return <FilterSet />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    const design = canvas.getByRole('button', { name: '디자인' });

    await expect(design).toHaveFocus();
    await expect(design).toHaveAttribute('aria-pressed', 'true');

    // native button 이라 Space 로 활성화된다.
    await userEvent.keyboard(' ');
    await expect(design).toHaveAttribute('aria-pressed', 'false');

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: '개발' })).toHaveFocus();
  },
};

export const AllThemes: Story = {
  parameters: themeGalleryParameters,
  render: (args) => (
    <ThemeGallery>
      {() => (
        <div style={rowStyle}>
          <Chip {...args}>태그</Chip>
          <Chip {...args} variant="filled">
            filled
          </Chip>
          <Chip {...args} onClick={() => undefined}>
            누를 수 있음
          </Chip>
          <Chip {...args} onClick={() => undefined} selected>
            선택됨
          </Chip>
          <Chip {...args} onClick={() => undefined} disabled>
            비활성
          </Chip>
        </div>
      )}
    </ThemeGallery>
  ),
};

/**
 * forced-colors(Windows 고대비) 검토용.
 *
 * 그 모드에서 가장 위험한 것은 **선택 상태가 사라지는 것**이다. `chip.scss` 가 그 모드에서만
 * `Highlight` 로 채우므로 선택된 chip 이 구분되어야 한다. 스크린샷으로는 강제 모드를 켤 수 없어
 * 검토 대상을 한 화면에 모아 두는 것이 이 스토리의 역할이다 (규칙은 `forcedColors.test.ts` 가 검사).
 */
export const ForcedColorsReview: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Chip {...args}>passive</Chip>
      <Chip {...args} onClick={() => undefined}>
        선택 안 됨
      </Chip>
      <Chip {...args} onClick={() => undefined} selected>
        선택됨
      </Chip>
      <Chip {...args} onClick={() => undefined} selected disabled>
        선택됨 · 비활성
      </Chip>
    </div>
  ),
};

/** 긴 라벨은 잘린다 — chip 이 컨테이너를 밀어내지 않는다. */
export const LongLabel: Story = {
  render: (args) => (
    <div style={{ ...stackStyle, maxWidth: '240px' }}>
      <Chip {...args}>디자인 시스템 컴포넌트 라이브러리 태그</Chip>
      <Chip {...args} onClick={() => undefined} selected leading={<span>◆</span>}>
        선택된 아주 긴 라벨을 가진 필터 칩
      </Chip>
    </div>
  ),
};
