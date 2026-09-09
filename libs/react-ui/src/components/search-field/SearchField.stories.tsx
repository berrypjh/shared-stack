import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchField } from './SearchField';
import type { SearchFieldSuggestion } from './SearchField.types';

const meta = {
  title: 'Components/SearchField',
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
      <SearchField aria-label="Search (disabled)" disabled placeholder="Search unavailable" />
    </div>
  ),
};
