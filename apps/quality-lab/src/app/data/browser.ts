/**
 * 브라우저 세션 값을 글로. 지원 상태·값 상태를 섞지 않고, 읽지 않은 값에 false·0 을 만들지 않는다.
 */
import type {
  BrowserCapability,
  BrowserSupport,
  BrowserValueState,
  PerformanceEntrySample,
  RuntimePerformance,
} from '@berrypjh/observability-contracts';

import { formatBytes, formatInteger } from './format';

export const SUPPORT_LABEL: Record<BrowserSupport, string> = {
  supported: '지원',
  unsupported: '지원 안 함',
  unavailable: '사용 불가',
  'permission-required': '권한 필요',
  'not-measured': '측정 안 함',
};

/** StatusLabel 의 장식 아이콘을 고르는 tone. 글이 상태를 말한다. */
export const SUPPORT_TONE: Record<BrowserSupport, string> = {
  supported: 'passed',
  unsupported: 'unsupported',
  unavailable: 'failed',
  'permission-required': 'timeout',
  'not-measured': 'not-run',
};

export const VALUE_STATE_LABEL: Record<BrowserValueState, string> = {
  sampled: '측정됨',
  'awaiting-sample': '표본 대기',
  error: '오류',
  'not-sampled': '읽지 않음',
};

export const SCOPE_LABEL: Record<RuntimePerformance['scope'], string> = {
  'hard-navigation': 'hard navigation 한 번 (SPA route 이동 아님)',
  'document-lifetime': 'timeOrigin 부터 문서 전체 (route 별 아님)',
  interaction: '개별 입력 이벤트 (INP 아님)',
};

export const UNIT_LABEL: Record<NonNullable<BrowserCapability['unit']>, string> = {
  'css-px': 'CSS px',
  ratio: '배율',
  count: '개수',
  bytes: 'bytes',
  GiB: 'GiB',
  ms: 'ms',
  Mbps: 'Mbps',
};

const UNIT_SUFFIX: Record<NonNullable<BrowserCapability['unit']>, string> = {
  'css-px': ' CSS px',
  ratio: '',
  count: '개',
  bytes: '',
  GiB: ' GiB',
  ms: ' ms',
  Mbps: ' Mbps',
};

const TIMING_ALLOW_LABEL = {
  'same-origin': '같은 origin',
  'cross-origin-exposed': 'cross-origin · 공개됨',
  'cross-origin-restricted': 'cross-origin · TAO 없음',
} as const;

export const capabilityValueText = (item: BrowserCapability): string => {
  if (item.state === 'awaiting-sample') return '표본 대기 — 아직 값이 없음 (0 아님)';
  if (item.state === 'error') return '값 없음 — 오류';
  if (item.state === 'not-sampled' || item.value === null) {
    return item.support === 'supported'
      ? '아직 읽지 않음'
      : `값 없음 — ${SUPPORT_LABEL[item.support]}`;
  }
  const { value, unit } = item;
  const text = Array.isArray(value)
    ? value.join(', ')
    : typeof value === 'boolean'
      ? `${value} (측정값)`
      : typeof value === 'number'
        ? unit === 'bytes'
          ? formatBytes(value)
          : `${formatInteger(value)}${unit ? UNIT_SUFFIX[unit] : ''}`
        : value;
  return item.approximate ? `${text} (근사)` : text;
};

export const filterBySupport = <T extends { support: BrowserSupport }>(
  items: T[],
  status: string | undefined,
): T[] => (status ? items.filter((item) => item.support === status) : items);

export const msText = (ms: number) => `${ms.toFixed(1)} ms`;

/** 측정 시각. 브라우저 time zone 과 무관하게 같은 글이 되도록 ISO 로 쓴다. */
export const timeText = (epochMs: number | null) =>
  epochMs === null ? '없음' : new Date(epochMs).toISOString();

type ResourceSample = Extract<PerformanceEntrySample, { entryType: 'resource' }>;

