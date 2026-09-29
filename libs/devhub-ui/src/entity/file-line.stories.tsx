import type { Meta, StoryObj } from '@storybook/react-vite';

import { CopyButton } from '../doc/copy-button';

import { FileLine, FileList } from './file-line';

const copy = (path: string) => <CopyButton text={path} label={`경로 복사: ${path}`} />;

const meta = {
  title: 'Entity/FileLine',
  component: FileLine,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <ul className="flex max-w-[24rem] flex-col gap-md">
        <Story />
      </ul>
    ),
  ],
  args: {
    name: '2026-09-16-exact-react-version-pins.md',
    folder: 'docs/records/',
    href: 'https://github.com/example/repo/blob/abc1234/docs/records/2026-09-16-exact-react-version-pins.md',
    linkDescription:
      '— docs/records/2026-09-16-exact-react-version-pins.md, 저장소에서 보기, 새 창',
    actions: copy('docs/records/2026-09-16-exact-react-version-pins.md'),
  },
  argTypes: {
    actions: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof FileLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 역할 글자와 인용한 symbol. */
export const WithLabelAndSymbols: Story = {
  args: {
    label: '설정',
    name: 'devhub-provider.tsx',
    folder: 'src/provider/',
    symbols: ['DevHubProvider', 'useDevHubLink'],
  },
};

/** 링크를 만들 수 없으면 이름은 글자로, 이유는 경고로. */
export const WithoutLink: Story = {
  args: {
    href: undefined,
    warning: '스냅샷 커밋에 없는 경로(커밋되지 않음) — 링크를 만들지 않았다',
  },
};

/** 묶음 제목 아래 왼쪽 선으로 모은 모양 — 상세 정보의 소스 · 테스트가 쓴다. */
export const Grouped: Story = {
  decorators: [],
  render: () => (
    <div className="flex max-w-[24rem] flex-col gap-md">
      <FileList title="저장소">
        <FileLine name="package.json" href="#" actions={copy('package.json')} />
      </FileList>
      <FileList title="mobile">
        <FileLine name="package.json" href="#" actions={copy('apps/mobile/package.json')} />
      </FileList>
    </div>
  ),
};
