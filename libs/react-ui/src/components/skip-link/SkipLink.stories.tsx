import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { SkipLink } from './SkipLink';

const meta = {
  title: 'Components/SkipLink',
  component: SkipLink,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    targetId: 'main-content',
    children: '본문으로 건너뛰기',
  },
  argTypes: {
    targetId: { control: 'text' },
    children: { control: 'text' },
    className: { control: false },
    style: { control: false },
    ref: { control: false },
  },
} satisfies Meta<typeof SkipLink>;

export default meta;

type Story = StoryObj<typeof meta>;

const layoutStyle = {
  display: 'grid',
  gap: '12px',
};

const region = {
  border: '1px dashed var(--ds-stroke-default)',
  padding: '24px',
  borderRadius: 'var(--ds-radius-sm)',
} as const;

export const Playground: Story = {
  render: (args) => (
    <div style={layoutStyle}>
      <header style={region}>
        <SkipLink {...args} />
        Header (반복 영역)
      </header>
      {/*
        대상은 소비자가 소유한다. `tabIndex={-1}` 이 있어야 fragment 이동이 실제로 포커스를
        옮긴다 — 없으면 순차 포커스 시작점만 바뀐다.
      */}
      <main id="main-content" style={region} tabIndex={-1}>
        Main content. Tab 키로 페이지에 진입해 SkipLink가 노출되는지 확인합니다.
      </main>
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    <div style={layoutStyle}>
      <header style={region}>
        <SkipLink targetId="main-default">본문으로 건너뛰기</SkipLink>
        Header
      </header>
      <main id="main-default" style={region} tabIndex={-1}>
        Main content
      </main>
    </div>
  ),
};

/**
 * Bypass Blocks 의 전체 경로를 한 번에 돈다 (WCAG 2.4.1).
 *
 * Tab 으로 링크가 포커스를 받고 → 숨은 상태에서 드러나고 → Enter 로 fragment 이동이
 * 일어나고 → 대상이 포커스를 받는다. 마지막 단계는 대상의 `tabIndex={-1}` 덕분이다.
 */
export const KeyboardBypass: Story = {
  render: () => (
    <div style={layoutStyle}>
      <header style={region}>
        <SkipLink targetId="main-bypass">본문으로 건너뛰기</SkipLink>
        Header (반복 영역)
      </header>
      <main id="main-bypass" style={region} tabIndex={-1}>
        <h2>Main content</h2>
        <button type="button">본문 첫 컨트롤</button>
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: '본문으로 건너뛰기' });

    // 1. 포커스 전에는 시각적으로 숨어 있다.
    await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(2);

    // 2. 첫 Tab 이 우회 링크에 닿는다 — 그것이 이 컴포넌트의 존재 이유다.
    await userEvent.tab();
    await expect(link).toHaveFocus();

    // 3. 포커스를 받으면 드러난다 (WCAG 2.4.7). 레이아웃 재계산을 기다린다.
    await waitFor(() => expect(link.getBoundingClientRect().width).toBeGreaterThan(2));
    await expect(getComputedStyle(link).outlineStyle).not.toBe('none');

    // 4. 대상 계약: href 가 실제로 존재하는 포커스 가능한 element 를 가리킨다.
    const target = canvasElement.querySelector<HTMLElement>('#main-bypass');
    await expect(link).toHaveAttribute('href', '#main-bypass');
    await expect(target).not.toBeNull();
    await expect(target).toHaveAttribute('tabindex', '-1');

    // 5. Enter 로 이동하면 대상이 포커스를 받는다 — 4번의 `tabIndex={-1}` 덕분이다.
    //    fragment 이동은 브라우저가 수행하므로 단언 시점보다 늦을 수 있다.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(target).toHaveFocus());
  },
};

