import { BarChart } from '@berrypjh/devhub-ui';
import type { AuditTarget } from '@berrypjh/observability-contracts';

import { IMPACT_LABEL, impactBars } from '@/lib/evaluation/accessibility';

import { RuleTable } from './rule-table';

/** 검사한 대상: impact 별 위반 node 막대, 수집한 수, 위반 · incomplete rule 표. */
export const ScannedTarget = ({ target }: { target: AuditTarget }) => {
  const bars = impactBars(target);
  const { counts } = target;
  return (
    <>
      {bars && (
        <BarChart
          title={`impact 별 위반 node — ${target.label}`}
          description="영향받은 node 수다 (rule 수가 아님). rule 의 impact 기준이고 통과율·점수가 아니다"
          unit="node"
          groups={[
            {
              label: '위반 node',
              bars: bars.bars.map((bar) => ({
                key: bar.impact,
                label: IMPACT_LABEL[bar.impact],
                value: bar.value,
                scale: bars.scale,
                text: `${bar.value} node`,
              })),
            },
          ]}
        />
      )}
      {counts && (
        <p className="typo-body-small break-keep text-text-default">
          {`위반 rule ${counts.violationRules}개 · 위반 node ${counts.violationNodes}개 · incomplete rule ${counts.incompleteRules}개 · incomplete node ${counts.incompleteNodes}개 · inapplicable rule ${counts.inapplicableRules}개 · pass rule ${counts.passRules}개 — pass rule 수는 접근성 성공률이 아니다`}
        </p>
      )}
      <RuleTable
        caption={`위반 rule — ${target.label}`}
        rules={target.violations}
        empty="위반 rule 이 없다 (0개). incomplete 는 아래에서 따로 확인한다."
      />
      <RuleTable
        caption={`incomplete (확인 필요, 통과 아님) — ${target.label}`}
        rules={target.incomplete}
        empty="incomplete rule 이 없다 (0개)."
      />
    </>
  );
};
