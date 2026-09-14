import { useEffect, useState } from 'react';

import { Button, ThemeName } from '@berrypjh/react-ui';

import { StatusRow } from '../shell/controls';

import { CheckResult, Probe, PROBE_VARS, runChecks, summarize } from './checks';
import { PROBE_THEMES, probeRootId, ProbeTrees } from './useProbes';

/**
 * 통합 계약 상태. 개발자가 이 화면에서 가장 먼저 보는 것이다.
 *
 * 토큰 하나하나가 아니라 **계약 단위**로 판정한다 — 토큰 값 정합성은 design-tokens 의
 * compiler 테스트가, 브라우저 최종 결과의 회귀는 Playwright 가 담당한다.
 */

const read = (theme: ThemeName): Probe | null => {
  const root = document.getElementById(probeRootId(theme));
  const button = root?.querySelector('button');
  const tailwind = root?.querySelector('[data-probe="tailwind"]');
  if (!root || !button || !tailwind) return null;

  const style = getComputedStyle(root);
  return {
    vars: Object.fromEntries(PROBE_VARS.map((v) => [v, style.getPropertyValue(v).trim()])),
    buttonBg: getComputedStyle(button).backgroundColor,
    tailwindBg: getComputedStyle(tailwind).backgroundColor,
  };
};

/** 비교 기준 테마와, 화면이 base 일 때 맞대어 볼 테마. */
const BASE_THEME = PROBE_THEMES[0];
const OTHER_THEME = PROBE_THEMES[1] ?? PROBE_THEMES[0];

const TONE = { pass: 'ok', fail: 'error', unknown: 'idle' } as const;
const LABEL = { pass: '정상', fail: '확인 필요', unknown: '측정 불가' } as const;

export const RuntimeVerification = ({ theme }: { theme: ThemeName }) => {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>('');

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const base = read(BASE_THEME);
      const other = read(theme === BASE_THEME ? OTHER_THEME : theme);
      setResults(base && other ? runChecks(base, other) : null);
      setCheckedAt(
        new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  const stats = results ? summarize(results) : null;
  const healthy = stats ? stats.fail === 0 && stats.unknown === 0 : false;

  return (
    <>
      <ProbeTrees>
        {() => (
          <>
            <Button variant="contained">probe</Button>
            <div data-probe="tailwind" className="bg-background-primary" />
          </>
        )}
      </ProbeTrees>

      <div data-testid="runtime-verification">
        {/*
          요약 줄. 판정과 개수는 왼쪽, 측정 시각은 오른쪽 끝에 둔다 — 시각은 결과가 아니라
          맥락이라 결론과 같은 줄에서 경쟁하면 안 된다.
        */}
        <div className="flex flex-wrap items-baseline justify-between gap-md pb-md mb-md border-b border-stroke-default">
          <span className="flex items-baseline gap-md min-w-0">
            <span className="flex items-center gap-sm">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-xs ${healthy ? 'bg-success-su600' : 'bg-neutral-ne400'}`}
                aria-hidden
              />
              <span className="text-text-default text-sm leading-sm font-semiBold">
                {!stats ? '측정 중' : healthy ? '정상' : '확인 필요'}
              </span>
            </span>
            {stats && (
              <span className="text-text-light text-xxsm">
                정상 {stats.pass} · 확인 필요 {stats.fail} · 측정 불가 {stats.unknown}
              </span>
            )}
          </span>
          {checkedAt && (
            <span className="text-text-light text-xxsm shrink-0">{checkedAt} 기준</span>
          )}
        </div>

        {results && (
          <div>
            {results.map((r) => (
              <StatusRow
                key={r.id}
                testId={`check-${r.id}`}
                tone={TONE[r.status]}
                name={r.label}
                status={LABEL[r.status]}
                detail={
                  r.status !== 'pass' ? (
                    <span className="text-text-light text-xxsm shrink-0 hidden md:inline">
                      {r.boundary}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}

        {results?.some((r) => r.status !== 'pass') && (
          <dl className="mt-lg pt-lg border-t border-stroke-light grid gap-sm text-xxsm">
            {results
              .filter((r) => r.status !== 'pass')
              .map((r) => (
                <div key={r.id} className="flex flex-wrap gap-md">
                  <dt className="text-text-default">{r.label}</dt>
                  <dd className="text-text-light">
                    기대 <span className="font-mono text-text-default">{r.expected || '—'}</span>
                    {' · '}실제{' '}
                    <span className="font-mono text-text-default">{r.actual || '—'}</span>
                  </dd>
                </div>
              ))}
          </dl>
        )}
      </div>
    </>
  );
};
