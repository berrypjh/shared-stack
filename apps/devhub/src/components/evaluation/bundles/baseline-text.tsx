import type { OtherRun } from '@/components/evaluation/use-run-data';
import type { BaselineCell } from '@/lib/evaluation/bundles';
import { deltaText } from '@/lib/evaluation/bundles';
import { formatBytes } from '@/lib/evaluation/format';

/** baseline 실행을 아직 못 읽었을 때 칸이 대신 쓰는 글. 준비됐거나 고르지 않았으면 없다. */
export const BASELINE_PENDING: Record<OtherRun['status'], string | null> = {
  idle: null,
  ready: null,
  loading: 'baseline 실행을 불러오는 중이다',
  error: 'baseline 실행을 읽지 못했다',
};

/** budget 행 하나의 baseline 칸. delta 는 `compareBundle` 조건이 모두 같을 때만 보인다. */
export const BaselineText = ({ cell, pending }: { cell: BaselineCell; pending: string | null }) => {
  if (pending) return <span className="text-text-light">{pending}</span>;
  switch (cell.status) {
    case 'no-baseline':
    case 'missing':
      return <span className="text-text-light">{cell.reason}</span>;
    case 'not-comparable':
      return <span>{`비교 불가 — ${cell.reasons.join(', ')}`}</span>;
    case 'compared':
      return (
        <span className="flex flex-col">
          <span>{`baseline ${formatBytes(cell.baselineValue)}`}</span>
          <span>{deltaText(cell.deltaBytes, cell.relativeDelta)}</span>
        </span>
      );
  }
};
