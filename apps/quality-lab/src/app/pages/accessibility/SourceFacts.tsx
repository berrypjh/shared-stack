import type { AccessibilitySummary } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { StatusLabel } from '../../components/StatusLabel';
import { OUTCOME_LABEL, SOURCE_LABEL } from '../../data/accessibility';

const OUTCOME_TONE: Record<AccessibilitySummary['outcome'], string> = {
  completed: 'passed',
  partial: 'timeout',
  'scan-failed': 'failed',
  'not-run': 'not-run',
};

/** 출처·검사 조건·실행 결과·한계. 결과는 검사 실행의 결과이고 접근성 판정이 아니다. */
export const SourceFacts = ({ summary }: { summary: AccessibilitySummary }) => {
  const rows: [string, string][] = [
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
  return (
    <div className="flex flex-col gap-sm">
      <p className="flex flex-wrap items-center gap-sm text-xsm leading-xsm">
        <span className="text-text-light font-semiBold">검사 실행</span>
        <StatusLabel tone={OUTCOME_TONE[summary.outcome]} label={OUTCOME_LABEL[summary.outcome]} />
        {summary.reason && <span className="text-text-default break-keep">{summary.reason}</span>}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-md gap-y-xs text-xsm leading-xsm m-0">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-text-light font-semiBold">{term}</dt>
            <dd className="text-text-default m-0 break-all">{detail}</dd>
          </div>
        ))}
      </dl>
      {summary.limitations.length > 0 && (
        <List className="flex flex-col gap-xs text-text-light text-xsm leading-xsm">
          {summary.limitations.map((limitation) => (
            <ListItem key={limitation}>{limitation}</ListItem>
          ))}
        </List>
      )}
    </div>
  );
};
