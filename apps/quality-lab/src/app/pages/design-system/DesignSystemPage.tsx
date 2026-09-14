import type {
  DesignSystem,
  DesignSystemSignal,
  RunArtifact,
  SourceRef,
} from '@berrypjh/observability-contracts';
import { Chip, List, ListItem } from '@berrypjh/react-ui';

import { Link, useLocation } from 'react-router-dom';

import { CopyCommand } from '../../components/CopyCommand';
import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { TARGET_ROW, useHashFocus } from '../../components/useHashFocus';
import type { SummaryResult } from '../../data/client';
import {
  ARTIFACT_KINDS,
  artifactMatrix,
  SIGNAL_KIND_LABEL,
  stateMatrix,
} from '../../data/designSystem';
import { ARTIFACT_STATUS_LABEL, CONTRAST_BASIS_LABEL } from '../../data/labels';
import { loadingState, unsupportedState } from '../../data/status';
import { type RunData, runsWith, useRunData, useSummaries } from '../../data/useRunData';
import { Page } from '../../ui';

const SPEC = { keys: ['run', 'platform'] } as const;
const LINK = 'text-text-link underline underline-offset-2';
const DEMO_WEB = 'http://localhost:4200';
const PLATFORM_CHIPS = [
  { value: undefined, label: '전체' },
  { value: 'web', label: 'web' },
  { value: 'react-native', label: 'react-native' },
];

const refText = (ref: SourceRef) => `${ref.path}:${ref.line}`;

const Ref = ({ value, empty }: { value: SourceRef | null; empty: string }) =>
  value ? <Mono>{refText(value)}</Mono> : <span className="text-text-light">{empty}</span>;

const statusText = (status: string, reason: string | null) =>
  `${ARTIFACT_STATUS_LABEL[status] ?? status}${reason ? ` — ${reason}` : ''}`;

const DemoLinks = () => (
  <Section title="토큰 탐색 · consumer preview">
    <p className="text-text-light text-xsm leading-xsm break-keep">
      quality-lab 은 토큰 inspector 와 consumer preview 를 복제하지 않습니다. demo-web 로컬 서버에서
      봅니다.
    </p>
    <List className="flex flex-wrap gap-md text-xsm">
      <ListItem>
        <a className={LINK} href={`${DEMO_WEB}/tokens`}>
          demo-web 토큰 탐색 (/tokens)
        </a>
      </ListItem>
      <ListItem>
        <a className={LINK} href={`${DEMO_WEB}/scales`}>
          demo-web Scales (/scales)
        </a>
      </ListItem>
    </List>
    <CopyCommand command="pnpm nx serve @berrypjh/demo-web" />
  </Section>
);

const Themes = ({ ds }: { ds: DesignSystem }) => (
  <Section title="테마 · 생성 산출물">
    <p className="text-text-light text-xsm leading-xsm">
      등록부 <Mono>{ds.registry.path}</Mono> 의 테마 순서입니다.
    </p>
    <DataTable caption="Theme × 생성 산출물" headers={['theme', 'selector', ...ARTIFACT_KINDS]}>
      {artifactMatrix(ds).map((row) => {
        const theme = ds.registry.themes.find((item) => item.name === row.theme);
        return (
          <tr key={row.theme}>
            <th scope="row">{row.theme}</th>
            <td>
              <Mono>{theme?.selector ?? ''}</Mono>
            </td>
            {row.cells.map((cell, index) => (
              <td key={ARTIFACT_KINDS[index]}>
                {cell ? (
                  <>
                    {statusText(cell.status, cell.reason)}
                    <span className="block">
                      <Mono>{cell.path}</Mono>
                    </span>
                  </>
                ) : (
                  '행 없음 — 수집기가 정의하지 않은 조합'
                )}
              </td>
            ))}
          </tr>
        );
      })}
    </DataTable>
    <DataTable caption="테마 등록부 연결" headers={['대상', '상태', '근거']}>
      <tr>
        <th scope="row">tokens.json catalog (resolved {ds.catalog.resolvedFor})</th>
        <td>
          {statusText(ds.catalog.status, null)}
          {ds.catalog.rowCount !== null && ` · ${ds.catalog.rowCount}행`}
          {ds.catalog.issues.map((issue) => (
            <span
              key={issue.code + issue.message}
              className="block"
            >{`${issue.code}: ${issue.message}`}</span>
          ))}
        </td>
        <td>
          <Mono>{ds.catalog.path}</Mono>
        </td>
      </tr>
      {ds.namespaces.map((namespace) => (
        <tr key={namespace.platform}>
          <th scope="row">{`${namespace.platform} namespace`}</th>
          <td>{`${statusText(namespace.status, null)} · ${namespace.namespaces.join(', ') || '없음'}`}</td>
          <td>
            <Mono>{namespace.path}</Mono>
          </td>
        </tr>
      ))}
      <tr>
        <th scope="row">RN ThemeProvider mode</th>
        <td>
          {`${statusText(ds.rnProvider.status, null)} · ${ds.rnProvider.modes.join(', ') || '없음'}`}
          <span className="block">{`빠진 테마: ${ds.rnProvider.missingThemes.join(', ') || '없음'} · 등록부에 없는 mode: ${ds.rnProvider.extraModes.join(', ') || '없음'}`}</span>
        </td>
        <td>
          <Ref value={ds.rnProvider.source} empty="source 위치 없음" />
        </td>
      </tr>
    </DataTable>
  </Section>
);

