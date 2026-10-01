import { type ReactNode, useMemo } from 'react';

import { type DevHubLinkProps, DevHubProvider } from '@berrypjh/devhub-ui';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { PRODUCT_NAME } from '@/lib/catalog/entities';

/** 라이브러리의 `to` 를 react-router 의 `to` 로. */
const RouterLink = ({ to, ...rest }: DevHubLinkProps) => <Link to={to} {...rest} />;

/**
 * devhub-ui 의 셸 · 검색 · 넘김이 쓰는 라우터 접점. react-router 안(`BrowserRouter` · `MemoryRouter`)에 둔다.
 * 위치가 바뀔 때만 새 값을 만들어 셸이 불필요하게 다시 그려지지 않게 한다.
 */
export const RouterAdapter = ({ children }: { children: ReactNode }) => {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const router = useMemo(
    () => ({ Link: RouterLink, location: { pathname, hash }, navigate }),
    [pathname, hash, navigate],
  );
  return (
    <DevHubProvider productName={PRODUCT_NAME} router={router}>
      {children}
    </DevHubProvider>
  );
};
