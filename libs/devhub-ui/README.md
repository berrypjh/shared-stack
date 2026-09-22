# @berrypjh/devhub-ui

저장소마다 두는 내부 도구 DevHub 의 공용 화면. 셸(상단 바 · 탐색기 · 작업 영역 · 상세 정보), 이동 · 확대 그림, 저장소 markdown 렌더러, 검색 순위, 테마, 아이콘을 담는다. 카탈로그(무엇을 보여 줄지)는 각 저장소의 DevHub 앱이 갖는다.

## 설치

```bash
pnpm add @berrypjh/devhub-ui @berrypjh/react-ui
```

`react` · `react-dom` 19 와 `@berrypjh/react-ui` 가 peer 다.

## 스타일

앱의 Tailwind entry 에서 react-ui 의 CSS 다음에 들인다. `@utility` 가 들어 있어 Tailwind 가 해석해야 한다.

```css
@import 'tailwindcss';
@config './tailwind.config.js'; /* @berrypjh/react-ui/tailwind preset */
@import '@berrypjh/devhub-ui/styles.css';
@source '../node_modules/@berrypjh/devhub-ui/dist';
```

`@source` 가 없으면 컴포넌트가 쓰는 Tailwind 클래스가 생성되지 않는다.

## 라우터 연결

라우터가 다른 앱(Next.js · react-router)이 같은 셸을 쓴다. 앱 루트에서 `DevHubProvider` 로 `Link` · 현재 위치 · `navigate` 를 넘긴다.

```tsx
import { DevHubProvider, type DevHubLinkProps } from '@berrypjh/devhub-ui';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const RouterLink = ({ to, ...rest }: DevHubLinkProps) => <Link to={to} {...rest} />;

export const App = () => {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const router = useMemo(
    () => ({ Link: RouterLink, location: { pathname, hash }, navigate }),
    [pathname, hash, navigate],
  );
  return (
    <DevHubProvider productName="My DevHub" router={router}>
      …
    </DevHubProvider>
  );
};
```

Next.js 에서는 `next/link` 의 `href` 로 `to` 를 넘기고, `usePathname()` · `useRouter().push` 를 쓴다.

## 첫 paint 전 테마

`themeScript` 를 문서 `<head>` 의 인라인 `<script>` 로 넣는다. 저장 키는 `THEME_KEY` 다.
