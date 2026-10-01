import type { TermItem } from '@berrypjh/devhub-ui';
import type { RunArtifact } from '@berrypjh/observability-contracts';

import type { RunData } from '../use-run-data';

/** 평가 항목 본문이 받는 것: 고른 실행 전체, 주소 상태, 그 영역을 가진 다른 실행(모르면 null). */
export type MeasureProps = {
  run: RunArtifact;
  data: RunData;
  alternatives: string[] | null;
};

/** 상세 칸 개요에 두는 이름 · 뜻 목록과 그 제목 ("표 컬럼" · "용어"). */
export type Terms = { title: string; items: readonly TermItem[] };
