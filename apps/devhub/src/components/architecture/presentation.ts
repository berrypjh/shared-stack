import { type LegendItem } from '@berrypjh/devhub-ui';

import type { Relation } from '@/domain/model';
import type { ArchNode } from '@/lib/catalog/architecture';
import { entityById } from '@/lib/catalog/entities';
import { APP_ROLE, PLATFORM, RELATION_KIND, VISIBILITY } from '@/lib/catalog/labels';

/** 관계 종류마다의 선 모양. 색이 아니라 모양과 라벨 글자로 구분한다. 범례도 여기서 만든다. */
export const DASH: Record<Relation['kind'], string | null> = {
  'consumer-dependency': null,
  'build-dependency': '2 4',
  'generated-artifact': '8 4',
  verification: '8 3 2 3',
};

/** 공개 경계: 저장소 밖으로 배포되는 패키지는 이중 테두리, 도구는 점선 상자. 글자로도 같은 것을 말한다. */
export const BOX = {
  public: 'border-[3px] border-double border-stroke-dark',
  tool: 'border border-dashed border-stroke-default',
  plain: 'border border-stroke-light',
} as const;

export const boxOf = (node: ArchNode) =>
  node.visibility === 'public' ? BOX.public : node.kind === 'tool' ? BOX.tool : BOX.plain;

export const LEGEND: LegendItem[] = [
  { box: 'double', label: '공개 패키지 — 저장소 밖으로 배포된다' },
  { box: 'solid', label: '앱 · 내부 패키지' },
  { box: 'dashed', label: '도구 (tools/ · plugins/)' },
  ...(Object.keys(DASH) as Relation['kind'][]).map((kind) => ({
    line: DASH[kind],
    label: `${RELATION_KIND[kind]}`,
  })),
];

const KIND: Record<ArchNode['kind'], string> = {
  application: '애플리케이션',
  package: '패키지',
  tool: '도구',
};

/** 노드의 종류 글 한 줄. 그림의 상자 모양과 같은 것을 글자로 말한다. */
export const kindLine = (node: ArchNode) => {
  const entity = entityById(node.id);
  if (node.kind === 'package' && node.visibility) {
    return `${KIND.package} · ${VISIBILITY[node.visibility]}`;
  }
  if (entity?.section === 'applications') {
    return `${KIND.application} · ${APP_ROLE[entity.record.role]}`;
  }
  return KIND[node.kind];
};

export const platformLine = (node: ArchNode) => PLATFORM[node.platform];

/** 노드의 그림 · 목록 주소. 필터는 유지한다. */
export const nodeHref = (id: string, query: string) => `/architecture/${id}${query}`;