const StateMatrix = ({
  signals,
  total,
  data,
}: {
  signals: DesignSystemSignal[];
  total: number;
  data: RunData;
}) => {
  const { search } = useLocation();
  const { query, setQuery } = data;
  const matrix = stateMatrix(signals);
  return (
    <Section title="Component state">
      <div role="group" aria-label="platform" className="flex flex-wrap gap-xs">
        {PLATFORM_CHIPS.map((chip) => (
          <Chip
            key={chip.label}
            selected={query.platform === chip.value}
            onClick={() => setQuery({ ...query, platform: chip.value })}
          >
            {chip.label}
          </Chip>
        ))}
      </div>
      <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
        {`신호 ${total}개 중 필터와 일치 ${signals.length}개`}
      </p>
      <List className="flex flex-col gap-xs text-text-light text-xsm leading-xsm">
        {Object.entries(SIGNAL_KIND_LABEL).map(([kind, label]) => (
          <ListItem key={kind}>
            <Mono>{kind}</Mono> {label}
          </ListItem>
        ))}
        <ListItem>
          정의 없음 — 수집기가 이 조합을 셀로 정의하지 않았습니다 (unknown 과 다름)
        </ListItem>
        <ListItem>
          test 위치 있음은 test 코드를 찾았다는 뜻이고 이번 수집에서 실행한 결과가 아닙니다
          (execution: not-run).
        </ListItem>
      </List>
      <DataTable
        caption="Component state 근거"
        headers={[
          'component',
          ...matrix.columns.map((column) => `${column.state} · ${column.platform}`),
        ]}
      >
        {matrix.rows.map((row) => (
          <tr key={row.component}>
            <th scope="row">{row.component}</th>
            {row.cells.map((cell, index) => (
              <td key={`${matrix.columns[index].state}.${matrix.columns[index].platform}`}>
                {cell ? (
                  <Link
                    className={LINK}
                    to={{ search, hash: `#signal-${cell.id}` }}
                    aria-label={`${cell.component} · ${cell.platform} · ${cell.state} — ${SIGNAL_KIND_LABEL[cell.observationKind]}`}
                  >
                    {SIGNAL_KIND_LABEL[cell.observationKind]}
                  </Link>
                ) : (
                  '정의 없음'
                )}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
      <DataTable
        caption="State 신호 근거"
        headers={['신호', 'token', '근거 종류', '선언', '소비', '경유', 'test', '이유']}
      >
        {signals.map((signal) => (
          <tr key={signal.id} id={`signal-${signal.id}`} tabIndex={-1} className={TARGET_ROW}>
            <th scope="row">{signal.id}</th>
            <td>{signal.token ? <Mono>{signal.token}</Mono> : '토큰 없음'}</td>
            <td>{SIGNAL_KIND_LABEL[signal.observationKind]}</td>
            <td>
              <Ref value={signal.declared} empty="선언 위치 없음" />
            </td>
            <td>
              <Ref value={signal.consumed} empty="소비 근거 없음" />
            </td>
            <td>
              <Ref value={signal.via} empty="경유 없음" />
            </td>
            <td>
              {signal.tested ? (
                <>
                  <Mono>{refText(signal.tested)}</Mono>
                  <span className="block">{signal.tested.title}</span>
                  <span className="block text-text-light">{`${signal.tested.evidenceKind} · 실행 안 함 (${signal.tested.execution})`}</span>
                </>
              ) : (
                <span className="text-text-light">test 근거 없음</span>
              )}
            </td>
            <td>{signal.reason ?? ''}</td>
          </tr>
        ))}
      </DataTable>
    </Section>
  );
};

const Tokens = ({ ds }: { ds: DesignSystem }) => (
  <Section title="Component token">
    <DataTable
      caption="Component token 출처"
      headers={[
        'token',
        'cssVar',
        'authored',
        'lineage',
        'emitted (web · rn)',
        '플랫폼 비교',
        '문서 정책',
        '소비 위치',
      ]}
    >
      {ds.componentTokens.map((token) => (
        <tr key={token.path}>
          <th scope="row">
            <Mono>{token.path}</Mono>
          </th>
          <td>{token.cssVar ? <Mono>{token.cssVar}</Mono> : 'catalog 가 valid 가 아니라 없음'}</td>
          <td>
            {token.authored ? (
              <>
                {`${token.authored.rawValue} (${token.authored.type})`}
                <span className="block">
                  <Mono>{refText(token.authored.source)}</Mono>
                </span>
              </>
            ) : (
              'authoring 원문 없음'
            )}
          </td>
          <td>
            {token.lineage.status === 'alias'
              ? `alias → ${token.lineage.references.join(', ')}`
              : token.lineage.status === 'unavailable'
                ? `unavailable — ${token.lineage.reason}`
                : 'literal'}
          </td>
          <td>{`catalog ${token.emitted.catalog ? '있음' : '없음'} · web ${token.emitted.web ?? '없음'} · rn ${token.emitted.rn ?? '없음'}`}</td>
          <td>{token.platformComparison}</td>
          <td>
            {token.documentedPolicy.policy}
            {token.documentedPolicy.source && (
              <span className="block">
                <Mono>{refText(token.documentedPolicy.source)}</Mono>
              </span>
            )}
          </td>
          <td>
            {token.consumers.length === 0
              ? '소비 위치 없음'
              : token.consumers.map((consumer) => (
                  <span key={refText(consumer)} className="block">
                    <Mono>{refText(consumer)}</Mono>
                  </span>
                ))}
          </td>
        </tr>
      ))}
    </DataTable>
  </Section>
);

const Guards = ({ ds }: { ds: DesignSystem }) => (
  <Section title="대비 기준 · 문서 불일치">
    <DataTable caption="Contrast guard" headers={['guard', '설명', '기준', 'ratio', 'source']}>
      {ds.contrastGuards.map((guard) => (
        <tr key={guard.id}>
          <th scope="row">{guard.id}</th>
          <td>{guard.label}</td>
          <td>{CONTRAST_BASIS_LABEL[guard.basis]}</td>
          <td>{`${guard.ratio}:1`}</td>
          <td>
            <Mono>{refText(guard.source)}</Mono>
          </td>
        </tr>
      ))}
    </DataTable>
    {ds.findings.length === 0 ? (
      <p className="text-text-light text-xsm">
        source 와 어긋난 문서를 찾지 못했습니다 (findings 0).
      </p>
    ) : (
      <DataTable caption="source 와 어긋난 문서" headers={['code', '내용', '문서', '근거']}>
        {ds.findings.map((finding) => (
          <tr key={finding.code + refText(finding.doc)}>
            <th scope="row">{finding.code}</th>
            <td>{finding.message}</td>
            <td>
              <Mono>{refText(finding.doc)}</Mono>
            </td>
            <td>
              {finding.evidence.map((ref) => (
                <span key={refText(ref)} className="block">
                  <Mono>{refText(ref)}</Mono>
                </span>
              ))}
            </td>
          </tr>
        ))}
      </DataTable>
    )}
  </Section>
);

const DesignSystemView = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { runId, profile } = run.metadata;
  const ds = run.designSystem;
  if (!ds) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: 'design-system 근거',
          runId,
          profile,
          collectProfile: 'static',
          alternatives: runsWith(summaries, (summary) => summary.sections.designSystem).filter(
            (id) => id !== runId,
          ),
        })}
      />
    );
  }
  const signals = ds.signals.filter(
    (signal) => !data.query.platform || signal.platform === data.query.platform,
  );
  return (
    <>
      <DemoLinks />
      <Themes ds={ds} />
      <StateMatrix signals={signals} total={ds.signals.length} data={data} />
      <Tokens ds={ds} />
      <Guards ds={ds} />
    </>
  );
};

export const DesignSystemPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  return (
    <Page path="/design-system">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <DesignSystemView run={data.run} data={data} summaries={summaries} />}
    </Page>
  );
};
