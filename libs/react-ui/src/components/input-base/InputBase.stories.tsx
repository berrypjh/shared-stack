import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeGallery, themeGalleryParameters } from '../../../.storybook/ThemeGallery';
import { BoxedInput } from '../boxed-input';
import { FilledInput } from '../filled-input';
import { FormControl } from '../form-control';
import { PlainInput } from '../plain-input';

import { InputBase } from './InputBase';

const meta = {
  title: 'Components/Inputs/InputBase',
  component: InputBase,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'native `<input>`/`<textarea>` 하나를 감싸는 동작 원시입니다.',
          '',
          'prop은 두 요소로 갈립니다. 시맨틱·native 속성(`id`·`name`·`placeholder`·`required`·',
          '`disabled`·`readOnly`·`autoComplete`·`autoFocus`·`inputMode`·`enterKeyHint`와',
          '`aria-label`·`aria-labelledby`·`aria-describedby`·`aria-invalid`)은 native 요소로 갑니다.',
          '나머지 `div` prop은 래퍼에 남습니다 — native 요소에 직접 얹으려면 `inputProps`/',
          '`textareaProps`를 씁니다.',
          '',
          '`error`는 native 요소의 `aria-invalid`가 됩니다. 루트 `role`은 기본값이 `presentation`',
          '이고 소비자가 덮어쓸 수 있습니다.',
        ].join('\n'),
      },
    },
  },
  args: {
    placeholder: 'Enter value',
    size: 'md',
    color: 'primary',
    disabled: false,
    error: false,
    readOnly: false,
    required: false,
    multiline: false,
    fullWidth: false,
    type: 'text',
    'aria-label': 'Input',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    multiline: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    startAdornment: { control: false },
    endAdornment: { control: false },
    role: {
      control: 'text',
      description: '래퍼 div의 role. 기본값 `presentation`을 덮어쓸 수 있다.',
    },
    inputMode: {
      control: 'select',
      options: [undefined, 'text', 'numeric', 'decimal', 'tel', 'email', 'url', 'search'],
      description: 'native 요소로 전달된다 — 래퍼에 남으면 가상 키보드에 닿지 않는다.',
    },
    inputProps: { control: false },
    textareaProps: { control: false },
    inputRef: { control: false },
    children: { control: false },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof InputBase>;

export default meta;

type Story = StoryObj<typeof meta>;

const columnStyle = {
  display: 'grid',
  gap: '16px',
  minWidth: '320px',
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" />
  </svg>
);

export const Playground: Story = {
  render: (args) => <InputBase {...args} />,
};

export const Default: Story = {
  args: {
    placeholder: 'Enter your name',
    'aria-label': 'Name',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase size="sm" placeholder="Small (sm)" aria-label="Small input" />
      <InputBase size="md" placeholder="Medium (md)" aria-label="Medium input" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase color="primary" placeholder="Primary color" aria-label="Primary color input" />
      <InputBase
        color="secondary"
        placeholder="Secondary color"
        aria-label="Secondary color input"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Cannot edit this value',
    'aria-label': 'Disabled input',
  },
};

export const Error: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase
        error
        placeholder="Invalid email address"
        value="not-an-email"
        aria-label="Email address"
        aria-invalid="true"
      />
      <InputBase
        error
        placeholder="Required field is empty"
        aria-label="Required field"
        aria-invalid="true"
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: 'Read-only content',
    'aria-label': 'Read-only input',
  },
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field',
    id: 'required-input',
    'aria-label': 'Required field',
  },
};

export const Multiline: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase
        multiline
        placeholder="Write your message here..."
        rows={3}
        aria-label="Short message"
      />
      <InputBase multiline placeholder="Larger text area..." rows={6} aria-label="Long message" />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'grid', gap: '12px', width: '480px' }}>
      <InputBase fullWidth placeholder="Full width input" aria-label="Full width input" />
      <InputBase
        fullWidth
        size="sm"
        placeholder="Full width small"
        aria-label="Full width small input"
      />
    </div>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase
        startAdornment={<SearchIcon />}
        placeholder="Search projects..."
        aria-label="Search projects"
      />
      <InputBase
        endAdornment={<LockIcon />}
        type="password"
        placeholder="Enter password"
        aria-label="Password"
      />
      <InputBase
        startAdornment={<span style={{ fontSize: '13px', color: 'var(--ds-text-light)' }}>$</span>}
        endAdornment={<span style={{ fontSize: '13px', color: 'var(--ds-text-light)' }}>USD</span>}
        placeholder="0.00"
        type="number"
        aria-label="Amount in USD"
      />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase
        value="This is a very long input value that demonstrates how the component handles overflow and text truncation in single-line mode"
        aria-label="Long single-line value"
      />
      <InputBase
        multiline
        rows={4}
        value="This is a multiline input with a longer block of text. It can wrap across multiple lines and the component should handle the layout gracefully without breaking the design."
        aria-label="Long multiline value"
      />
    </div>
  ),
};

