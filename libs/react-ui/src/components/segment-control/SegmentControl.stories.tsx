import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { SegmentControl } from './SegmentControl';
import type { SegmentControlProps, SegmentOption } from './SegmentControl.types';

type View = 'list' | 'grid' | 'gallery';

const viewOptions: readonly SegmentOption<View>[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'gallery', label: 'Gallery' },
];

const meta = {
  title: 'Components/Selection/SegmentControl',
  component: SegmentControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    'aria-label': 'View mode',
    options: viewOptions,
    value: 'list' as View,
    onChange: () => undefined,
  },
  argTypes: {
    value: { control: 'select', options: ['list', 'grid', 'gallery'] },
    options: { control: false },
    onChange: { action: 'changed' },
    className: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof SegmentControl<View>>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

export const Playground: Story = {
  render: (rawArgs) => {
    const args = rawArgs as SegmentControlProps<View>;
    const [value, setValue] = useState<View>(args.value);
    return (
      <SegmentControl<View>
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
    );
  },
};

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<View>('list');
    return (
      <SegmentControl<View>
        aria-label="View mode"
        options={viewOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const TwoOptions: Story = {
  render: () => {
    type Mode = 'on' | 'off';
    const [value, setValue] = useState<Mode>('on');
    return (
      <SegmentControl<Mode>
        aria-label="Toggle"
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState<View>('list');
    return (
      <SegmentControl<View>
        aria-label="View mode with disabled option"
        options={[
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid', disabled: true },
          { value: 'gallery', label: 'Gallery' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    type Align = 'left' | 'center' | 'right';
    const [value, setValue] = useState<Align>('left');
    return (
      <SegmentControl<Align>
        aria-label="Alignment"
        options={[
          { value: 'left', label: <span aria-hidden="true">⟸</span>, ariaLabel: 'Align left' },
          { value: 'center', label: <span aria-hidden="true">≡</span>, ariaLabel: 'Align center' },
          { value: 'right', label: <span aria-hidden="true">⟹</span>, ariaLabel: 'Align right' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const Stacked: Story = {
  render: () => {
    const [view, setView] = useState<View>('list');
    type Sort = 'name' | 'date';
    const [sort, setSort] = useState<Sort>('name');
    return (
      <div style={columnStyle}>
        <SegmentControl<View>
          aria-label="View mode"
          options={viewOptions}
          value={view}
          onChange={setView}
        />
        <SegmentControl<Sort>
          aria-label="Sort"
          options={[
            { value: 'name', label: 'Name' },
            { value: 'date', label: 'Date' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>
    );
  },
};

const viewOptionsWithDisabled: readonly SegmentOption<View>[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'gallery', label: 'Gallery', disabled: true },
];

/**
 * controlled 하네스로 선택이 바뀌는 것을 보이고, disabled 옵션은 활성화되지 않으며,
 * 키보드 포커스가 보이는 상태로 끝난다 (Chromatic 이 `:focus-visible` 링을 찍는다).
 */
export const Interaction: Story = {
  render: () => {
    const [value, setValue] = useState<View>('list');
    return (
      <SegmentControl<View>
        aria-label="View mode"
        options={viewOptionsWithDisabled}
        value={value}
        onChange={setValue}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('button', { name: 'List' });
    const grid = canvas.getByRole('button', { name: 'Grid' });
    const gallery = canvas.getByRole('button', { name: 'Gallery' });

    await userEvent.click(grid);
    await expect(grid).toHaveAttribute('aria-pressed', 'true');
    await expect(list).toHaveAttribute('aria-pressed', 'false');

    // 키보드: native button 이라 Shift+Tab 으로 옮기고 Space 로 고른다.
    await userEvent.tab({ shift: true });
    await expect(list).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(list).toHaveAttribute('aria-pressed', 'true');

    // disabled 옵션은 눌러도 활성화되지 않는다. (비활성 버튼을 누른 뒤 포커스가 어디 남는지는
    // 브라우저마다 달라 이 경로는 포커스를 가정하지 않는다.)
    await expect(gallery).toBeDisabled();
    await userEvent.click(gallery);
    await expect(gallery).toHaveAttribute('aria-pressed', 'false');
    await expect(list).toHaveAttribute('aria-pressed', 'true');

    // 키보드로 들어온 포커스로 끝낸다 — Chromatic 이 `:focus-visible` 링을 찍는다.
    await userEvent.tab();
    await expect(list).toHaveFocus();
  },
};

/** 좁은 폭에서 긴 라벨. 세그먼트는 같은 폭을 나눠 갖는다. */
export const LongLabels: Story = {
  render: () => {
    type Billing = 'monthly' | 'quarterly' | 'annual';
    const [value, setValue] = useState<Billing>('monthly');
    return (
      <div style={{ width: '280px' }}>
        <SegmentControl<Billing>
          aria-label="Billing period"
          options={[
            { value: 'monthly', label: 'Monthly billing' },
            { value: 'quarterly', label: 'Quarterly billing with discount' },
            { value: 'annual', label: 'Annual' },
          ]}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

/** 모든 테마에서 선택·비활성·선택+비활성(비활성 글자색이 이긴다)을 한 장에 담는다. */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {(theme) => (
        <div style={{ display: 'grid', gap: '12px', maxWidth: '360px' }}>
          <SegmentControl<View>
            aria-label={`View mode (${theme})`}
            options={viewOptionsWithDisabled}
            value="grid"
            onChange={() => undefined}
          />
          <SegmentControl<View>
            aria-label={`View mode, selected option disabled (${theme})`}
            options={viewOptionsWithDisabled}
            value="gallery"
            onChange={() => undefined}
          />
        </div>
      )}
    </ThemeGallery>
  ),
};
