import { ContextPanels } from '../ai/context-panels';

import type { MeasureProps } from './types';

/** 컨텍스트 토큰: 측정 범위마다 token 막대와 표. 범위가 다른 token 수는 한 차트 · 표에 섞지 않는다. */
export const ContextTokens = ({ run, data }: MeasureProps) => (
  <ContextPanels run={run} data={data} />
);
