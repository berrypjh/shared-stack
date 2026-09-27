import type { SourceRef as Ref } from '@berrypjh/observability-contracts';

import { refText } from '@/lib/evaluation/design-system';

import { Mono } from '../mono';

/** 근거 위치. 없으면 무엇이 없는지 글로 쓴다. */
export const SourceRef = ({ value, empty }: { value: Ref | null; empty: string }) =>
  value ? <Mono>{refText(value)}</Mono> : <span className="text-text-light">{empty}</span>;

/** 한 칸에 여러 근거 위치를 한 줄씩. */
export const SourceRefLines = ({ refs }: { refs: Ref[] }) =>
  refs.map((ref) => (
    <span key={refText(ref)} className="block">
      <Mono>{refText(ref)}</Mono>
    </span>
  ));
