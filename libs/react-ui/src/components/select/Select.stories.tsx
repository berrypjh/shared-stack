import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { MenuItem } from '../menu-item';

import { Select } from './Select';

const meta = {
  title: 'Components/Selection/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    'aria-label': 'Select an option',
    variant: 'boxed',
    size: 'md',
    color: 'primary',
    disabled: false,
    error: false,
    required: false,
    fullWidth: false,
    multiple: false,
    displayEmpty: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['plain', 'filled', 'boxed'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    required: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    multiple: { control: 'boolean' },
    displayEmpty: { control: 'boolean' },
    onChange: { action: 'changed' },
    onOpen: { action: 'opened' },
    onClose: { action: 'closed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    children: { control: false },
    renderValue: { control: false },
    placeholder: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '280px',
};

export const Playground: Story = {
  render: (args) => (
    <Select {...args} defaultValue="react">
      <MenuItem value="react">React</MenuItem>
      <MenuItem value="vue">Vue</MenuItem>
      <MenuItem value="angular">Angular</MenuItem>
      <MenuItem value="svelte">Svelte</MenuItem>
    </Select>
  ),
};

export const Default: Story = {
  render: () => (
    <Select aria-label="Period" defaultValue="monthly">
      <MenuItem value="daily">Daily</MenuItem>
      <MenuItem value="weekly">Weekly</MenuItem>
      <MenuItem value="monthly">Monthly</MenuItem>
      <MenuItem value="yearly">Yearly</MenuItem>
    </Select>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Plain variant" variant="plain" defaultValue="option1">
        <MenuItem value="option1">Plain variant</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
      <Select aria-label="Filled variant" variant="filled" defaultValue="option1">
        <MenuItem value="option1">Filled variant</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
      <Select aria-label="Boxed variant" variant="boxed" defaultValue="option1">
        <MenuItem value="option1">Boxed variant</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Small size" size="sm" defaultValue="option1">
        <MenuItem value="option1">Small (sm)</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
      <Select aria-label="Medium size" size="md" defaultValue="option1">
        <MenuItem value="option1">Medium (md)</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Primary color" color="primary" defaultValue="option1">
        <MenuItem value="option1">Primary color</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
      <Select aria-label="Secondary color" color="secondary" defaultValue="option1">
        <MenuItem value="option1">Secondary color</MenuItem>
        <MenuItem value="option2">Option 2</MenuItem>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select aria-label="Period (disabled)" disabled defaultValue="weekly">
      <MenuItem value="daily">Daily</MenuItem>
      <MenuItem value="weekly">Weekly</MenuItem>
      <MenuItem value="monthly">Monthly</MenuItem>
    </Select>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Role" error defaultValue="">
        <MenuItem value="">Select a role</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="member">Member</MenuItem>
      </Select>
      <Select aria-label="Status" error defaultValue="invalid">
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="inactive">Inactive</MenuItem>
      </Select>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <Select aria-label="Timezone" required defaultValue="">
      <MenuItem value="">Select a timezone</MenuItem>
      <MenuItem value="utc">UTC</MenuItem>
      <MenuItem value="est">Eastern (EST)</MenuItem>
      <MenuItem value="pst">Pacific (PST)</MenuItem>
    </Select>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div style={columnStyle}>
      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
        Multiple selection — click items to toggle.
      </p>
      <Select aria-label="Skills" multiple defaultValue={['react', 'typescript']}>
        <MenuItem value="react">React</MenuItem>
        <MenuItem value="typescript">TypeScript</MenuItem>
        <MenuItem value="graphql">GraphQL</MenuItem>
        <MenuItem value="docker">Docker</MenuItem>
        <MenuItem value="kubernetes">Kubernetes</MenuItem>
      </Select>
    </div>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Country" placeholder="Select a country">
        <MenuItem value="kr">South Korea</MenuItem>
        <MenuItem value="us">United States</MenuItem>
        <MenuItem value="jp">Japan</MenuItem>
        <MenuItem value="de">Germany</MenuItem>
      </Select>
      <Select aria-label="Category" displayEmpty defaultValue="">
        <MenuItem value="">All categories</MenuItem>
        <MenuItem value="frontend">Frontend</MenuItem>
        <MenuItem value="backend">Backend</MenuItem>
        <MenuItem value="devops">DevOps</MenuItem>
      </Select>
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Select aria-label="Account status" defaultValue="active">
      <MenuItem value="active">Active</MenuItem>
      <MenuItem value="pending">Pending</MenuItem>
      <MenuItem value="suspended" disabled>
        Suspended (unavailable)
      </MenuItem>
      <MenuItem value="archived" disabled>
        Archived (unavailable)
      </MenuItem>
      <MenuItem value="deleted" disabled>
        Deleted (unavailable)
      </MenuItem>
    </Select>
  ),
};

export const WithRenderValue: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select
        aria-label="Role"
        defaultValue="admin"
        renderValue={(value) => (
          <span>
            <strong>Role:</strong> {String(value)}
          </span>
        )}
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="editor">Editor</MenuItem>
        <MenuItem value="viewer">Viewer</MenuItem>
      </Select>
      <Select
        aria-label="Selected skills"
        multiple
        defaultValue={['react', 'typescript']}
        renderValue={(value) => (Array.isArray(value) ? `${value.length} selected` : String(value))}
      >
        <MenuItem value="react">React</MenuItem>
        <MenuItem value="typescript">TypeScript</MenuItem>
        <MenuItem value="graphql">GraphQL</MenuItem>
        <MenuItem value="docker">Docker</MenuItem>
      </Select>
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '480px' }}>
      <Select aria-label="Period" fullWidth defaultValue="monthly">
        <MenuItem value="daily">Daily</MenuItem>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
      </Select>
      <Select aria-label="Department" fullWidth size="sm" defaultValue="frontend">
        <MenuItem value="frontend">Frontend</MenuItem>
        <MenuItem value="backend">Backend</MenuItem>
        <MenuItem value="design">Design</MenuItem>
      </Select>
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <Select aria-label="Option" defaultValue="very-long">
        <MenuItem value="short">Short</MenuItem>
        <MenuItem value="very-long">
          This is a very long option label that tests overflow handling
        </MenuItem>
        <MenuItem value="another">Another option</MenuItem>
      </Select>
      <Select
        aria-label="Multi-select skills"
        multiple
        defaultValue={['react', 'typescript', 'graphql', 'docker']}
        renderValue={(value) => (Array.isArray(value) ? value.join(', ') : String(value))}
      >
        <MenuItem value="react">React</MenuItem>
        <MenuItem value="typescript">TypeScript</MenuItem>
        <MenuItem value="graphql">GraphQL</MenuItem>
        <MenuItem value="docker">Docker</MenuItem>
      </Select>
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* label과 htmlFor/labelId 연결 */}
      <div>
        <label
          id="a11y-role-label"
          htmlFor="a11y-role-select"
          style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}
        >
          User role
        </label>
        <Select
          id="a11y-role-select"
          labelId="a11y-role-label"
          defaultValue="viewer"
          aria-describedby="a11y-role-hint"
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="editor">Editor</MenuItem>
          <MenuItem value="viewer">Viewer</MenuItem>
        </Select>
        <p id="a11y-role-hint" style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
          Admins have full access to all settings.
        </p>
      </div>
      {/* required */}
      <div>
        <label
          id="a11y-tz-label"
          htmlFor="a11y-tz-select"
          style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}
        >
          Timezone{' '}
          <span aria-hidden="true" style={{ color: '#c00' }}>
            *
          </span>
        </label>
        <Select
          id="a11y-tz-select"
          labelId="a11y-tz-label"
          required
          placeholder="Select a timezone"
        >
          <MenuItem value="utc">UTC</MenuItem>
          <MenuItem value="est">Eastern (EST)</MenuItem>
          <MenuItem value="pst">Pacific (PST)</MenuItem>
        </Select>
      </div>
      {/* error */}
      <div>
        <label
          id="a11y-status-label"
          htmlFor="a11y-status-select"
          style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}
        >
          Status
        </label>
        <Select
          id="a11y-status-select"
          labelId="a11y-status-label"
          error
          defaultValue=""
          aria-describedby="a11y-status-error"
        >
          <MenuItem value="">Select status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
        <p id="a11y-status-error" style={{ fontSize: '12px', color: '#c00', margin: '4px 0 0' }}>
          Please select a valid status.
        </p>
      </div>
    </div>
  ),
};

