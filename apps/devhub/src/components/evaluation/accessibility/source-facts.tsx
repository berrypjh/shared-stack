import type { AccessibilitySummary } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { OUTCOME_LABEL, OUTCOME_TONE, SOURCE_LABEL } from '@/lib/evaluation/accessibility';

import { StatusLabel } from '../status-label';

const factRows = (summary: AccessibilitySummary): [string, string][] => [
  ['출처', SOURCE_LABEL[summary.source]],
  ['engine', summary.engine ? `${summary.engine.name} ${summary.engine.version}` : '없음'],
  ['WCAG tag', summary.tags.join(', ') || '없음'],
  ['켠 rule', summary.enabledRules.join(', ') || '없음'],
  ['제외 범위', summary.exclusions.join(', ') || '없음'],
  [
    'index',
    summary.index
      ? `${summary.index.path} · story ${summary.index.storyCount}개 · test story ${summary.index.testStoryCount}개`
      : '없음',
  ],
  [
    '시각',
    summary.startedAt
      ? `${summary.startedAt} → ${summary.finishedAt ?? '끝나지 않음'}`
      : '시각 없음',
  ],
];

/** 출처·검사 조건·실행 결과·한계. 결과는 검사 실행의 결과이고 접근성 판정이 아니다. */
export const SourceFacts = ({ summary }: { summary: AccessibilitySummary }) => (
  <div className="flex flex-col gap-sm">
    <p className="typo-body-small flex flex-wrap items-center gap-sm">
      <span className="typo-body-small-strong text-text-light">검사 실행</span>
      <StatusLabel tone={OUTCOME_TONE[summary.outcome]} label={OUTCOME_LABEL[summary.outcome]} />
      {summary.reason && <span className="break-keep text-text-default">{summary.reason}</span>}
    </p>
    <dl className="typo-body-small m-0 grid grid-cols-[auto_1fr] gap-x-md gap-y-xs">
      {factRows(summary).map(([term, detail]) => (
        <div key={term} className="contents">
          <dt className="typo-body-small-strong text-text-light">{term}</dt>
          <dd className="m-0 break-all text-text-default">{detail}</dd>
        </div>
      ))}
    </dl>
    {summary.limitations.length > 0 && (
      <List className="typo-body-small flex flex-col gap-xs text-text-light">
        {summary.limitations.map((limitation) => (
          <ListItem key={limitation}>{limitation}</ListItem>
        ))}
      </List>
    )}
  </div>
);
