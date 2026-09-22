import { type IconName } from '@berrypjh/devhub-ui';

import type { SectionId, ViewId } from '@/lib/catalog/entities';

/**
 * 이동해 가는 곳마다 아이콘 하나. 그 곳을 부르는 자리(상단 바 · 탐색기 · 작업 영역 `eyebrow`)
 * 모두에서 써서 같은 모양이 어디서나 같은 곳을 뜻하게 한다.
 */
export const SECTION_ICON: Record<SectionId, IconName> = {
  journeys: 'flow',
  applications: 'application',
  packages: 'package',
  engineering: 'engineering',
  documents: 'document',
  records: 'record',
};

export const VIEW_ICON: Record<ViewId, IconName> = {
  overview: 'home',
  architecture: 'architecture',
  ...SECTION_ICON,
};
