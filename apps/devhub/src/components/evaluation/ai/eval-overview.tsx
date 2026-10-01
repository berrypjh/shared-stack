import { BarChart, DataTable, NamedCode } from '@berrypjh/devhub-ui';
import {
  EVAL_METRICS,
  type EvalAggregate,
  type EvalRate,
  type EvalRun,
  type EvalVariant,
} from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import {
  executorTag,
  metricFormatOf,
  metricKeys,
  metricText,
  PRIMARY_KEYS,
  type PrimaryKey,
} from '@/lib/evaluation/ai';
import { shortSha } from '@/lib/evaluation/format';
import { BETTER_TEXT, failureTerm, metricTerm } from '@/lib/evaluation/glossary';
import { EXECUTOR_LABEL, modelText, NOTICE_LABEL, REPORT_LABEL } from '@/lib/evaluation/labels';

import { Section } from '../section';

const CODE = 'block typo-caption-small text-text-light';

export const VariantName = ({ variant }: { variant: Pick<EvalVariant, 'variant' | 'label'> }) => (
  <NamedCode name={variant.label} code={variant.variant} />
);

/** 이 실행을 한 문장으로. 누가 · 무엇을 · 몇 번 풀었는지만 말하고 세부는 접어 둔다. */
const runSentence = (evalRun: EvalRun) => {
  const { origin } = evalRun;
  if (!origin) return '평가 요약을 읽지 못해 누가 무엇을 풀었는지 모름';
  const scope = `${origin.split} 과제 ${origin.taskCount}개를 variant ${evalRun.variants.length}개로 ${origin.trialsPerTask}번씩`;
  switch (evalRun.executorClass) {
    case 'live':
      return `${modelText(origin) ?? '모델'} 가 ${scope} 풀었음`;
    case 'harness-smoke':
    case 'scripted':
      return `모델 없이 정해 둔 결과로 ${scope} 채점했음 — 평가 도구 확인용이라 점수는 모델 성능이 아님`;
    case 'replay':
      return `미리 기록된 결과(${origin.executor})를 ${scope} 다시 채점했음`;
    default:
      return `${origin.executor} 로 ${scope} 채점했음`;
  }
};

