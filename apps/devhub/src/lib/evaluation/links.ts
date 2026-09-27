import type { RunFailure } from '@berrypjh/observability-contracts';

import { queryString } from './query';
import { screenPath } from './screens';

/** context id 의 scope → AI 평가 화면의 panel. */
const CONTEXT_PANEL: Record<string, string> = {
  'package-scenario': 'scenario',
  'variant-initial': 'initial',
  'variant-routed': 'routed',
  'agent-input': 'agent-input',
};

/** 실패 행에서 그 근거를 보여주는 화면으로. 필터까지 주소에 담아 한 번에 도착한다. */
export const failureHref = (failure: RunFailure, run: string): string => {
  switch (failure.domain) {
    case 'package-surface':
      return `${screenPath('packages')}${queryString({ run, package: failure.scope })}`;
    case 'bundle':
      return `${screenPath('bundles')}${queryString({ run })}#bundle-${failure.id}`;
    case 'context': {
      const panel = CONTEXT_PANEL[failure.id.split('.')[1] ?? ''];
      return `${screenPath('ai')}${queryString({ run, panel })}#context-${failure.id}`;
    }
    case 'eval':
      return `${screenPath('ai')}${queryString({ run })}`;
    default:
      return `${screenPath('runs')}${queryString({ run })}#observations`;
  }
};