/**
 * select-only combobox 의 키보드·포커스 계약.
 *
 * DOM 포커스는 끝까지 trigger 에 남고, 목록 안의 위치는 `aria-activedescendant` 로 알린다.
 * 단위 테스트가 규칙을 고정하고, 이 스토리는 실제 브라우저에서 같은 경로를 한 번 돈다.
 */
export const KeyboardInteraction: Story = {
  render: () => (
    <div style={{ minHeight: '240px' }}>
      <Select aria-label="Framework" defaultValue="react">
        <MenuItem value="react">React</MenuItem>
        <MenuItem value="vue" disabled>
          Vue (unavailable)
        </MenuItem>
        <MenuItem value="svelte">Svelte</MenuItem>
        <MenuItem value="solid">Solid</MenuItem>
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Framework' });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    const [react, , svelte] = canvas.getAllByRole('option');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-activedescendant', react.id);

    // disabled 옵션(Vue)은 건너뛴다.
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger).toHaveAttribute('aria-activedescendant', svelte.id);

    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(trigger).toHaveTextContent('Svelte');
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  },
};

/** 열린 목록의 선택·활성(outline)·비활성 옵션. axe 와 Chromatic 이 열린 상태를 보게 한다. */
export const OpenWithStates: Story = {
  render: () => (
    <div style={{ minHeight: '240px' }}>
      <Select aria-label="Account status" defaultOpen defaultValue="active">
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="suspended" disabled>
          Suspended (unavailable)
        </MenuItem>
      </Select>
    </div>
  ),
};

/** 값은 소비자가 소유한다 — `onChange` 의 `event.target.value` 로 갱신한다. */
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<unknown>('weekly');
    return (
      <div style={columnStyle}>
        <Select
          aria-label="Report period"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--ds-text-light)' }}>
          Selected value: {String(value)}
        </p>
      </div>
    );
  },
};

/** 모든 테마에서 trigger 상태(평상시·오류·비활성)와 열린 목록을 한 장에 담는다. */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {(theme) => (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-start',
            minHeight: '200px',
          }}
        >
          <Select aria-label={`Status (${theme})`} defaultValue="active">
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
          <Select aria-label={`Status invalid (${theme})`} error defaultValue="active">
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
          <Select aria-label={`Status disabled (${theme})`} disabled defaultValue="active">
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
          <Select aria-label={`Status open (${theme})`} defaultOpen defaultValue="active">
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="suspended" disabled>
              Suspended
            </MenuItem>
          </Select>
        </div>
      )}
    </ThemeGallery>
  ),
};
