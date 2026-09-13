import { resolveToken, tokenIdsInCategory } from '../presentation/tokenCatalog';
import { Page, Section } from '../shell/ui';
import { useCurrentTheme } from '../verification/useCurrentTheme';

import {
  colorFamilies,
  isBaselineStep,
  type PaletteFamily,
  rampsOf,
  semanticOf,
} from './colorPalette';
import { PreviewFill, TokenCard, TokenGrid } from './TokenCard';

/**
 * 색 팔레트.
 *
 * `/tokens` 는 565개 전체를 표로 훑는 자리이고, 여기는 **색만** 계열로 묶어 한눈에 보는 자리다.
 * 램프의 단계 변화와 시맨틱 역할의 관계는 표로는 보이지 않는다.
 *
 * 값과 CSS 변수를 이 파일에 적지 않는다 — 공개 token artifact 에서 읽는다. 색 면은
 * `var(--ds-*)` 로 그려서 테마 전환이 CSS 캐스케이드로 따라오고, 아래 글자는 현재 테마의
 * 해석된 값이다 — 색만으로 뜻을 전달하지 않는다.
 */
const Chip = ({
  id,
  label,
  theme,
  baseline,
}: {
  id: string;
  label: string;
  theme: string;
  baseline: boolean;
}) => {
  const resolved = resolveToken(id, theme);

  return (
    <TokenCard
      testId={`palette-chip-${id}`}
      name={label}
      cssVar={resolved.ok ? resolved.token.cssVar : undefined}
      preview={
        <PreviewFill
          className="items-end pb-xs"
          style={{ background: resolved.ok ? `var(${resolved.token.cssVar})` : 'transparent' }}
        >
          {baseline && (
            <span className="text-text-contrastText text-xxsm leading-none">Baseline</span>
          )}
        </PreviewFill>
      }
      value={
        resolved.ok ? (
          resolved.token.value
        ) : (
          <span role="status">
            {resolved.reason === 'unknown-theme'
              ? `이 테마(${theme})는 catalog 에 없다`
              : '이 테마에 값이 없다'}
          </span>
        )
      }
    />
  );
};

const Family = ({ family, theme }: { family: PaletteFamily; theme: string }) => (
  <div>
    <h3 className="text-text-default text-xsm font-semiBold capitalize mb-sm">{family.name}</h3>
    <TokenGrid>
      {family.entries.map((entry) => (
        <Chip
          key={entry.id}
          id={entry.id}
          label={entry.key}
          theme={theme}
          baseline={family.kind === 'ramp' && isBaselineStep(entry.key)}
        />
      ))}
    </TokenGrid>
  </div>
);

export const PalettePage = () => {
  const theme = useCurrentTheme();
  const families = colorFamilies(tokenIdsInCategory('color'));

  return (
    <Page
      title="Palette"
      lead="통합 컬러 스케일 및 토큰. 값은 현재 테마 기준이다"
      testId="palette-page"
    >
      <Section
        title="Primitive 램프"
        note="단계가 있는 원시 색. 컴포넌트는 이것을 직접 참조하지 않고 시맨틱을 거친다"
      >
        <div className="flex flex-col gap-xl" data-testid="palette-ramps">
          {rampsOf(families).map((family) => (
            <Family key={family.name} family={family} theme={theme} />
          ))}
        </div>
      </Section>

      <Section title="시맨틱 역할" note="컴포넌트가 실제로 참조하는 색. 역할 이름이 쓰임을 말한다">
        <div className="flex flex-col gap-xl" data-testid="palette-semantic">
          {semanticOf(families).map((family) => (
            <Family key={family.name} family={family} theme={theme} />
          ))}
        </div>
      </Section>
    </Page>
  );
};