export const A11y: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase
        id="a11y-email"
        aria-label="Email address"
        type="email"
        placeholder="you@example.com"
        required
      />
      <InputBase
        id="a11y-search"
        aria-label="Search"
        startAdornment={<SearchIcon />}
        placeholder="Search..."
        type="search"
      />
      <InputBase
        id="a11y-notes"
        aria-label="Additional notes"
        aria-describedby="a11y-notes-hint"
        multiline
        rows={3}
        placeholder="Optional notes..."
      />
      <p
        id="a11y-notes-hint"
        style={{ fontSize: '12px', color: 'var(--ds-text-light)', margin: 0 }}
      >
        Notes are visible to your team only.
      </p>
      <InputBase aria-label="Disabled field" disabled value="Not editable" />
    </div>
  ),
};

/**
 * 포커스 chrome 은 CSS `:focus` 가 아니라 `InputBase` 가 관리하는 상태 클래스가 그린다.
 * 그래서 `play` 에서 실제로 포커스를 옮겨야 보인다 — 클래스를 손으로 붙이면 상태 기계를
 * 건너뛰고 시각만 흉내 내는 것이 된다.
 *
 * 평상시 필드를 옆에 둬서 대비를 함께 본다. Chromatic 은 `play` 이후를 찍으므로
 * 포커스 표시 자체가 시각 회귀 대상이 된다.
 */
export const Focused: Story = {
  render: () => (
    <div style={columnStyle}>
      <InputBase aria-label="Focused field" placeholder="Focused" />
      <InputBase aria-label="Resting field" placeholder="Resting" />
      <InputBase aria-label="Focused with error" placeholder="Focused + error" error />
    </div>
  ),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('input')?.focus();
  },
};

/**
 * 값의 주인이 누구인지 보여준다.
 *
 * `InputBase` 는 값을 내부에 복제하지 않는다 — `value` 를 주면 소비자가 유일한 권한이고,
 * `defaultValue` 만 주면 native input 이 소유한다. 두 모델을 나란히 두면 계약이 눈에 보인다.
 */
export const ControlledVsUncontrolled: Story = {
  render: function Render() {
    const [value, setValue] = useState('controlled');

    return (
      <div style={columnStyle}>
        <InputBase
          aria-label="Controlled value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <InputBase aria-label="Uncontrolled value" defaultValue="uncontrolled" />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--ds-text-light)' }}>
          controlled 값: {value || '(비어 있음)'}
        </p>
      </div>
    );
  },
};

/**
 * 등록된 모든 테마 × 세 variant × 대표 상태를 한 화면에 담는다.
 *
 * 갤러리를 variant 마다 따로 두지 않고 하나로 묶은 이유는, 회귀에서 보고 싶은 것이 "이 테마에서
 * plain·filled·boxed 가 **서로** 어떻게 다른가" 이기 때문이다. 따로 찍으면 그 비교가 사라진다.
 *
 * `focused` 는 `FormControl` 의 controlled prop 으로 켠다 — 상태를 흉내 내려고 클래스를 손으로
 * 붙이지 않는다. 그것이 실제 합성 계층이고, 스크린샷도 진짜 경로를 지나야 의미가 있다.
 *
 * 전체 곱을 만들지 않는다. 토큰이 갈라지는 자리(테두리·표면·halo·비활성)를 대표하는 상태만 둔다.
 */
export const ThemeMatrix: Story = {
  parameters: themeGalleryParameters,
  render: () => (
    <ThemeGallery>
      {(theme) => (
        <div style={{ display: 'grid', gap: '12px' }}>
          {(
            [
              ['plain', PlainInput],
              ['filled', FilledInput],
              ['boxed', BoxedInput],
            ] as const
          ).map(([variant, Input]) => (
            <div
              key={variant}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}
            >
              <FormControl>
                <Input aria-label={`${theme} ${variant} default`} placeholder="Default" />
              </FormControl>
              <FormControl focused>
                <Input aria-label={`${theme} ${variant} focused`} placeholder="Focused" />
              </FormControl>
              <FormControl error>
                <Input aria-label={`${theme} ${variant} error`} defaultValue="Invalid" />
              </FormControl>
              <FormControl disabled>
                <Input aria-label={`${theme} ${variant} disabled`} defaultValue="Locked" />
              </FormControl>
              <Input aria-label={`${theme} ${variant} read only`} readOnly defaultValue="Read" />
            </div>
          ))}
        </div>
      )}
    </ThemeGallery>
  ),
};
