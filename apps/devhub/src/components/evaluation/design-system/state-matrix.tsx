import { DataTable } from '@berrypjh/devhub-ui';
import type { DesignSystemSignal } from '@berrypjh/observability-contracts';
import { Chip, List, ListItem } from '@berrypjh/react-ui';

import { Link, useLocation } from 'react-router-dom';

import { LINK } from '@/components/ui/entity-link';
import { refText, SIGNAL_KIND_LABEL, stateMatrix } from '@/lib/evaluation/design-system';

import { Mono } from '../mono';
import { Section } from '../section';
import { TARGET_ROW } from '../use-hash-focus';
import type { RunData } from '../use-run-data';

import { SourceRef } from './source-ref';

const PLATFORM_CHIPS = [
  { value: undefined, label: '전체' },
  { value: 'web', label: 'web' },
  { value: 'react-native', label: 'react-native' },
];

/** platform 필터. 주소의 `platform` 만 바꾸고 원본 신호 수는 그대로 알린다. */
const PlatformFilter = ({
  data,
  total,
  shown,
}: {
  data: RunData;
  total: number;
  shown: number;
}) => {
  const { query, setQuery } = data;
  return (
    <>
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
      <p role="status" aria-live="polite" className="typo-body-small text-text-default">
        {`신호 ${total}개 중 필터와 일치 ${shown}개`}
      </p>
    </>
  );
};

const Legend = () => (
  <List className="typo-body-small flex flex-col gap-xs text-text-light">
    {Object.entries(SIGNAL_KIND_LABEL).map(([kind, label]) => (
      <ListItem key={kind}>
        <Mono>{kind}</Mono> {label}
      </ListItem>
    ))}
    <ListItem>정의 없음 — 수집기가 이 조합을 셀로 정의하지 않았다 (unknown 과 다름)</ListItem>
    <ListItem>
      test 위치 있음은 test 코드를 찾았다는 뜻이고 이번 수집에서 실행한 결과가 아니다 (execution:
      not-run).
    </ListItem>
  </List>
);

/** component × state · platform 격자. 셀은 같은 화면의 근거 행(`#signal-<id>`)으로 간다. */
const Matrix = ({ signals }: { signals: DesignSystemSignal[] }) => {
  const { search } = useLocation();
  const matrix = stateMatrix(signals);
  return (
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
  );
};

const SignalTable = ({ signals }: { signals: DesignSystemSignal[] }) => (
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
          <SourceRef value={signal.declared} empty="선언 위치 없음" />
        </td>
        <td>
          <SourceRef value={signal.consumed} empty="소비 근거 없음" />
        </td>
        <td>
          <SourceRef value={signal.via} empty="경유 없음" />
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
);

/** Component state 근거. 필터는 표시만 바꾼다. */
export const StateMatrix = ({
  signals,
  total,
  data,
}: {
  signals: DesignSystemSignal[];
  total: number;
  data: RunData;
}) => (
  <Section title="Component state">
    <PlatformFilter data={data} total={total} shown={signals.length} />
    <Legend />
    <Matrix signals={signals} />
    <SignalTable signals={signals} />
  </Section>
);
