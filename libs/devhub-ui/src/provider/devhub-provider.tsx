'use client';

import {
  type ComponentType,
  createContext,
  type FocusEventHandler,
  type ReactNode,
  useContext,
} from 'react';

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

/** `href` 가 현재 경로인가. `exact` 가 아니면 그 아래 경로도 현재다(섹션 보기가 항목 주소에서도 현재). */
export const isCurrentPath = (pathname: string, href: string, exact: boolean) =>
  exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
