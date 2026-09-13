import { themes, Web } from '@berrypjh/ui-core';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeGallery, themeGalleryParameters } from '../../.storybook/ThemeGallery';

/**
 * 색 팔레트 — 등록된 **모든 테마**의 색 토큰을 계열로 묶어 본다.
 *
 * 값을 이 파일에 적지 않는다. `Web` 은 design-tokens 산출물을 ui-core 가 그대로 통과시킨 것이고
 * 테마별 트리(`Web.Light`·`Web.Dark` …)를 갖는다. 그래서 각 테마의 **정확한 값**을 그대로 읽는다 —
 * CSS 변수 이름을 경로에서 유도하지 않는다. 유도 규칙은 카테고리마다 어긋난다 (`spacing.md` 의
 * 변수는 `--ds-md` 가 아니라 `--ds-spacing-md` 다).
 *
 * 테마 목록도 손으로 적지 않는다 — `themes` 레지스트리를 순회하므로 테마가 늘면 함께 는다.
 *
 * primitive 램프와 시맨틱 역할은 **키 모양**으로 가른다 (`ne100` 처럼 두 글자 + 세 자리면 램프).
 * 계열 이름 목록을 박아 두면 토큰에 계열이 늘 때 이 story 만 조용히 낡는다.
 *
 * 테마 갤러리를 쓰므로 상단 테마 토글은 이 story 에 영향을 주지 않는다 — 일부러 그렇다.
 * 한 테마만 보여주면서 값은 고정으로 읽으면 토글을 따르는 척하는 화면이 된다.
 */
const RAMP_STEP = /^[a-z]{2}\d{3}$/;

type Entries = Record<string, string>;
type ColorTree = Record<string, Entries>;

/** `light` → `Light`. genTsTokens 가 첫 글자만 대문자로 바꿔 namespace 를 만든다. */
const namespaceOf = (theme: string) => `${theme[0]?.toUpperCase() ?? ''}${theme.slice(1)}`;

const colorTreeOf = (theme: string): ColorTree => {
  const namespaces = Web as unknown as Record<string, { tokens: { color: ColorTree } } | undefined>;
  return namespaces[namespaceOf(theme)]?.tokens.color ?? {};
};

const isRamp = (entries: Entries) => Object.keys(entries).every((key) => RAMP_STEP.test(key));

const Family = ({ name, entries }: { name: string; entries: Entries }) => {
  const ramp = isRamp(entries);

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <strong style={{ fontSize: 'var(--ds-body-small-strong-font-size)' }}>{name}</strong>
      {/* 램프는 단계 변화를 보려면 한 줄로 이어져야 한다. 좁으면 가로 스크롤로 남기고 칩을 줄이지 않는다. */}
      <div
        style={{
          display: 'flex',
          flexWrap: ramp ? 'nowrap' : 'wrap',
          gap: '8px',
          overflowX: ramp ? 'auto' : 'visible',
        }}
      >
        {Object.entries(entries).map(([key, value]) => (
          <div key={key} style={{ width: '84px', flexShrink: 0, display: 'grid', gap: '2px' }}>
            {/* 색 칩은 장식이다 — 이름과 값은 아래 글자가 가진다. 색만으로 뜻을 전달하지 않는다. */}
            <span
              aria-hidden
              style={{
                display: 'block',
                height: '40px',
                background: value,
                borderRadius: 'var(--ds-radius-xs)',
                border: '1px solid var(--ds-stroke-light)',
              }}
            />
            <span style={{ fontSize: 'var(--ds-body-tiny-font-size)', wordBreak: 'break-all' }}>
              {key}
            </span>
            <code
              style={{ fontSize: 'var(--ds-body-tiny-font-size)', color: 'var(--ds-text-light)' }}
            >
              {value}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
};

const Group = ({ note, families }: { note: string; families: [string, Entries][] }) => (
  <section style={{ display: 'grid', gap: '12px' }}>
    <em style={{ fontSize: 'var(--ds-body-tiny-font-size)', color: 'var(--ds-text-light)' }}>
      {note}
    </em>
    {families.map(([name, entries]) => (
      <Family key={name} name={name} entries={entries} />
    ))}
  </section>
);

const Palette = ({ theme }: { theme: string }) => {
  const families = Object.entries(colorTreeOf(theme));

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <Group
        note="Primitive 램프 — 컴포넌트는 직접 참조하지 않는다"
        families={families.filter(([, entries]) => isRamp(entries))}
      />
      <Group
        note="시맨틱 역할 — 컴포넌트가 실제로 참조한다"
        families={families.filter(([, entries]) => !isRamp(entries))}
      />
    </div>
  );
};

const meta = {
  title: 'Foundation/Color Palette',
  parameters: {
    ...themeGalleryParameters,
    docs: {
      description: {
        component: `등록된 ${themes.length}개 테마의 색 토큰. 값은 design-tokens 산출물에서 읽으므로 토큰이 바뀌면 함께 바뀐다.`,
      },
    },
  },
} satisfies Meta;

export default meta;

/** 모든 테마를 세로로 쌓아 비교한다. 테마마다 램프가 어디까지 재정의됐는지가 드러난다. */
export const AllThemes: StoryObj = {
  name: 'All themes',
  render: () => <ThemeGallery>{(theme) => <Palette theme={theme} />}</ThemeGallery>,
};
