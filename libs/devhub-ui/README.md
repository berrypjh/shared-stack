# @berrypjh/devhub-ui

저장소마다 두는 내부 도구 DevHub의 공용 화면. 셸(상단 바 · 탐색기 · 작업 영역 · 상세 정보), 이동 · 확대 그림, 막대 차트(`BarChart`) · 데이터 표(`DataTable`), 저장소 markdown 렌더러, 검색 순위, 테마, 아이콘을 담는다. 카탈로그(무엇을 보여 줄지)는 각 저장소의 DevHub 앱이 갖는다.

## 설치

```bash
pnpm add @berrypjh/devhub-ui @berrypjh/react-ui
```

`react` · `react-dom` 19와 `@berrypjh/react-ui`가 peer다.

## 스타일

앱의 Tailwind entry에서 react-ui의 CSS 다음에 들인다. `@utility`가 들어 있어 Tailwind가 해석해야 한다.

```css
@import 'tailwindcss';
@config './tailwind.config.js'; /* @berrypjh/react-ui/tailwind preset */
@import '@berrypjh/devhub-ui/styles.css';
@source '../node_modules/@berrypjh/devhub-ui/dist';
```

`@source`가 없으면 컴포넌트가 쓰는 Tailwind 클래스가 생성되지 않는다.

## 라우터 연결

라우터가 다른 앱(Next.js · react-router)이 같은 셸을 쓴다. 앱 루트에서 `DevHubProvider`로 `Link` · 현재 위치 · `navigate`를 넘긴다.

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

Next.js에서는 `next/link`의 `href`로 `to`를 넘기고, `usePathname()` · `useRouter().push`를 쓴다.

## 테마

화면이 고르는 것은 논리 모드(`ThemeMode` — `light` · `dark`)이고, `ThemeSwitch`는 라이트 · 다크 두 버튼이다. 모드마다 `<html data-theme>`에 쓸 react-ui 토큰 테마는 `ThemePair`가 정한다. 기본은 `DEFAULT_THEME_PAIR`(`{ light: 'light', dark: 'dark' }`)라 짝을 넘기지 않으면 예전과 같다.

```tsx
import type { ThemePair } from '@berrypjh/devhub-ui';

const THEME_PAIR = { light: 'ivory', dark: 'charcoal' } as const satisfies ThemePair;

<DevHubProvider productName="My DevHub" router={router} themePair={THEME_PAIR}>
  …
</DevHubProvider>;
```

- 저장 키는 `THEME_KEY`(`devhub-theme`)이고 값은 늘 모드(`light` · `dark`)다. 테마 이름은 저장하지 않는다
- 첫 paint 전 적용은 `<head>`의 인라인 `<script>`다. 기본 짝은 `themeScript`, 다른 짝은 `createThemeScript(pair)`의 결과를 넣는다. 저장값이 없거나 모르는 값이면 OS 설정을 따른다
- `styles.css`의 `color-scheme`은 기본 짝(`dark`)만 안다. 다른 다크 테마를 쓰면 앱이 `:root[data-theme='<name>'] { color-scheme: dark; }`를 둔다
- `ivory` · `charcoal`에서는 `styles.css`가 셸에 editorial 모양(캔버스 배경 · 작은 각 · 큰 페이지 제목 · 중립 선택)을 더한다. 다른 테마에서는 바뀌지 않는다
