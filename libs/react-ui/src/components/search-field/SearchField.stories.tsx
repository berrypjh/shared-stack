import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';

import { SearchField } from './SearchField';
import type { SearchFieldSuggestion } from './SearchField.types';

const meta = {
  title: 'Components/Inputs/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Search',
    variant: 'boxed',
    size: 'md',
    color: 'primary',
    clearable: true,
    clearAriaLabel: 'Clear search',
    disabled: false,
    error: false,
    readOnly: false,
    fullWidth: false,
    'aria-label': 'Search',
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
    readOnly: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    clearable: { control: 'boolean' },
    clearAriaLabel: { control: 'text' },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    onClear: { action: 'cleared' },
    onValueChange: { action: 'valueChanged' },
    onSuggestionSelect: { action: 'suggestionSelected' },
    suggestions: { control: false },
    noSuggestionsText: { control: false },
    inputProps: { control: false },
    inputRef: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const projectSuggestions: SearchFieldSuggestion[] = [
  { id: '1', label: 'Dashboard', description: 'Main overview page' },
  { id: '2', label: 'Analytics', description: 'Usage metrics and reports' },
  { id: '3', label: 'Settings', description: 'Account and workspace settings' },
  { id: '4', label: 'Team members', description: 'Manage users and permissions' },
];

const simpleSuggestions: SearchFieldSuggestion[] = [
  { id: '1', label: 'React' },
  { id: '2', label: 'TypeScript' },
  { id: '3', label: 'Storybook' },
  { id: '4', label: 'Vite' },
];

const suggestionsWithDisabled: SearchFieldSuggestion[] = [
  { id: '1', label: 'Active project' },
  { id: '2', label: 'Archived project', disabled: true },
  { id: '3', label: 'Another active project' },
  { id: '4', label: 'Locked project', disabled: true },
];

export const Playground: Story = {
  render: (args) => (
    <div style={{ minWidth: '320px' }}>
      <SearchField {...args} />
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <SearchField placeholder="Search projects..." aria-label="Search projects" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={columnStyle}>
      <SearchField variant="plain" placeholder="Plain variant" aria-label="Search (plain)" />
      <SearchField variant="filled" placeholder="Filled variant" aria-label="Search (filled)" />
      <SearchField variant="boxed" placeholder="Boxed variant" aria-label="Search (boxed)" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <SearchField size="sm" placeholder="Small (sm)" aria-label="Small search" />
      <SearchField size="md" placeholder="Medium (md)" aria-label="Medium search" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <SearchField color="primary" placeholder="Primary color" aria-label="Primary color search" />
      <SearchField
        color="secondary"
        placeholder="Secondary color"
        aria-label="Secondary color search"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <SearchField disabled placeholder="Search is disabled" aria-label="Search (disabled)" />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <SearchField
        error
        defaultValue="invalid??query"
        placeholder="Search"
        aria-label="Search"
        aria-invalid="true"
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <SearchField readOnly value="TypeScript" aria-label="Read-only search" />
    </div>
  ),
};

export const WithSuggestions: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--ds-text-light)',
          marginBottom: '8px',
          marginTop: 0,
        }}
      >
        Click or focus the input to see suggestions.
      </p>
      <SearchField
        placeholder="Search pages..."
        aria-label="Search pages"
        suggestions={simpleSuggestions}
        onSuggestionSelect={(s) => console.log('selected', s)}
      />
    </div>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--ds-text-light)',
          marginBottom: '8px',
          marginTop: 0,
        }}
      >
        Click or focus the input to see suggestions with descriptions.
      </p>
      <SearchField
        placeholder="Search features..."
        aria-label="Search features"
        suggestions={projectSuggestions}
        onSuggestionSelect={(s) => console.log('selected', s)}
      />
    </div>
  ),
};

export const WithDisabledSuggestion: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--ds-text-light)',
          marginBottom: '8px',
          marginTop: 0,
        }}
      >
        Some suggestions are disabled and cannot be selected.
      </p>
      <SearchField
        placeholder="Search projects..."
        aria-label="Search projects"
        suggestions={suggestionsWithDisabled}
        onSuggestionSelect={(s) => console.log('selected', s)}
      />
    </div>
  ),
};

