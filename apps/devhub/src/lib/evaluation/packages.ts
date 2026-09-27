import type { PackageSurface } from '@berrypjh/observability-contracts';

import { REGENERATED_LABEL } from './labels';

/** 패키지 표면 화면이 읽는 query. */
export const PACKAGES_QUERY = { keys: ['run', 'package'] } as const;

export const SURFACE_HEADERS = [
  '패키지',
  '공개',
  'build',
  'exports 산출물',
  'bin',
  'tokens 복사본',
  'catalog',
  '근거 test',
];

export const EMITTED_HEADERS = ['subpath', '조건', 'target', '산출물'];

const present = <T extends { status: string }>(entries: T[]) =>
  entries.filter((entry) => entry.status === 'present').length;

/** 선언한 대상 중 실제로 있는 수. partial 을 성공으로 두지 않도록 분모를 함께 쓴다. */
export const presentText = <T extends { status: string }>(entries: T[]) =>
  `${present(entries)}/${entries.length} 있음`;

export const binText = (bin: PackageSurface['emittedBin']) =>
  bin.length === 0 ? '선언 안 함' : presentText(bin);

export const tokensCopyText = (copy: PackageSurface['tokensCopy']) => {
  if (copy === null) return '비교 대상 아님';
  if (copy.status === 'missing') return `없음 — ${copy.path}`;
  if (copy.identicalToDesignTokens === null) return '비교할 수 없음';
  return copy.identicalToDesignTokens ? '원본과 같음' : '원본과 다름';
};

export const catalogText = (catalog: PackageSurface['catalog']) =>
  catalog === null
    ? '선언 안 함'
    : `${catalog.status} · ${REGENERATED_LABEL[catalog.regenerated]}${catalog.regeneratedReason ? ` — ${catalog.regeneratedReason}` : ''}`;

/** 근거 test 는 위치일 뿐이다 — 이 수집은 그 test 를 실행하지 않았다. */
export const evidenceKindText = (kind: PackageSurface['tests'][number]['evidenceKind']) =>
  kind === 'source-assertion' ? 'source 단언' : '동작 단언';
