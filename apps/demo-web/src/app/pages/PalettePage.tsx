import { resolveToken, tokenIdsInCategory } from '../presentation/tokenCatalog';
import { Mono, Page, Section, Swatch } from '../shell/ui';
import { useCurrentTheme } from '../verification/useCurrentTheme';

import { colorFamilies, type PaletteFamily, rampsOf, semanticOf } from './colorPalette';

/**
 * 색 팔레트.
 *
 * `/tokens` 는 565개 전체를 표로 훑는 자리이고, 여기는 **색만** 계열로 묶어 한눈에 보는 자리다.
 * 램프의 단계 변화와 시맨틱 역할의 관계는 표로는 보이지 않는다.
 *
 * 값과 CSS 변수를 이 파일에 적지 않는다 — 공개 token artifact 에서 읽는다. 색 칩은
 * `var(--ds-*)` 로 그려서 테마 전환이 CSS 캐스케이드로 따라오고, 옆의 글자는 현재 테마의
 * 해석된 값이다 — 색만으로 뜻을 전달하지 않는다.
 */
const Chip = ({ id, label, theme }: { id: string; label: string; theme: string }) => {
  const resolved = resolveToken(id, theme);

  return (
    <div className="flex flex-col gap-xs min-w-0" data-testid={`palette-chip-${id}`}>
      {/* 칩은 `aria-hidden` 이다 — 이름과 값은 아래 글자가 가진다. */}
      <Swatch color={resolved.ok ? `var(${resolved.token.cssVar})` : 'transparent'} size={44} />
      <span className="text-text-default text-xxsm break-all">{label}</span>
      {resolved.ok ? (
        <>
          <span className="text-text-light text-xxsm break-all">{resolved.token.value}</span>
          <Mono>{resolved.token.cssVar}</Mono>
        </>
      ) : (
        <span className="text-text-light text-xxsm" role="status">
          {resolved.reason === 'unknown-theme'
            ? `이 테마(${theme})는 catalog 에 없다`
            : '이 테마에 값이 없다'}
        </span>
      )}
    </div>
  );
};

const Family = ({ family, theme }: { family: PaletteFamily; theme: string }) => (
  <div>
    <h3 className="text-text-default text-xsm font-semiBold mb-sm">{family.name}</h3>
    {/*
      램프는 단계 변화를 보려면 한 줄로 이어져야 한다 — 좁은 화면에서는 가로 스크롤로 남기고
      칩을 찌그러뜨리지 않는다. 시맨틱 역할은 개수가 제각각이라 줄바꿈이 자연스럽다.
    */}
    <div
      className={
        family.kind === 'ramp'
          ? 'flex gap-md overflow-x-auto pb-xs'
          : 'flex flex-wrap gap-md gap-y-lg'
      }
    >
      {family.entries.map((entry) => (
        <div key={entry.id} className="w-[76px] shrink-0">
          <Chip id={entry.id} label={entry.key} theme={theme} />
        </div>
      ))}
    </div>
  </div>
);

export const PalettePage = () => {
  const theme = useCurrentTheme();
  const families = colorFamilies(tokenIdsInCategory('color'));

  return (
    <Page
      title="Palette"
      lead="색 토큰을 계열로 묶어 본다. 값은 현재 테마 기준이다"
      testId="palette-page"
    >
      <Section
        title="Primitive 램프"
        note="단계가 있는 원시 색. 컴포넌트는 이것을 직접 참조하지 않고 시맨틱을 거친다"
      >
        <div className="flex flex-col gap-2xl" data-testid="palette-ramps">
          {rampsOf(families).map((family) => (
            <Family key={family.name} family={family} theme={theme} />
          ))}
        </div>
      </Section>

      <Section title="시맨틱 역할" note="컴포넌트가 실제로 참조하는 색. 역할 이름이 쓰임을 말한다">
        <div className="flex flex-col gap-2xl" data-testid="palette-semantic">
          {semanticOf(families).map((family) => (
            <Family key={family.name} family={family} theme={theme} />
          ))}
        </div>
      </Section>
    </Page>
  );
};
