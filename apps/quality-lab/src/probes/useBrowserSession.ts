import { useCallback, useEffect, useState } from 'react';

import type { BrowserSession } from '@berrypjh/observability-contracts';

import { type Capability, combine, type SyncProbe } from './capability';
import {
  apiProbe,
  connectivityProbe,
  deviceProbe,
  initialWebgl,
  isolationProbe,
  webglProbe,
} from './device';
import type { BrowserEnv } from './env';
import { environmentProbe } from './environment';
import { mediaProbe } from './media';
import { initialPerformance, observePerformance, type PerformanceSnapshot } from './performance';
import { peek } from './safe';
import { initialStorage, storageProbe } from './storage';

const SYNC_PROBES: SyncProbe[] = [
  environmentProbe,
  mediaProbe,
  connectivityProbe,
  deviceProbe,
  isolationProbe,
  apiProbe,
];

const sampleSync = (env: BrowserEnv) => SYNC_PROBES.flatMap((probe) => probe.sample(env));

const sessionOf = (env: BrowserEnv): BrowserSession => {
  const timeOrigin = peek(() => env.performance?.timeOrigin);
  return {
    kind: 'browser-session',
    startedAt: new Date(env.now()).toISOString(),
    timeOrigin:
      typeof timeOrigin === 'number' && Number.isFinite(timeOrigin) && timeOrigin >= 0
        ? timeOrigin
        : null,
    persisted: false,
    transmitted: false,
  };
};

export type BrowserSessionState = {
  session: BrowserSession;
  capabilities: Capability[];
  performance: PerformanceSnapshot;
  /** 구독한 값이 바뀐 횟수. 알림 글을 만든다. */
  changes: number;
  checkWebgl: () => void;
};

/**
 * 이 탭의 브라우저 세션. 값은 React state 에만 있고 저장·전송하지 않는다.
 * 모든 구독은 effect cleanup 에서 떼므로 StrictMode 의 재실행에서도 한 벌만 남는다.
 */
export const useBrowserSession = (env: BrowserEnv): BrowserSessionState => {
  const [session] = useState(() => sessionOf(env));
  const [synced, setSynced] = useState(() => sampleSync(env));
  const [storage, setStorage] = useState(() => initialStorage(env));
  const [webgl, setWebgl] = useState(initialWebgl);
  const [performance, setPerformance] = useState(() => initialPerformance(env));
  const [changes, setChanges] = useState(0);

  useEffect(() => {
    const onChange = () => {
      setSynced(sampleSync(env));
      setChanges((count) => count + 1);
    };
    return combine(
      SYNC_PROBES.filter((probe) => probe.detect(env) === 'supported').map((probe) =>
        probe.subscribe(env, onChange),
      ),
    );
  }, [env]);

  useEffect(() => {
    if (storageProbe.detect(env) !== 'supported') return undefined;
    let active = true;
    void storageProbe.sample(env).then((items) => {
      if (active) setStorage(items);
    });
    return () => {
      active = false;
    };
  }, [env]);

  useEffect(() => observePerformance(env, setPerformance), [env]);

  const checkWebgl = useCallback(() => setWebgl(webglProbe.sample(env)[0]), [env]);

  return {
    session,
    capabilities: [...synced, ...storage, webgl],
    performance,
    changes,
    checkWebgl,
  };
};
