import {
  EVAL_METRICS,
  type EvalAggregate,
  type EvalRate,
  type EvalRun,
  type EvalVariant,
} from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { BarChart } from '../../components/BarChart';
import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { Section } from '../../components/Section';
import {
  metricFormatOf,
  metricKeys,
  metricText,
  PRIMARY_KEYS,
  type PrimaryKey,
} from '../../data/ai';
import { shortSha } from '../../data/format';
import { EXECUTOR_LABEL, NOTICE_LABEL, REPORT_LABEL } from '../../data/labels';

/** 실행 조건과 executor 종류. 필터와 관계없이 모든 평가 화면 위에 남는다. */
/** caption 에 붙는 출처 이름. summary 가 없어 origin 을 모르면 executor 종류를 쓴다. */
const executorTag = (evalRun: EvalRun) =>
  evalRun.origin?.executor ?? evalRun.executorClass ?? 'executor 모름';

export const Provenance = ({ evalRun }: { evalRun: EvalRun }) => {
  const { origin } = evalRun;
  const executorClass = evalRun.executorClass
    ? (EXECUTOR_LABEL[evalRun.executorClass] ?? evalRun.executorClass)
    : 'executor 종류 모름';
  const rows: [string, string][] = [
    ['executor', `${origin?.executor ?? '모름'} · ${executorClass}`],
    ['source', evalRun.sourceId],
    ...(origin
      ? ([
          ['model', origin.model ?? '없음'],
          [
            '조건',
            `split ${origin.split} · K=${origin.k} · task ${origin.taskCount} × trial ${origin.trialsPerTask}`,
          ],
          [
            'harness',
            `${origin.harnessVersion} · ${origin.createdAt} · ${shortSha(origin.gitSha)}`,
          ],
        ] as [string, string][])
      : ([['조건', 'summary 를 읽지 못해 실행 조건을 모릅니다']] as [string, string][])),
    [
      'import',
      Object.entries(evalRun.import)
        .map(([name, item]) => `${name} ${REPORT_LABEL[item.status] ?? item.status}`)
        .join(' · '),
    ],
  ];
  return (
    <Section title="평가 출처" card>
      <dl className="grid grid-cols-[auto_1fr] gap-x-md gap-y-xs text-xsm leading-xsm m-0">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-text-light font-semiBold">{term}</dt>
            <dd className="text-text-default m-0 break-all">{detail}</dd>
          </div>
        ))}
      </dl>
      <List className="flex flex-col gap-xs text-xsm leading-xsm">
        {evalRun.notices.map((notice) => (
          <ListItem key={notice.code}>
            <span className="font-semiBold">{NOTICE_LABEL[notice.code] ?? notice.code}</span>
            {` — ${notice.message}`}
          </ListItem>
        ))}
      </List>
    </Section>
  );
};

const RATE_DESCRIPTION: Partial<Record<PrimaryKey, string>> = {
  verifiedTaskSuccessRate: '검증까지 통과해 성공한 trial 비율입니다. 분모는 trial 수입니다',
  routingAccuracy: 'routing 이 맞은 비율입니다. 분모는 원본 denominator 그대로입니다',
  falseSuccessRate:
    '성공을 주장했지만 검증을 통과하지 못한 비율입니다. 분모는 성공을 명시적으로 주장한 trial 수입니다',
};

const RATE_KEYS = PRIMARY_KEYS.filter((key) => EVAL_METRICS.primary[key].kind === 'rate');
const OTHER_GROUPS = ['secondary', 'diagnostic'] as const;

type Metric = EvalRate | EvalAggregate;

const metricOf = (
  variant: EvalVariant,
  group: 'primary' | 'secondary' | 'diagnostic',
  key: string,
) => (variant[group] as Record<string, Metric>)[key];

/** primary 는 variant × metric 표와 rate 마다 따로 그린 막대. 합산 점수는 없다. */
export const Scorecard = ({ evalRun, variants }: { evalRun: EvalRun; variants: EvalVariant[] }) => {
  const tag = executorTag(evalRun);
  return (
    <Section title="Primary metrics" anchor="scorecard">
      <DataTable caption={`Primary metrics — ${tag}`} headers={['variant', ...PRIMARY_KEYS]}>
        {variants.map((variant) => (
          <tr key={variant.variant}>
            <th scope="row">
              <Mono>{variant.variant}</Mono>
              <span className="block text-text-light">{variant.label}</span>
            </th>
            {PRIMARY_KEYS.map((key) => (
              <td key={key}>{metricText(variant.primary[key], metricFormatOf('primary', key))}</td>
            ))}
          </tr>
        ))}
      </DataTable>
      <div className="grid gap-lg grid-cols-1 lg:grid-cols-3">
        {RATE_KEYS.map((key) => (
          <BarChart
            key={key}
            title={`${key} — ${tag}`}
            description={RATE_DESCRIPTION[key] ?? ''}
            unit="비율 0–100% (글은 분자/분모)"
            groups={[
              {
                label: key,
                bars: variants.map((variant) => ({
                  key: variant.variant,
                  label: variant.variant,
                  value: variant.primary[key].value,
                  scale: 1,
                  text: metricText(variant.primary[key], 'rate'),
                })),
              },
            ]}
          />
        ))}
      </div>

      <DataTable
        caption={`Secondary · diagnostic metrics — ${tag}`}
        headers={['metric', 'group · kind · axis', ...variants.map((variant) => variant.variant)]}
      >
        {OTHER_GROUPS.flatMap((group) =>
          metricKeys(group).map((key) => {
            const spec = (EVAL_METRICS[group] as Record<string, { kind: string; axis: string }>)[
              key
            ];
            return (
              <tr key={`${group}.${key}`}>
                <th scope="row">{key}</th>
                <td>{`${group} · ${spec.kind} · ${spec.axis}`}</td>
                {variants.map((variant) => (
                  <td key={variant.variant}>
                    {metricText(metricOf(variant, group, key), metricFormatOf(group, key))}
                  </td>
                ))}
              </tr>
            );
          }),
        )}
      </DataTable>

      <DataTable
        caption={`failureBreakdown — ${tag}`}
        headers={['failure category', ...variants.map((variant) => variant.variant)]}
      >
        {Object.keys(variants[0]?.failureBreakdown ?? {}).map((category) => (
          <tr key={category}>
            <th scope="row">{category}</th>
            {variants.map((variant) => (
              <td key={variant.variant}>
                {(variant.failureBreakdown as Record<string, number>)[category]}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
      <p className="text-text-light text-xsm leading-xsm break-keep">
        failureBreakdown 단위는 trial 수입니다. 성공한 trial 수(verifiedTaskSuccessRate 분자)와
        합하면 trial 수가 됩니다.
      </p>
    </Section>
  );
};