export const resourceTransferText = (entry: ResourceSample) => {
  switch (entry.transferMeaning) {
    case 'absent':
      return '제공 안 함';
    case 'zero-timing-restricted':
      return '0 — TAO 로 가려짐 (크기 아님)';
    case 'zero-cache-or-local':
      return '0 B — 캐시·로컬 응답일 수 있음';
    case 'measured':
      return entry.transferSize === null ? '제공 안 함' : formatBytes(entry.transferSize);
  }
};

const bodySizeText = (size: number | null, entry: ResourceSample) => {
  if (size === null) return '제공 안 함';
  if (size === 0 && entry.timingAllow === 'cross-origin-restricted') return '0 — TAO 로 가려짐';
  return formatBytes(size);
};

const optionalBytes = (size: number | null) => (size === null ? '제공 안 함' : formatBytes(size));

export const entryText = (entry: PerformanceEntrySample): string => {
  switch (entry.entryType) {
    case 'navigation':
      return `loadEventEnd ${msText(entry.loadEventEnd)} (${entry.name})`;
    case 'resource':
      return `${entry.name} · duration ${msText(entry.duration)}`;
    case 'paint':
      return `${entry.name} · startTime ${msText(entry.startTime)}`;
    case 'largest-contentful-paint':
      return `renderTime ${msText(entry.renderTime)} · size ${formatInteger(entry.size)}`;
    case 'layout-shift':
      return `value ${entry.value} · startTime ${msText(entry.startTime)}`;
    case 'longtask':
      return `duration ${msText(entry.duration)} · startTime ${msText(entry.startTime)}`;
    case 'event':
    case 'first-input':
      return `${entry.name} · duration ${msText(entry.duration)}`;
  }
};

/** entry type 한 줄 요약. 표본이 없으면 숫자 대신 상태다. */
export const entrySummary = (item: RuntimePerformance) => {
  if (item.state === 'awaiting-sample') return '표본 대기 — entry 가 아직 없음 (0 아님)';
  if (item.support !== 'supported' || item.state === 'error') {
    return `${SUPPORT_LABEL[item.support]} — ${item.reason ?? '이유 없음'}`;
  }
  const last = item.entries[item.entries.length - 1];
  return last ? entryText(last) : '아직 관측하지 않음';
};

/** 상세 표의 열. 첫 열이 행 머리다. */
export const entryColumns = (entry: PerformanceEntrySample): [string, string][] => {
  const time: [string, string][] = [
    ['startTime', msText(entry.startTime)],
    ['duration', msText(entry.duration)],
  ];
  switch (entry.entryType) {
    case 'navigation':
      return [
        ['경로 (query 제외)', entry.name],
        ['type', entry.navigationType],
        ...time,
        ['responseStart', msText(entry.responseStart)],
        ['domContentLoadedEventEnd', msText(entry.domContentLoadedEventEnd)],
        ['loadEventEnd', msText(entry.loadEventEnd)],
        ['transferSize', optionalBytes(entry.transferSize)],
      ];
    case 'resource':
      return [
        ['이름 (query 제외)', entry.name],
        ['initiator', entry.initiatorType],
        ...time,
        ['Timing-Allow-Origin', TIMING_ALLOW_LABEL[entry.timingAllow]],
        ['transferSize', resourceTransferText(entry)],
        ['encodedBodySize', bodySizeText(entry.encodedBodySize, entry)],
        ['decodedBodySize', bodySizeText(entry.decodedBodySize, entry)],
      ];
    case 'paint':
      return [['이름', entry.name], ...time];
    case 'largest-contentful-paint':
      return [
        ['startTime', msText(entry.startTime)],
        ['renderTime', msText(entry.renderTime)],
        ['loadTime', msText(entry.loadTime)],
        ['size', formatInteger(entry.size)],
      ];
    case 'layout-shift':
      return [
        ['startTime', msText(entry.startTime)],
        ['value', String(entry.value)],
        ['hadRecentInput', String(entry.hadRecentInput)],
      ];
    case 'longtask':
      return time;
    case 'event':
    case 'first-input':
      return [['이벤트', entry.name], ...time, ['interactionId', String(entry.interactionId)]];
  }
};
