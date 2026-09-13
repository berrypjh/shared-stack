import { createContext, type ReactNode, useContext } from 'react';

import type { Client, Fetcher } from './client';

export type QualityLab = { client: Client; fetcher: Fetcher; expectedSha: string };

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
