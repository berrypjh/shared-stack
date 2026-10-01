'use client';

import {
  type ComponentType,
  createContext,
  type FocusEventHandler,
  type ReactNode,
  useContext,
} from 'react';

import type { ThemePair } from '../theme/theme';

/** 앱 안 링크. Next 는 `href`, react-router 는 `to` 로 받으므로 앱이 어댑터 하나를 넘긴다. */
export type DevHubLinkProps = {
  to: string;
  className?: string;
  'aria-current'?: 'page' | 'location' | 'true';
  'aria-label'?: string;
  title?: string;
  onFocus?: FocusEventHandler<HTMLAnchorElement>;
  children?: ReactNode;
};

export type DevHubLocation = { pathname: string; hash: string };

/** 라우터가 다른 두 앱(Next · react-router)이 같은 셸을 쓰기 위한 접점. 셸 · 검색 · 넘김이 이것만 본다. */
export type DevHubRouter = {
  Link: ComponentType<DevHubLinkProps>;
  location: DevHubLocation;
  navigate: (to: string) => void;
};

export type DevHubConfig = {
  /** 상단 바와 문서 제목(`<title>`)에 쓰는 제품 이름. */
  productName: string;
  router: DevHubRouter;
  /** 라이트 · 다크 모드마다 쓸 디자인 토큰 테마. 없으면 `light` · `dark`(`DEFAULT_THEME_PAIR`). */
  themePair?: ThemePair;
};

const DevHubContext = createContext<DevHubConfig | null>(null);

/** 앱 루트(라우터 안)에 한 번 둔다. `router` 는 라우터 훅으로 만들어 넘긴다. */
export const DevHubProvider = ({ children, ...config }: DevHubConfig & { children: ReactNode }) => (
  <DevHubContext.Provider value={config}>{children}</DevHubContext.Provider>
);

export const useDevHub = (): DevHubConfig => {
  const config = useContext(DevHubContext);
  if (!config) throw new Error('DevHubProvider 가 없습니다');
  return config;
};

export const useDevHubLink = () => useDevHub().router.Link;
export const useDevHubLocation = () => useDevHub().router.location;
export const useDevHubNavigate = () => useDevHub().router.navigate;