/** 실행 조건. 이해에 필요한 한 문장 · 빠진 variant · 주의만 보이고, 원본 조건은 접어 둔다. */
export const RunSummary = ({ evalRun }: { evalRun: EvalRun }) => {
  const { origin } = evalRun;
  const skipped = evalRun.skippedVariants ?? [];
  const rows: [string, string][] = [
    [
      '실행기',
      `${origin?.executor ?? '모름'} — ${
        evalRun.executorClass
          ? (EXECUTOR_LABEL[evalRun.executorClass] ?? evalRun.executorClass)
          : '종류 모름'
      }`,
    ],
    ['평가 산출물', evalRun.sourceId],
    ...(origin
      ? ([
          ['모델', modelText(origin) ?? '없음 (모델을 부르지 않음)'],
          [
            '범위',
            `${origin.split} 과제 ${origin.taskCount}개 × ${origin.trialsPerTask}번 · 근거는 처음 ${origin.k}개 조회까지 셈`,
          ],
          [
            '평가 도구',
            `버전 ${origin.harnessVersion} · ${origin.createdAt} · 커밋 ${shortSha(origin.gitSha)}`,
          ],
        ] as [string, string][])
      : []),
    [
      '읽은 파일',
      Object.entries(evalRun.import)
        .map(([name, item]) => `${name} ${REPORT_LABEL[item.status] ?? item.status}`)
        .join(' · '),
    ],
  ];
  return (
    <Section title="이 실행">
      <p className="typo-body-small break-keep text-text-default">{runSentence(evalRun)}</p>
      {skipped.length > 0 && (
        <div className="flex flex-col gap-2xs">
          <p className="typo-body-small-strong text-text-default">{`실행하지 않은 variant ${skipped.length}개`}</p>
          <List className="flex flex-col gap-2xs typo-body-small break-keep text-text-light">
            {skipped.map((item) => (
              <ListItem
                key={item.variant}
              >{`${item.label ?? item.variant} — ${item.reason}`}</ListItem>
            ))}
          </List>
        </div>
      )}
      {evalRun.notices.length > 0 && (
        <List className="flex flex-col gap-2xs typo-body-small break-keep text-text-default">
          {evalRun.notices.map((notice) => (
            <ListItem
              key={notice.code}
            >{`주의: ${NOTICE_LABEL[notice.code] ?? notice.message}`}</ListItem>
          ))}
        </List>
      )}
      <details className="rounded-md border border-stroke-light bg-background-surface">
        <summary className="cursor-pointer px-md py-sm typo-body-small text-text-light">
          실행 조건 자세히
        </summary>
        <dl className="m-0 grid grid-cols-1 gap-x-md gap-y-xs border-t border-stroke-light p-md typo-body-small sm:grid-cols-[max-content_1fr]">
          {rows.map(([term, detail]) => (
            <div key={term} className="contents">
              <dt className="text-text-light">{term}</dt>
              <dd className="m-0 break-all text-text-default">{detail}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Section>
  );
};

const RATE_KEYS = PRIMARY_KEYS.filter((key) => EVAL_METRICS.primary[key].kind === 'rate');
const OTHER_GROUPS = ['secondary', 'diagnostic'] as const;
const GROUP_LABEL = { secondary: '보조', diagnostic: '진단' } as const;

type Metric = EvalRate | EvalAggregate;

const describe = (key: string) => {
  const { meaning, better } = metricTerm(key);
  return better ? `${meaning}. ${BETTER_TEXT[better]}` : meaning;
};

/**
 * 지표 하나를 variant 마다 막대로. 값은 variant 별 원본이고 다시 계산하지 않는다.
 * 비율은 0–100% 눈금, 평균 · 중앙값은 그린 값 중 가장 큰 값을 눈금으로 쓴다.
 */
export const VariantMetricChart = ({
  evalRun,
  variants,
  metric,
}: {
  evalRun: EvalRun;
  variants: EvalVariant[];
  metric: PrimaryKey;
}) => {
  const isRate = EVAL_METRICS.primary[metric].kind === 'rate';
  const values = variants.flatMap((variant) => variant.primary[metric].value ?? []);
  const scale = isRate ? 1 : Math.max(...values, 0) || 1;
  return (
    <BarChart
      title={`${metricTerm(metric).label} — ${executorTag(evalRun)}`}
      description={describe(metric)}
      unit={isRate ? '비율 0–100% (괄호는 해당 시도 수/전체 시도 수)' : '평균 (괄호는 표본 수)'}
      groups={[
        {
          label: metric,
          bars: variants.map((variant) => ({
            key: variant.variant,
            label: variant.label,
            value: variant.primary[metric].value,
            scale,
            text: metricText(variant.primary[metric], metricFormatOf('primary', metric)),
          })),
        },
      ]}
    />
  );
};

const metricOf = (
  variant: EvalVariant,
  group: 'primary' | 'secondary' | 'diagnostic',
  key: string,
) => (variant[group] as Record<string, Metric>)[key];

/** 실패 원인별 시도 수. 0 인 원인은 접고, 판정 순서(위에서부터 처음 걸린 하나)를 설명한다. */
const FailureTable = ({ tag, variants }: { tag: string; variants: EvalVariant[] }) => {
  const categories = Object.keys(variants[0]?.failureBreakdown ?? {});
  const countOf = (variant: EvalVariant, category: string) =>
    (variant.failureBreakdown as Record<string, number>)[category] ?? 0;
  const seen = categories.filter((category) =>
    variants.some((variant) => countOf(variant, category) > 0),
  );
  return (
    <Section title="실패 원인" level={3}>
      <p className="typo-body-small break-keep text-text-light">
        실패한 시도마다 원인을 하나로 정한다 — 플랫폼 · 패키지 선택, import 경로, 검증 순서로 보고
        처음 걸린 것이 원인이다. 단위는 시도 수이고, 성공한 시도는 여기 없다.
      </p>
      {seen.length === 0 ? (
        <p className="typo-body-small text-text-default">실패한 시도가 없음.</p>
      ) : (
        <DataTable
          caption={`실패 원인 — ${tag}`}
          headers={['원인', ...variants.map((variant) => variant.label)]}
        >
          {seen.map((category) => {
            const term = failureTerm(category);
            return (
              <tr key={category}>
                <th scope="row">
                  <NamedCode name={term.label} code={category} />
                  {term.meaning && <span className={CODE}>{term.meaning}</span>}
                </th>
                {variants.map((variant) => (
                  <td key={variant.variant}>{countOf(variant, category)}</td>
                ))}
              </tr>
            );
          })}
        </DataTable>
      )}
      {categories.length > seen.length && (
        <p className="typo-caption-small text-text-light">{`시도가 없는 원인 ${categories.length - seen.length}개는 숨김`}</p>
      )}
    </Section>
  );
};

/**
 * 핵심 지표 표 · 비율 막대 · 실패 원인, 그리고 접어 둔 세부 지표. 합산 점수는 없다.
 * `evalRun` 에 variant 가 있을 때만 그린다(계약상 그때 origin 이 있다). `variants` 는 필터 결과다.
 */
export const Scorecard = ({ evalRun, variants }: { evalRun: EvalRun; variants: EvalVariant[] }) => {
  const tag = executorTag(evalRun);
  const others = OTHER_GROUPS.flatMap((group) => metricKeys(group).map((key) => ({ group, key })));
  return (
    <Section title="핵심 지표" anchor="scorecard">
      <DataTable
        caption={`핵심 지표 — ${tag}`}
        headers={['variant', ...PRIMARY_KEYS.map((key) => metricTerm(key).label)]}
      >
        {variants.map((variant) => (
          <tr key={variant.variant}>
            <th scope="row" className="whitespace-nowrap">
              <VariantName variant={variant} />
            </th>
            {PRIMARY_KEYS.map((key) => (
              <td key={key}>{metricText(variant.primary[key], metricFormatOf('primary', key))}</td>
            ))}
          </tr>
        ))}
      </DataTable>
      {RATE_KEYS.map((key) => (
        <VariantMetricChart key={key} evalRun={evalRun} variants={variants} metric={key} />
      ))}

      <FailureTable tag={tag} variants={variants} />

      <details className="rounded-md border border-stroke-light bg-background-surface">
        <summary className="cursor-pointer px-md py-sm typo-body-small text-text-light">
          {`세부 지표 ${others.length}개 — 도구 사용 · 비용 · 수정 단계`}
        </summary>
        <div className="border-t border-stroke-light p-md">
          <DataTable
            caption={`세부 지표 — ${tag}`}
            headers={['지표', '분류', ...variants.map((variant) => variant.label)]}
          >
            {others.map(({ group, key }) => (
              <tr key={`${group}.${key}`}>
                <th scope="row">
                  <NamedCode name={metricTerm(key).label} code={key} />
                </th>
                <td>{GROUP_LABEL[group]}</td>
                {variants.map((variant) => (
                  <td key={variant.variant}>
                    {metricText(metricOf(variant, group, key), metricFormatOf(group, key))}
                  </td>
                ))}
              </tr>
            ))}
          </DataTable>
        </div>
      </details>
    </Section>
  );
};
