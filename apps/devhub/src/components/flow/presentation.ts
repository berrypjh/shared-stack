import { type LegendItem } from '@berrypjh/devhub-ui';

import type { StepStatus } from '@/domain/model';
import { linkOf } from '@/lib/catalog/entities';
import { STEP_STATUS } from '@/lib/catalog/labels';

/** 상태 글 한 줄: 글리프와 글자. 색만으로 구분하지 않는다. */
export const statusLine = (status: StepStatus) =>
  `${STEP_STATUS[status].glyph} ${STEP_STATUS[status].label}`;

/** 담당 항목의 이름. 카탈로그 ID 가 앱 · 패키지 · 도구를 가리킨다. */
export const ownerLabel = (id: string) => linkOf(id)?.label ?? id;

/** 저장소 밖 단계는 점선 상자. 글자로도 같은 것을 말한다. */
export const boxOf = (status: StepStatus) =>
  status === 'documented-only'
    ? 'border border-dashed border-stroke-default'
    : 'border border-stroke-light';

export const LEGEND: LegendItem[] = [
  {
    box: 'solid',
    label: `${statusLine('implemented')} · ${statusLine('partial')} — 저장소 소스가 있음`,
  },
  {
    box: 'dashed',
    label: `${statusLine('documented-only')} — 에이전트 · 사람이 하는 단계, 문서가 안내함`,
  },
  { line: null, label: '다음 단계' },
];
