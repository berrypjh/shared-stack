import type { Meta, StoryObj } from '@storybook/react-vite';

import { bodyOf } from '../markdown/outline';
import { parseMarkdown } from '../markdown/parse';

import { DocContent, type RenderLink } from './doc-content';

const SOURCE = `# 예시 문서

문서 한 편의 원문을 그대로 옮긴 예시다. **굵게**, *기울임*, \`code\`, [링크](/documents/root-readme)를 담는다.

## 원칙

- 짧고 분명하게 쓴다
- 근거 없는 주장을 하지 않는다
  - 값이 없으면 없다고 말한다
1. 탐색
2. 재사용
3. 검증

## 표

| 항목 | 위치 |
| --- | --- |
| 토큰 | libs/design-tokens |
| UI | libs/react-ui |

## 코드

\`\`\`ts
export const add = (a: number, b: number) => a + b;
\`\`\`

> 인용: 문서는 build 시점에 원문을 그대로 묶는다.

---

![외부 이미지](https://example.com/missing.png)
`;

/** 앱이 링크를 어디로 보낼지 정한다 — 여기서는 http(s) 만 새 창으로, 나머지는 평범한 글로 보인다. */
const renderLink: RenderLink = (href, children) =>
  /^https?:/.test(href) ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );

const meta = {
  title: 'Doc/DocContent',
  component: DocContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    blocks: bodyOf(parseMarkdown(SOURCE)),
    title: '예시 문서',
    renderLink,
  },
  argTypes: {
    blocks: { control: false },
    renderLink: { control: false },
  },
} satisfies Meta<typeof DocContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** HTML 을 주입하지 않는다 — 모든 글이 React 텍스트 노드다. 코드 블록에는 복사 버튼이 붙는다. */
export const Playground: Story = {};

/** 체크 목록. 입력처럼 보이지만 조작할 수 없는 것을 만들지 않는다 — 글리프 + 숨은 글로만 상태를 말한다. */
export const ChecklistDocument: Story = {
  args: {
    blocks: bodyOf(
      parseMarkdown(`# 할 일

- [x] tsconfig.storybook.json 추가
- [x] .storybook 설정
- [ ] Chromatic 연결(별도 결정)
`),
    ),
    title: '할 일',
  },
};