export const WithNoSuggestionsText: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <p
        style={{
          fontSize: '12px',
          color: 'var(--ds-text-light)',
          marginBottom: '8px',
          marginTop: 0,
        }}
      >
        Focus the input to see the empty state message.
      </p>
      <SearchField
        placeholder="Search..."
        aria-label="Search"
        suggestions={[]}
        noSuggestionsText="No results found"
      />
    </div>
  ),
  // 빈 상태는 focus 해야 그려진다. 선택할 수 없는 안내라 option 이 아니라 status 로 나온다.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Search' });

    await userEvent.click(input);

    await expect(canvas.getByRole('status')).toHaveTextContent('No results found');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '480px' }}>
      <SearchField fullWidth placeholder="Full width search" aria-label="Full width search" />
      <SearchField
        fullWidth
        size="sm"
        placeholder="Full width small"
        aria-label="Full width small search"
        suggestions={simpleSuggestions}
      />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <SearchField
        defaultValue="This is a very long search query that tests overflow handling in single line mode"
        placeholder="Search..."
        aria-label="Long search query"
      />
      <SearchField
        placeholder="Search across all projects, workspaces, and team members..."
        aria-label="Search across projects, workspaces, and team members"
        suggestions={projectSuggestions}
      />
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      {/* combobox role은 자동으로 inputProps에 설정됨 */}
      <SearchField
        id="a11y-search-main"
        aria-label="Search across all pages"
        placeholder="Search..."
        suggestions={simpleSuggestions}
      />
      {/* aria-describedby로 힌트 연결 */}
      <SearchField
        id="a11y-search-hints"
        aria-label="Search projects"
        aria-describedby="a11y-search-hint"
        placeholder="Search projects..."
        suggestions={projectSuggestions}
        noSuggestionsText="No matching projects"
      />
      <p
        id="a11y-search-hint"
        style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}
      >
        Results update as you type.
      </p>
      <SearchField aria-label="Search (disabled)" disabled placeholder="Search unavailable" />
    </div>
  ),
};

/** 값이 있을 때만 이름 있는 지우기 버튼이 나온다. 이름은 소비자가 준다(`clearAriaLabel`). */
export const Clearable: Story = {
  render: () => (
    <div style={{ minWidth: '320px' }}>
      <SearchField
        aria-label="Search projects"
        clearable
        clearAriaLabel="Clear search"
        defaultValue="Dashboard"
      />
    </div>
  ),
};

const frameworkSuggestions: SearchFieldSuggestion[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue', disabled: true },
  { id: 'svelte', label: 'Svelte' },
  { id: 'solid', label: 'Solid' },
];

/**
 * list-autocomplete combobox 의 키보드·포커스 계약.
 *
 * DOM 포커스는 끝까지 입력에 남고, 활성 제안은 `aria-activedescendant` 로 알린다.
 * 단위 테스트가 규칙을 고정하고, 이 스토리는 실제 브라우저에서 같은 경로를 한 번 돈다 —
 * test-runner 가 play 를 실행한 뒤 axe 가 끝 상태를 검사한다.
 */
export const KeyboardInteraction: Story = {
  render: () => (
    <div style={{ minWidth: '320px', minHeight: '260px' }}>
      <SearchField
        aria-label="Search frameworks"
        placeholder="Search frameworks..."
        clearable
        clearAriaLabel="Clear search"
        suggestions={frameworkSuggestions}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Search frameworks' });

    await userEvent.click(input);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowDown}');
    const [react, , svelte] = canvas.getAllByRole('option');
    await expect(input).toHaveAttribute('aria-activedescendant', react.id);
    await expect(react).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveFocus();

    // disabled 제안(Vue)은 건너뛴다.
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveAttribute('aria-activedescendant', svelte.id);

    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('Svelte');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();

    await userEvent.type(input, 'S');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('listbox')).not.toBeInTheDocument();
    await expect(input).toHaveFocus();
  },
};

/**
 * 모든 테마에서 필드 상태(값·지우기 버튼·오류·비활성)를 한 장에 담는다.
 * 열린 제안 목록은 포커스가 있어야 그려져 정적 갤러리에 담을 수 없다 — `KeyboardInteraction` 이 맡는다.
 */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {(theme) => (
        <div style={{ display: 'grid', gap: '12px', maxWidth: '360px' }}>
          <SearchField
            aria-label={`Search (${theme})`}
            clearable
            clearAriaLabel={`Clear search (${theme})`}
            defaultValue="Dashboard"
          />
          <SearchField aria-label={`Search invalid (${theme})`} error defaultValue="??" />
          <SearchField aria-label={`Search disabled (${theme})`} disabled placeholder="Disabled" />
        </div>
      )}
    </ThemeGallery>
  ),
};
