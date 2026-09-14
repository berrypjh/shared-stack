import { createContext, type ReactNode, useContext } from 'react';

import type { BrowserEnv } from '../../probes/env';

import type { Client, Fetcher } from './client';

/** `browserEnv` 는 브라우저 세션 화면이 읽는 API 표면이다. artifact client 와 출처가 다르다. */
export type QualityLab = {
  client: Client;
  fetcher: Fetcher;
  expectedSha: string;
  browserEnv: BrowserEnv;
};

const QualityLabContext = createContext<QualityLab | null>(null);

export const QualityLabProvider = ({
  value,
  children,
}: {
  value: QualityLab;
  children: ReactNode;
}) => <QualityLabContext.Provider value={value}>{children}</QualityLabContext.Provider>;

export const useQualityLab = (): QualityLab => {
  const value = useContext(QualityLabContext);
  if (!value) throw new Error('QualityLabProvider 안에서만 쓸 수 있습니다');
  return value;
};
