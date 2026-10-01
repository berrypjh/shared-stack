import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { type DevHubLinkProps, DevHubProvider } from '../src/provider/devhub-provider';

/**
 * `DevHubProvider` 의 라우터 자리를 채우는 이야기용 어댑터. 실제 앱은 `react-router-dom` ·
 * Next 의 `Link` 를 준다(`apps/devhub/src/components/shell/router-adapter.tsx`). 여기서는
 * Storybook 이야기 하나가 페이지를 떠나지 않도록 `href` 만 있는 `<a>` 로 만족하고 누르면 막는다 —
 * 그래도 브라우저가 여전히 앵커로 보므로 `Tab` · hover 밑줄 같은 링크 동작은 그대로 확인된다.
 */
const StoryLink = ({ to, children, ...rest }: DevHubLinkProps) => (
  <a
    href={to}
    {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
    onClick={(event) => event.preventDefault()}
  >
    {children}
  </a>
);

export const StoryRouter = ({
  pathname = '/',
  hash = '',
  productName = 'DevHub',
  onNavigate,
  children,
}: {
  /** 이 이야기가 "현재"라고 치는 주소. `aria-current` 를 보이는 story 가 바꿔 쓴다. */
  pathname?: string;
  hash?: string;
  productName?: string;
  /** `navigate()` 를 부르면(검색 결과 선택 등) 알림. 기본은 콘솔에만 남긴다. */
  onNavigate?: (to: string) => void;
  children: ReactNode;
}) => (
  <DevHubProvider
    productName={productName}
    router={{
      Link: StoryLink,
      location: { pathname, hash },
      navigate: (to) =>
        (onNavigate ?? ((path: string) => console.info('[DevHub] navigate:', path)))(to),
    }}
  >
    {children}
  </DevHubProvider>
);