export const MultipleTargets: Story = {
  render: () => (
    <div style={layoutStyle}>
      <header style={region}>
        <SkipLink targetId="multi-main">본문으로 건너뛰기</SkipLink>
        <SkipLink targetId="multi-nav">내비게이션으로 건너뛰기</SkipLink>
        Header
      </header>
      <nav id="multi-nav" style={region} tabIndex={-1} aria-label="Primary">
        Navigation
      </nav>
      <main id="multi-main" style={region} tabIndex={-1}>
        Main content
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 두 링크가 각자의 대상을 가리키고 탭 순서에서 이어진다.
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveFocus();

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: '내비게이션으로 건너뛰기' })).toHaveFocus();
  },
};

export const A11y: Story = {
  render: () => (
    <div style={layoutStyle}>
      <header style={region}>
        {/* 접근 가능한 이름이 보이는 텍스트를 포함한다 (WCAG 2.5.3 Label in Name). */}
        <SkipLink targetId="a11y-main" aria-label="페이지 본문으로 건너뛰기">
          본문으로 건너뛰기
        </SkipLink>
        Header
      </header>
      <main id="a11y-main" style={region} tabIndex={-1}>
        Main content
      </main>
    </div>
  ),
};

/**
 * 고정 헤더 아래로 대상이 가리지 않게 하는 소비자 계약 (WCAG 2.4.11 Focus Not Obscured).
 *
 * 헤더 높이는 앱이 알고 이 컴포넌트는 모른다. 그래서 오프셋은 **대상 쪽**
 * `scroll-margin-block-start` 가 갖는다 — 여기서 헤더 높이를 추측하거나 전역 토큰을
 * 만들지 않는다.
 */
export const StickyHeaderTarget: Story = {
  render: () => (
    <div style={{ ...layoutStyle, position: 'relative', blockSize: '320px', overflow: 'auto' }}>
      <header
        style={{
          ...region,
          position: 'sticky',
          insetBlockStart: 0,
          zIndex: 10,
          background: 'var(--ds-background-surface)',
        }}
      >
        <SkipLink targetId="sticky-main">본문으로 건너뛰기</SkipLink>
        고정 헤더
      </header>
      <div style={{ ...region, blockSize: '240px' }}>반복되는 내비게이션 영역</div>
      <main id="sticky-main" style={{ ...region, scrollMarginBlockStart: '96px' }} tabIndex={-1}>
        Main content — `scroll-margin-block-start` 로 헤더 아래에서 시작합니다.
      </main>
    </div>
  ),
};

/**
 * RTL. 위치는 `inset-inline-start`·`inset-block-start` 라 방향을 따라 반대편으로 간다.
 *
 * 기하 단언은 두지 않는다 — 뷰포트 폭에 흔들린다. 논리 속성을 쓴다는 **규칙 자체**는
 * `SkipLink.test.tsx` 의 컴파일된 CSS 검사가 지키고, 이 스토리는 눈으로 보는 회귀면이다.
 */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" style={layoutStyle}>
      <header style={region}>
        <SkipLink targetId="rtl-main">تخطي إلى المحتوى</SkipLink>
        رأس الصفحة
      </header>
      <main id="rtl-main" style={region} tabIndex={-1}>
        المحتوى الرئيسي
      </main>
    </div>
  ),
};

/**
 * 좁은 뷰포트에서 드러난 링크가 화면 밖으로 나가거나 글자가 잘리지 않는지 보는 면.
 *
 * 현재 `white-space: nowrap` 이라 아주 긴 라벨은 가로로 넘칠 수 있다. 재현 가능한 문제가
 * 확인되기 전에는 CSS 를 바꾸지 않는다 — 이 스토리가 그 판단의 근거면이다.
 */
export const NarrowViewport: Story = {
  parameters: {
    viewport: { value: 'mobile' },
  },
  render: () => (
    <div style={layoutStyle}>
      <header style={region}>
        <SkipLink targetId="narrow-main">본문 콘텐츠 영역으로 바로 건너뛰기</SkipLink>
        Header
      </header>
      <main id="narrow-main" style={region} tabIndex={-1}>
        Main content
      </main>
    </div>
  ),
};
