import { useId, useRef, useState } from 'react';

import type { AccessibilitySummary, AuditTarget, AxeRule } from '@berrypjh/observability-contracts';
import { Button, List, ListItem } from '@berrypjh/react-ui';

import { BarChart } from '../../components/BarChart';
import { DataTable } from '../../components/DataTable';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { Section } from '../../components/Section';
import { StatusLabel } from '../../components/StatusLabel';
import { StatusNotice } from '../../components/StatusNotice';
import {
  compareTarget,
  IMPACT_LABEL,
  impactBars,
  SOURCE_SCOPE_LABEL,
  TARGET_STATUS_LABEL,
  TARGET_TONE,
} from '../../data/accessibility';
import type { Query } from '../../data/query';
import type { OtherRun } from '../../data/useRunData';

const countText = (value: number | undefined) => (value === undefined ? '없음' : String(value));

/** 노드 목록 펼침. 안쪽 접기 버튼으로 닫으면 포커스를 여는 버튼으로 돌려준다. */
const NodeToggle = ({ rule }: { rule: AxeRule }) => {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  return (
    <>
      <Button
        ref={toggle}
        variant="text"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${rule.id} 영향받은 노드 ${rule.nodeCount}개`}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '접기' : '펼치기'}
      </Button>
      <div id={panelId} hidden={!open} className="flex flex-col gap-xs mt-xs">
        <List className="flex flex-col gap-xs">
          {rule.nodes.map((node, index) => (
            <ListItem key={`${node.target.join('|')}-${index}`}>
              <Mono>{node.target.join(' , ')}</Mono>
              {node.excerpt && (
                <code className="block font-mono text-xxsm text-text-light break-all">
                  {node.excerpt}
                </code>
              )}
            </ListItem>
          ))}
        </List>
        {rule.nodeCount > rule.nodes.length && (
          <p className="text-text-light text-xxsm">{`${rule.nodes.length}개만 싣습니다 (전체 ${rule.nodeCount}개)`}</p>
        )}
        <Button
          variant="text"
          size="sm"
          aria-label={`${rule.id} 노드 목록 접기`}
          onClick={() => {
            setOpen(false);
            toggle.current?.focus();
          }}
        >
          접기
        </Button>
      </div>
    </>
  );
};

const RuleTable = ({
  caption,
  rules,
  empty,
}: {
  caption: string;
  rules: AxeRule[];
  empty: string;
}) =>
  rules.length === 0 ? (
    <p className="text-text-default text-xsm leading-xsm">{empty}</p>
  ) : (
    <DataTable caption={caption} headers={['rule', 'impact', 'node 수', '설명', 'tag', '노드']}>
      {rules.map((rule) => (
        <tr key={rule.id}>
          <th scope="row">{rule.id}</th>
          <td>{IMPACT_LABEL[rule.impact]}</td>
          <td>{rule.nodeCount}</td>
          <td>
            {rule.help}
            {rule.helpUrl && (
              <a className="block text-text-link underline underline-offset-2" href={rule.helpUrl}>
                {`${rule.id} 규칙 설명`}
              </a>
            )}
          </td>
          <td>{rule.tags.join(', ')}</td>
          <td>
            <NodeToggle rule={rule} />
          </td>
        </tr>
      ))}
    </DataTable>
  );

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

const Comparison = ({
  summary,
  target,
  query,
  setQuery,
  runIds,
  runId,
  other,
}: {
  summary: AccessibilitySummary;
  target: AuditTarget;
  query: Query;
  setQuery: (next: Query) => void;
  runIds: string[];
  runId: string;
  other: OtherRun;
}) => {
  const baseline = other.status === 'ready' ? other.run.accessibility : null;
  const comparison = compareTarget(summary, target.id, baseline);
  return (
    <Section title="baseline 비교" level={3}>
      <p className="text-text-light text-xsm leading-xsm break-keep">
        같은 출처·axe-core 버전·WCAG tag·켠 rule·검사 범위이고 두 실행 모두 이 대상을 검사했을 때만
        rule 별 위반 node 수를 비교합니다.
      </p>
      <LabeledSelect
        label="baseline 실행"
        value={query.base ?? ''}
        options={[
          { value: '', label: '없음' },
          ...runIds.filter((id) => id !== runId).map((id) => ({ value: id, label: id })),
        ]}
        onChange={(value) => setQuery({ ...query, base: value || undefined })}
      />
      {other.status === 'loading' && (
        <p className="text-text-light text-xsm">baseline 실행을 불러오는 중입니다</p>
      )}
      {other.status === 'error' && <StatusNotice level={3} state={other.view} />}
      {other.status !== 'loading' && comparison.status === 'no-baseline' && (
        <p className="text-text-light text-xsm">baseline 실행을 고르지 않았습니다</p>
      )}
      {comparison.status === 'not-comparable' && (
        <p className="text-text-default text-xsm">{`비교 불가 — ${comparison.reasons.join(', ')}`}</p>
      )}
      {comparison.status === 'compared' && (
        <DataTable
          caption={`같은 조건 비교 — ${target.label}`}
          headers={['rule', '현재 node', 'baseline node', '차이']}
        >
          {comparison.rules.map((rule) => (
            <tr key={rule.id}>
              <th scope="row">{rule.id}</th>
              <td>{rule.current}</td>
              <td>{rule.base}</td>
              <td>{signed(rule.delta)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Section>
  );
};

const ScannedTarget = ({ target }: { target: AuditTarget }) => {
  const bars = impactBars(target);
  const { counts } = target;
  return (
    <>
      {bars && (
        <BarChart
          title={`impact 별 위반 node — ${target.label}`}
          description="영향받은 node 수입니다 (rule 수가 아님). rule 의 impact 기준이고 통과율·점수가 아닙니다"
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
        <p className="text-text-default text-xsm leading-xsm break-keep">
          {`위반 rule ${counts.violationRules}개 · 위반 node ${counts.violationNodes}개 · incomplete rule ${counts.incompleteRules}개 · incomplete node ${counts.incompleteNodes}개 · inapplicable rule ${counts.inapplicableRules}개 · pass rule ${counts.passRules}개 — pass rule 수는 접근성 성공률이 아닙니다`}
        </p>
      )}
      <RuleTable
        caption={`위반 rule — ${target.label}`}
        rules={target.violations}
        empty="위반 rule 이 없습니다 (0개). incomplete 는 아래에서 따로 확인합니다."
      />
      <RuleTable
        caption={`incomplete (확인 필요, 통과 아님) — ${target.label}`}
        rules={target.incomplete}
        empty="incomplete rule 이 없습니다 (0개)."
      />
    </>
  );
};

/** axe 가 검사한 출처. 대상 표 → 고른 대상의 impact 막대·rule 표 → 같은 조건일 때만 비교. */
export const AxeSummary = ({
  summary,
  query,
  setQuery,
  runIds,
  runId,
  other,
}: {
  summary: AccessibilitySummary;
  query: Query;
  setQuery: (next: Query) => void;
  runIds: string[];
  runId: string;
  other: OtherRun;
}) => {
  const scope = SOURCE_SCOPE_LABEL[summary.sourceScope];
  const selected =
    summary.targets.find((target) => target.id === query.target) ??
    summary.targets.find((target) => target.status === 'scanned') ??
    summary.targets[0] ??
    null;

  return (
    <>
      {summary.targets.length > 0 && (
        <DataTable
          caption={`${scope} 검사 대상`}
          headers={[
            '대상',
            '상태',
            '위반 rule',
            '위반 node',
            'incomplete rule',
            'incomplete node',
            'inapplicable rule',
            'pass rule',
            '이유',
          ]}
        >
          {summary.targets.map((target) => (
            <tr key={target.id}>
              <th scope="row">
                {target.label}
                <span className="block">
                  <Mono>{target.id}</Mono>
                </span>
              </th>
              <td>
                <StatusLabel
                  tone={TARGET_TONE[target.status]}
                  label={TARGET_STATUS_LABEL[target.status]}
                />
              </td>
              <td>{countText(target.counts?.violationRules)}</td>
              <td>{countText(target.counts?.violationNodes)}</td>
              <td>{countText(target.counts?.incompleteRules)}</td>
              <td>{countText(target.counts?.incompleteNodes)}</td>
              <td>{countText(target.counts?.inapplicableRules)}</td>
              <td>{countText(target.counts?.passRules)}</td>
              <td>
                {target.reason ? `${TARGET_STATUS_LABEL[target.status]}: ${target.reason}` : '없음'}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      {selected && (
        <Section title="고른 대상" level={3}>
          <LabeledSelect
            label="검사 대상"
            value={selected.id}
            options={summary.targets.map((target) => ({
              value: target.id,
              label: `${target.label} (${TARGET_STATUS_LABEL[target.status]})`,
            }))}
            onChange={(value) => setQuery({ ...query, target: value })}
          />
          {selected.status === 'scanned' ? (
            <ScannedTarget target={selected} />
          ) : (
            <StatusNotice
              level={3}
              state={{
                kind: selected.status === 'skipped' ? 'not-applicable' : 'unsupported',
                title: `${selected.label} — ${TARGET_STATUS_LABEL[selected.status]}`,
                cause: selected.reason ?? '이유가 없습니다',
                commands: [],
              }}
            />
          )}
          <Comparison
            summary={summary}
            target={selected}
            query={query}
            setQuery={setQuery}
            runIds={runIds}
            runId={runId}
            other={other}
          />
        </Section>
      )}
    </>
  );
};
