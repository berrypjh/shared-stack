import { CSSProperties, ReactNode } from 'react';

import { cssVarOf } from '../presentation/tokenCatalog';
import { Page, Section } from '../shell/ui';
import { useCurrentTheme } from '../verification/useCurrentTheme';

import { PreviewFill, TokenCard, TokenGrid } from './TokenCard';
import {
  leavesOf,
  membersOf,
  type PreviewKind,
  SCALE_SECTIONS,
  type ScaleFamily,
  type ScaleMember,
  shadowLayers,
  valueOf,
} from './tokenScales';

/**
 * 색 밖의 토큰을 팔레트와 같은 카드로 본다.
 *
 * `/tokens` 는 전체를 표로 찾는 자리이고, 여기는 스케일의 단계 변화를 한눈에 보는 자리다.
 * 미리보기는 값을 그대로 그린다 — 카드 폭(약 110px)을 넘는 값(`spacing.7xl`)은 잘린다.
 * 값과 CSS 변수는 공개 token artifact 에서 읽고, 합성 토큰은 단일 변수가 catalog 에 없어
 * 변수를 보여주지 않는다.
 */

const Sample = ({ text = 'Ag', style }: { text?: string; style: CSSProperties }) => (
  <span className="text-text-default leading-none whitespace-nowrap" style={style}>
    {text}
  </span>
);

const Moving = ({ style }: { style: CSSProperties }) => (
  <div className="w-full px-sm">
    <span
      className="block w-[10px] h-[10px] rounded-xs bg-background-primary token-motion"
      style={style}
    />
  </div>
);

const LengthPreview = ({ value }: { value: string }) =>
  value.trim().includes(' ') ? (
    // padding 축약은 안쪽 여백이 보여야 읽힌다.
    <span
      className="rounded-xs border border-stroke-light bg-background-surface"
      style={{ padding: value }}
    >
      <span className="block w-[20px] h-[10px] rounded-xs bg-background-primary" />
    </span>
  ) : (
    <div className="w-full px-sm">
      <span className="block h-[8px] rounded-xs bg-background-primary" style={{ width: value }} />
    </div>
  );

const LeafPreview = ({ kind, value }: { kind: PreviewKind; value: string }) => {
  switch (kind) {
    case 'radius':
      return (
        <span className="w-[56px] h-[40px] bg-background-grey" style={{ borderRadius: value }} />
      );
    case 'borderWidth':
      return (
        <span
          className="w-[56px] h-[40px] border-stroke-dark"
          style={{ borderStyle: 'solid', borderWidth: value }}
        />
      );
    case 'fontSize':
      return <Sample style={{ fontSize: value }} />;
    case 'fontWeight':
      return <Sample style={{ fontSize: '1.5rem', fontWeight: value }} />;
    case 'lineHeight':
      // 한 줄 상자의 높이가 곧 line-height 다.
      return (
        <span
          className="w-[56px] bg-background-surface text-center text-text-default text-xxsm"
          style={{ lineHeight: value }}
        >
          Ag
        </span>
      );
    case 'letterSpacing':
      return <Sample text="가나 Ag" style={{ fontSize: '1rem', letterSpacing: value }} />;
    case 'fontFamily':
      return <Sample text="가나 Ag" style={{ fontSize: '1.25rem', fontFamily: value }} />;
    case 'duration':
      return <Moving style={{ animationDuration: value }} />;
    case 'easing':
      return <Moving style={{ animationDuration: '1s', animationTimingFunction: value }} />;
    default:
      return <LengthPreview value={value} />;
  }
};

const compositeView = (
  kind: PreviewKind,
  ids: readonly string[],
  theme: string,
): { preview: ReactNode; value: string } => {
  if (kind === 'shadow') {
    const layers = shadowLayers(ids, theme);
    return {
      value: `${layers.length}개 층`,
      preview: (
        <span
          className="w-[56px] h-[40px] rounded-sm bg-background-surface"
          style={{ boxShadow: layers.join(', ') }}
        />
      ),
    };
  }

  const leaves = leavesOf(ids, theme);
  if (kind === 'border') {
    return {
      value: `${leaves.width} ${leaves.color}`,
      preview: (
        <span
          className="w-[56px] h-[40px] rounded-xs"
          style={{ border: `${leaves.width} solid ${leaves.color}` }}
        />
      ),
    };
  }

  // 글자 스타일의 잎 이름(fontSize · lineHeight …)은 그대로 CSS 속성이다.
  return {
    value: `${leaves.fontSize} · ${leaves.fontWeight}`,
    preview: <Sample style={leaves as CSSProperties} />,
  };
};

const ScaleCard = ({
  family,
  member,
  theme,
}: {
  family: ScaleFamily;
  member: ScaleMember;
  theme: string;
}) => {
  const testId = `scale-card-${family.prefix}.${member.key}`;
  const id = member.ids[0] ?? '';
  const view = family.composite
    ? compositeView(family.preview, member.ids, theme)
    : (() => {
        const value = valueOf(id, theme) ?? '—';
        return { value, preview: <LeafPreview kind={family.preview} value={value} /> };
      })();

  return (
    <TokenCard
      testId={testId}
      name={member.key}
      value={view.value}
      cssVar={family.composite ? undefined : cssVarOf(id)}
      preview={<PreviewFill className="bg-background-default">{view.preview}</PreviewFill>}
    />
  );
};

const Family = ({ family, theme }: { family: ScaleFamily; theme: string }) => (
  <div>
    {family.label && (
      <h3 className="text-text-default text-xsm font-semiBold mb-sm">{family.label}</h3>
    )}
    <TokenGrid>
      {membersOf(family, theme).map((member) => (
        <ScaleCard key={member.key} family={family} member={member} theme={theme} />
      ))}
    </TokenGrid>
  </div>
);

export const ScalesPage = () => {
  const theme = useCurrentTheme();

  return (
    <Page
      title="Scales"
      lead="간격 · 모서리 · 테두리 · 글자 · 그림자 · 움직임 토큰. 값은 현재 테마 기준이다"
      testId="scales-page"
    >
      {SCALE_SECTIONS.map((section) => (
        <Section key={section.title} title={section.title} note={section.note}>
          <div className="flex flex-col gap-xl">
            {section.families.map((family) => (
              <Family key={family.prefix} family={family} theme={theme} />
            ))}
          </div>
        </Section>
      ))}
    </Page>
  );
};
