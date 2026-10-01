import type { Meta, StoryObj } from '@storybook/react-vite';

import { outlineOf } from '../markdown/outline';
import { parseMarkdown } from '../markdown/parse';

import { DocumentLayout } from './document-layout';

const SOURCE = `# 예시 문서

## 개요

이 문서는 \`DocumentLayout\` 을 보이기 위한 예시다. 본문이 충분히 길어야 옆 목차가 스크롤을 따라오는 것을
볼 수 있다.

## 원칙

- 짧고 분명하게 쓴다
- 근거 없는 주장을 하지 않는다

### 세부 항목

문단이 이어진다. 컨테이너 폭(\`@container\`)이 넓으면 목차가 옆에 붙박이로 서고, 좁으면 본문 위에
\`<details>\` 로 접힌다.

## 검증

값이 없으면 없다고 말한다.
`;

const OUTLINE = outlineOf(parseMarkdown(SOURCE).slice(1));

const meta = {
  title: 'Doc/DocumentLayout',
  component: DocumentLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    outline: OUTLINE,
    children: (
      <article className="flex max-w-[46rem] flex-col gap-md typo-body-small">
        <p>본문 내용은 여기 온다. 실제로는 DocContent 가 markdown 을 그린다.</p>
        <p>컨테이너 폭이 `@3xl` 이상이면 오른쪽에 목차가 붙박이로 선다.</p>
      </article>
    ),
  },
  argTypes: {
    children: { control: false },
  },
} satisfies Meta<typeof DocumentLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기준은 화면이 아니라 작업 영역의 컨테이너 폭이다 — 이야기 iframe 을 늘이고 줄여서 확인한다. */
export const Playground: Story = {
  parameters: {
    // 기존 위반 baseline — 옆 목차(DocToc)의 터치 영역 문제를 그대로 물려받는다. `doc-toc.stories.tsx` 참고.
    a11y: { disable: true },
  },
};

/** 목차가 없는 문서(`##` 절이 없음)는 틀 없이 본문만 그대로 돌려준다. */
export const NoOutline: Story = {
  args: { outline: [] },
};
