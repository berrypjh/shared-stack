import { useMemo } from 'react';

import {
  BROWSER_SUPPORT,
  type BrowserCapability,
  type BrowserSession,
  type RuntimePerformance,
} from '@berrypjh/observability-contracts';
import { Button, Chip, List, ListItem } from '@berrypjh/react-ui';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { type BrowserSessionState, useBrowserSession } from '../../../probes/useBrowserSession';
import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { Section } from '../../components/Section';
import { StatusLabel } from '../../components/StatusLabel';
import { StatusNotice } from '../../components/StatusNotice';
import { useThrottledValue } from '../../components/useThrottledValue';
import {
  capabilityValueText,
  entryColumns,
  entrySummary,
  filterBySupport,
  SCOPE_LABEL,
  SUPPORT_LABEL,
  SUPPORT_TONE,
  timeText,
  UNIT_LABEL,
  VALUE_STATE_LABEL,
} from '../../data/browser';
import { useQualityLab } from '../../data/context';
import { parseQuery, type Query, queryString } from '../../data/query';
import { noMatchState, queryErrorState } from '../../data/status';
import { Page } from '../../ui';

const PANELS = ['environment', 'capabilities', 'performance'] as const;
type Panel = (typeof PANELS)[number];

const SPEC = {
  keys: ['run', 'panel', 'status'],
  panels: PANELS,
  statuses: BROWSER_SUPPORT,
} as const;

const PANEL_LABEL: Record<Panel, string> = {
  environment: 'Environment',
  capabilities: 'Capabilities',
  performance: 'Performance',
};

const PANEL_GROUPS: Record<Exclude<Panel, 'performance'>, readonly BrowserCapability['group'][]> = {
  environment: ['viewport', 'locale', 'preference', 'input'],
  capabilities: ['connectivity', 'device', 'storage', 'isolation', 'api'],
};

const GROUP_LABEL: Record<BrowserCapability['group'], string> = {
  viewport: '화면',
  locale: '언어·지역',
  preference: '사용자 선호',
  input: '입력',
  connectivity: '연결',
  device: '기기',
  storage: '저장소',
  isolation: '격리',
  api: 'API',
};

/** live region 을 연달아 읽지 않도록 변화 알림은 이 간격에 한 번이다. */
const ANNOUNCE_MS = 2000;
const RECENT_ENTRIES = 20;

const SessionSource = ({ session, run }: { session: BrowserSession; run?: string }) => {
  const rows: [string, string][] = [
    ['출처', 'browser-session — 이 탭에서 지금 읽은 값'],
    ['세션 시작', session.startedAt],
    ['timeOrigin', timeText(session.timeOrigin)],
    [
      '보관',
      '메모리(React state)에만 둡니다. 저장·전송하지 않습니다 — 새로고침하면 새로 측정합니다',
    ],
  ];
  return (
    <Section title="세션 출처" card>
      <dl className="grid grid-cols-[auto_1fr] gap-x-md gap-y-xs text-xsm leading-xsm m-0">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-text-light font-semiBold">{term}</dt>
            <dd className="text-text-default m-0 break-all">{detail}</dd>
          </div>
        ))}
      </dl>
      {run && (
        <p className="text-text-default text-xsm leading-xsm break-keep">
          {`주소의 실행 ${run} 은 저장소 artifact 입니다. 이 화면은 run 을 읽지 않고, 값의 출처·시간이 run 과 다릅니다.`}
        </p>
      )}
      <p className="text-text-light text-xsm leading-xsm break-keep">
        performance entry 는 개별 관측·잠정값이고 저장소 metric 이 아닙니다. CLS 합계·INP 같은 Core
        Web Vitals 가 아닙니다.
      </p>
    </Section>
  );
};

const MatchCount = ({ total, matched }: { total: number; matched: number }) => (
  <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
    {`항목 ${total}개 중 필터와 일치 ${matched}개`}
  </p>
);

