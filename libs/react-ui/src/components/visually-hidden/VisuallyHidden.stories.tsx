import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Stack } from '../stack/Stack';

import { VisuallyHidden } from './VisuallyHidden';

/**
 * `VisuallyHidden` 은 **시각에서만** 지우고 접근성 트리에는 남긴다.
 *
 * 그래서 story 는 "보이는 것"이 아니라 **읽히는 이름**을 보여준다. 아래 예시들은 화면에서
 * 아무것도 달라 보이지 않지만, 접근성 패널(또는 스크린리더)에서 컨트롤의 이름이 생긴다.
 *
 * 포커스로 드러나는 story 는 없다 — 그 동작은 `SkipLink` 의 책임이다. 포커스 가능한 자식을
 * 감싸는 예시도 두지 않는다: 키보드로는 갈 수 있는데 끝까지 보이지 않는 상태가 되기 때문이다.
 */
const meta = {
  title: 'Components/Utility/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<typeof meta>;

const noteStyle: CSSProperties = {
  color: 'var(--ds-text-light)',
  fontSize: 'var(--ds-body-small-font-size)',
  lineHeight: 'var(--ds-body-small-line-height)',
  margin: 0,
};

const Note = ({ children }: { children: ReactNode }) => <p style={noteStyle}>{children}</p>;

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 아이콘만 있는 컨트롤에 읽을 이름을 준다.
 *
 * 아이콘은 `aria-hidden` 으로 접근성 트리에서 빼고, 이름은 숨은 글자가 만든다. `aria-label`
 * 과 달리 실제 텍스트 노드라서 브라우저 번역·페이지 내 검색에 걸린다.
 *
 * **라이브러리의 `IconButton` 에는 이 패턴이 필요 없다** — 그쪽은 타입이 `aria-label` 또는
 * `aria-labelledby` 를 **강제**해서 이름 없는 상태를 아예 만들 수 없다. VisuallyHidden 이
 * 필요한 곳은 그런 강제가 없는 호스트 요소(`<button>`·`<th>` 등)다.
 */
export const IconOnlyControl: Story = {
  args: { children: '삭제' },
  render: (args) => (
    <Stack gap="md" align="start">
      <button type="button">
        <TrashIcon />
        <VisuallyHidden {...args} />
      </button>
      <Note>버튼에 보이는 글자는 없지만 접근 가능한 이름은 “삭제” 다.</Note>
    </Stack>
  ),
};

/**
 * 보이는 글자에 맥락을 덧붙인다.
 *
 * 목록에 “더 보기” 버튼이 여러 개면 스크린리더 사용자는 어느 항목의 버튼인지 알 수 없다.
 * 보충 설명을 숨은 글자로 붙이면 화면은 그대로 두고 이름만 구별된다.
 */
export const SupplementaryContext: Story = {
  args: { children: '(2024년 매출 보고서)' },
  render: (args) => (
    <Stack gap="md" align="start">
      <button type="button">
        더 보기
        <VisuallyHidden {...args} />
      </button>
      <Note>화면에는 “더 보기”, 읽히는 이름은 “더 보기(2024년 매출 보고서)” 다.</Note>
    </Stack>
  ),
};

/**
 * 표의 열 제목처럼 **시각적으로는 자명하지만 낭독에는 필요한** 글자.
 *
 * 아이콘 열은 보는 사람에게 설명이 필요 없지만, 헤더 셀이 비어 있으면 스크린리더가 그 열을
 * 이름 없이 읽는다.
 */
export const TableColumnHeader: Story = {
  args: { children: '작업' },
  render: (args) => (
    <Stack gap="md" align="start">
      <table>
        <thead>
          <tr>
            <th scope="col">파일</th>
            <th scope="col">
              <VisuallyHidden {...args} />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>보고서.pdf</td>
            <td>
              <button type="button">
                <TrashIcon />
                <VisuallyHidden>보고서.pdf 삭제</VisuallyHidden>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Note>둘째 열 제목은 보이지 않지만 “작업” 으로 읽힌다.</Note>
    </Stack>
  ),
};
