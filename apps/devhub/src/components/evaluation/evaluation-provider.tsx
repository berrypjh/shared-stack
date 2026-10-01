import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { type Client, createClient, type Fetcher } from '@/lib/evaluation/client';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

/** 전역 `fetch` 는 부를 때 읽는다. */
const browserFetch: Fetcher = (url, init) => fetch(url, init);

/**
 * 평가가 읽는 곳과 비교 기준. 기본은 브라우저 fetch 와 build 스냅샷의 커밋이다.
 * 테스트는 이 context 로 가짜 fetch 와 기준 SHA 를 넣는다 — 앱 코드는 바꾸지 않는다.
 */
export type EvaluationSource = { fetcher: Fetcher; expectedSha: string };

export const EvaluationSourceContext = createContext<EvaluationSource>({
  fetcher: browserFetch,
  expectedSha: SNAPSHOT.commit ?? 'unknown',
});

const EvaluationContext = createContext<Client | null>(null);

/** 평가 화면들이 나눠 쓰는 client. 평가 안에서 화면을 오가도 같은 파일을 다시 받지 않는다. */
export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  const { fetcher, expectedSha } = useContext(EvaluationSourceContext);
  const client = useMemo(() => createClient(fetcher, expectedSha), [fetcher, expectedSha]);
  return <EvaluationContext value={client}>{children}</EvaluationContext>;
};

export const useEvaluationClient = (): Client => {
  const client = useContext(EvaluationContext);
  if (!client) throw new Error('EvaluationProvider 안에서만 쓸 수 있다');
  return client;
};