const CapabilityView = ({
  title,
  items,
  status,
  onCheckWebgl,
}: {
  title: string;
  items: BrowserCapability[];
  status?: string;
  onCheckWebgl: (() => void) | null;
}) => {
  const matched = filterBySupport(items, status);
  return (
    <Section title={title}>
      <p className="text-text-light text-xsm leading-xsm break-keep">
        false·0 은 측정한 값입니다. 지원 안 함·사용 불가·권한 필요·측정 안 함은 값을 만들지 않고
        이유를 씁니다.
      </p>
      {onCheckWebgl && (
        <div className="flex flex-wrap items-center gap-sm">
          <Button variant="outlined" size="sm" onClick={onCheckWebgl}>
            WebGL context 확인
          </Button>
          <span className="text-text-light text-xsm">
            누를 때만 context 를 하나 만들고 바로 놓습니다. renderer 정보는 읽지 않습니다.
          </span>
        </div>
      )}
      <MatchCount total={items.length} matched={matched.length} />
      {matched.length === 0 ? (
        <StatusNotice
          level={3}
          state={noMatchState(
            `지원 상태 ${status ? (SUPPORT_LABEL[status as keyof typeof SUPPORT_LABEL] ?? status) : '전체'}`,
          )}
        />
      ) : (
        <DataTable
          caption={title}
          headers={['항목', '그룹', '지원', '값 상태', '값', '단위', '측정 시각', '제한 · 이유']}
        >
          {matched.map((item) => (
            <tr key={item.id}>
              <th scope="row">
                {item.label}
                <span className="block">
                  <Mono>{item.id}</Mono>
                </span>
              </th>
              <td>{GROUP_LABEL[item.group]}</td>
              <td>
                <StatusLabel
                  tone={SUPPORT_TONE[item.support]}
                  label={SUPPORT_LABEL[item.support]}
                />
              </td>
              <td>{VALUE_STATE_LABEL[item.state]}</td>
              <td>
                {capabilityValueText(item)}
                {item.detail && (
                  <List className="flex flex-col gap-xs mt-xs">
                    {item.detail.map((detail) => (
                      <ListItem key={detail.name}>
                        <Mono>{detail.name}</Mono>{' '}
                        {detail.value === null ? '제공 안 함' : String(detail.value)}
                      </ListItem>
                    ))}
                  </List>
                )}
              </td>
              <td>{item.unit ? UNIT_LABEL[item.unit] : '단위 없음'}</td>
              <td>{timeText(item.sampleTime)}</td>
              <td>{[item.limitation, item.reason].filter(Boolean).join(' · ') || '없음'}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Section>
  );
};

const EntryTable = ({ item }: { item: RuntimePerformance }) => {
  const shown = item.entries.slice(-RECENT_ENTRIES).reverse();
  if (shown.length === 0) return null;
  const headers = entryColumns(shown[0]).map(([header]) => header);
  return (
    <DataTable
      caption={`${item.entryType} entry — 최근 ${shown.length}개 / 전체 ${item.totalEntries}개`}
      headers={headers}
    >
      {shown.map((entry, index) => {
        const [first, ...rest] = entryColumns(entry);
        return (
          <tr key={`${entry.startTime}-${index}`}>
            <th scope="row">{first[1]}</th>
            {rest.map(([header, text]) => (
              <td key={header}>{text}</td>
            ))}
          </tr>
        );
      })}
    </DataTable>
  );
};

const PerformanceView = ({ items, status }: { items: RuntimePerformance[]; status?: string }) => {
  const matched = filterBySupport(items, status);
  return (
    <Section title="Performance">
      <List className="flex flex-col gap-xs text-text-light text-xsm leading-xsm">
        <ListItem>navigation 은 hard navigation 한 번이고 SPA route 이동 시간이 아닙니다.</ListItem>
        <ListItem>
          cross-origin resource 는 Timing-Allow-Origin 이 없으면 세부 시간·크기가 0 으로 가려집니다
          — 그 0 은 크기가 아닙니다.
        </ListItem>
        <ListItem>
          layout-shift 합계(CLS)·event 최대 지속(INP) 을 계산하지 않습니다. 정식 Web Vitals 는 별도
          의존성·알고리즘 결정 뒤에 구현합니다.
        </ListItem>
        <ListItem>
          시간 단위는 timeOrigin 기준 ms 입니다. 지원 목록(supportedEntryTypes)을 확인한 type 만
          buffered 로 관측합니다.
        </ListItem>
      </List>
      <MatchCount total={items.length} matched={matched.length} />
      {matched.length === 0 ? (
        <StatusNotice level={3} state={noMatchState(`지원 상태 ${status}`)} />
      ) : (
        <DataTable
          caption="Performance entry 관측"
          headers={[
            'entryType',
            '범위',
            '지원',
            '상태',
            'entry 수',
            '최근 entry',
            '측정 시각',
            'provisional',
            '이유',
          ]}
        >
          {matched.map((item) => (
            <tr key={item.entryType}>
              <th scope="row">{item.entryType}</th>
              <td>{SCOPE_LABEL[item.scope]}</td>
              <td>
                <StatusLabel
                  tone={SUPPORT_TONE[item.support]}
                  label={SUPPORT_LABEL[item.support]}
                />
              </td>
              <td>{VALUE_STATE_LABEL[item.state]}</td>
              <td>{item.state === 'sampled' ? String(item.totalEntries) : '없음'}</td>
              <td>{entrySummary(item)}</td>
              <td>{timeText(item.sampleTime)}</td>
              <td>{item.provisional ? '예 — 뒤 entry 로 바뀔 수 있음' : '아니오'}</td>
              <td>{item.reason ?? '없음'}</td>
            </tr>
          ))}
        </DataTable>
      )}
      {matched
        .filter((item) => item.state === 'sampled')
        .map((item) => (
          <EntryTable key={item.entryType} item={item} />
        ))}
    </Section>
  );
};

const Browser = ({
  state,
  query,
  setQuery,
  announcement,
}: {
  state: BrowserSessionState;
  query: Query;
  setQuery: (next: Query) => void;
  announcement: string;
}) => {
  const panel = (query.panel ?? 'environment') as Panel;
  return (
    <>
      <SessionSource session={state.session} run={query.run} />
      <Section title="보기">
        <div role="group" aria-label="보기" className="flex flex-wrap gap-xs">
          {PANELS.map((value) => (
            <Chip
              key={value}
              selected={panel === value}
              onClick={() =>
                setQuery({ ...query, panel: value === 'environment' ? undefined : value })
              }
            >
              {PANEL_LABEL[value]}
            </Chip>
          ))}
        </div>
        <div role="group" aria-label="지원 상태" className="flex flex-wrap gap-xs">
          {[undefined, ...BROWSER_SUPPORT].map((value) => (
            <Chip
              key={value ?? 'all'}
              selected={query.status === value}
              onClick={() => setQuery({ ...query, status: value })}
            >
              {value ? SUPPORT_LABEL[value] : '전체'}
            </Chip>
          ))}
        </div>
        <p role="status" aria-live="polite" className="text-text-light text-xsm leading-xsm">
          {announcement}
        </p>
      </Section>
      {panel === 'performance' ? (
        <PerformanceView items={state.performance} status={query.status} />
      ) : (
        <CapabilityView
          title={PANEL_LABEL[panel]}
          items={state.capabilities.filter((item) => PANEL_GROUPS[panel].includes(item.group))}
          status={query.status}
          onCheckWebgl={panel === 'capabilities' ? state.checkWebgl : null}
        />
      )}
    </>
  );
};

export const BrowserPage = () => {
  const { browserEnv } = useQualityLab();
  const state = useBrowserSession(browserEnv);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const parsed = useMemo(() => parseQuery(params, SPEC), [params]);
  const announcement = useThrottledValue(
    state.changes === 0 ? '' : `환경 값이 바뀌어 다시 읽었습니다 (${state.changes}번째 변화)`,
    ANNOUNCE_MS,
  );

  return (
    <Page path="/browser">
      {parsed.ok ? (
        <Browser
          state={state}
          query={parsed.value}
          setQuery={(next) => navigate({ pathname, search: queryString(next) })}
          announcement={announcement}
        />
      ) : (
        <StatusNotice state={queryErrorState(parsed.issues)} />
      )}
    </Page>
  );
};
