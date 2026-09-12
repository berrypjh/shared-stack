import { Table, TableScroll } from '@berrypjh/react-ui';

import { Mono, Page, Section, Swatch } from '../shell/ui';
import { CONTRAST_CHECKS, CONTRAST_VARS, contrastRatio } from '../verification/contrast';
import { RuntimeVerification } from '../verification/RuntimeVerification';
import { useCurrentTheme } from '../verification/useCurrentTheme';
import { useProbeValues } from '../verification/useProbes';

/** 런타임 검증 화면. 통합 계약과 접근성을 실제 계산값으로 확인한다. */

export const VerifyPage = () => {
  const theme = useCurrentTheme();
  const values = useProbeValues(CONTRAST_VARS);
  // 접근성은 현재 화면에 적용된 프로필 기준으로 본다.
  const current = values?.default ?? null;

  return (
    <Page
      testId="verify-page"
      title="Runtime"
      lead="이 실행 환경에서 Shared Stack 통합이 살아 있는지 확인합니다."
    >
      <Section title="통합 계약" note="Default와 Sample을 동시에 측정합니다">
        <RuntimeVerification theme={theme} />
      </Section>

      <Section title="접근성" note="브라우저가 계산한 값으로 WCAG 2.1 대비를 다시 잽니다">
        <TableScroll label="WCAG 대비 측정 결과 표">
          <Table hiddenCaption>
            <caption>브라우저가 계산한 값으로 다시 잰 WCAG 2.1 대비 측정 결과</caption>
            <thead>
              <tr className="text-text-light text-xxsm">
                <th scope="col" className="text-left font-semiBold pb-md pr-lg">
                  조합
                </th>
                <th scope="col" className="text-left font-semiBold pb-md pr-lg w-[80px]">
                  색
                </th>
                <th scope="col" className="text-right font-semiBold pb-md pr-lg w-[90px]">
                  대비
                </th>
                <th scope="col" className="text-right font-semiBold pb-md pr-lg w-[70px]">
                  기준
                </th>
                <th scope="col" className="text-right font-semiBold pb-md w-[90px]">
                  결과
                </th>
              </tr>
            </thead>
            <tbody>
              {CONTRAST_CHECKS.map((c) => {
                const fg = current?.[c.fg] ?? '';
                const bg = current?.[c.bg] ?? '';
                const ratio = fg && bg ? contrastRatio(fg, bg) : null;
                const exempt = c.need === 0;
                const ok = ratio !== null && ratio >= c.need;
                return (
                  <tr key={c.label} data-testid={`contrast-${c.label}`}>
                    <th scope="row" className="py-md pr-lg text-text-default font-regular">
                      {c.label}
                      {c.note && <span className="text-text-light text-xxsm ml-md">{c.note}</span>}
                    </th>
                    <td className="py-md pr-lg">
                      <span className="flex items-center gap-xs">
                        <Swatch color={bg} size={16} />
                        <Swatch color={fg} size={16} />
                      </span>
                    </td>
                    <td className="py-md pr-lg text-right font-mono text-xxsm text-text-default">
                      {ratio ? `${ratio.toFixed(2)}:1` : '—'}
                    </td>
                    <td className="py-md pr-lg text-right font-mono text-xxsm text-text-light">
                      {exempt ? '—' : `${c.need}:1`}
                    </td>
                    <td className="py-md text-right text-xxsm">
                      {exempt ? (
                        <span className="text-text-light">면제</span>
                      ) : (
                        <span className={ok ? 'text-success-su700' : 'text-error-er700'}>
                          {ok ? '통과' : '미달'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      </Section>

      <Section title="E2E 측정 지점" note="Playwright가 computed style로 읽는 고정 앵커">
        <div className="flex flex-wrap gap-2xl">
          {[
            { id: 'probe-background-primary', v: '--ds-background-primary' },
            { id: 'probe-background-error', v: '--ds-background-error' },
            { id: 'probe-text-default', v: '--ds-text-default' },
            { id: 'probe-stroke-default', v: '--ds-stroke-default' },
          ].map((p) => (
            <div key={p.id} className="flex flex-col gap-sm">
              <div
                data-testid={p.id}
                className="w-[112px] h-[36px] rounded-sm border border-stroke-light"
                style={{ background: `var(${p.v})` }}
              />
              <Mono>{p.v}</Mono>
            </div>
          ))}
          <div className="flex flex-col gap-sm">
            <div
              data-testid="probe-background-primary-rgb"
              className="w-[112px] h-[36px] rounded-sm border border-stroke-light"
              style={{ background: 'rgb(var(--ds-background-primary-rgb) / 0.5)' }}
            />
            <Mono>--ds-background-primary-rgb @ 50%</Mono>
          </div>
          <div className="flex flex-col gap-sm">
            <div
              data-testid="probe-spacing-md"
              className="w-[112px] rounded-sm border border-stroke-light bg-background-grey"
              style={{ padding: 'var(--ds-spacing-md)' }}
            />
            <Mono>--ds-spacing-md</Mono>
          </div>
          <div className="flex flex-col gap-sm">
            <div
              data-testid="probe-radius-lg"
              className="w-[112px] h-[36px] border border-stroke-light bg-background-grey"
              style={{ borderRadius: 'var(--ds-radius-lg)' }}
            />
            <Mono>--ds-radius-lg</Mono>
          </div>
        </div>
      </Section>
    </Page>
  );
};

export default VerifyPage;
