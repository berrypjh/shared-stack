import type { ThemeName } from '@berrypjh/react-ui';

/**
 * 화면이 고르는 것은 논리 색 모드(라이트 · 다크) 하나다. 모드마다 `<html data-theme>` 에 어떤 디자인 토큰
 * 테마를 쓸지는 `ThemePair` 가 정한다 — 기본은 react-ui 의 `light` · `dark` 다(`:root` 라이트,
 * `[data-theme="dark"]` 다크). `<html>` 에 두어 body 배경과 스크롤바까지 따라오게 한다. 첫 paint 전 적용은
 * `themeScript`(또는 `createThemeScript(pair)`)를 문서 `<head>` 에 인라인으로 넣어서 한다.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 논리 모드 → `data-theme` 에 쓸 토큰 테마. 저장소에는 모드만 남으므로 짝을 바꿔도 저장된 선택은 그대로다.
 * `styles.css` 의 `color-scheme` 은 기본 짝(`dark`)만 안다 — 다른 다크 테마를 쓰는 앱은 그 테마의
 * `color-scheme: dark` 를 스스로 둔다.
 */
export type ThemePair = Readonly<Record<ThemeMode, ThemeName>>;

export const DEFAULT_THEME_PAIR: ThemePair = { light: 'light', dark: 'dark' };

export const THEME_KEY = 'devhub-theme';

/**
 * `<head>` 에 넣는 인라인 스크립트를 만든다. 저장된 모드를, 없거나 모르는 값이면 OS 설정을 첫 그리기 전에
 * `pair` 의 테마로 적용해서 페이지가 반대 테마로 깜빡이지 않게 한다. 저장소를 못 쓸 수도 있다.
 */
export const createThemeScript = (pair: ThemePair = DEFAULT_THEME_PAIR) => `(function () {
  var mode;
  try { mode = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
  if (mode !== 'light' && mode !== 'dark') {
    mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = ${JSON.stringify({ light: pair.light, dark: pair.dark })}[mode];
})();`;

/** 기본 짝(`light` · `dark`)의 첫 paint 스크립트. */
export const themeScript = createThemeScript();

/** `<html data-theme>` 를 논리 모드로 되돌린다. `pair.dark` 가 아니면 라이트다. */
export const currentTheme = (pair: ThemePair = DEFAULT_THEME_PAIR): ThemeMode =>
  document.documentElement.dataset.theme === pair.dark ? 'dark' : 'light';

/** `<html data-theme>` 가 바뀔 때마다 `onChange` 를 부른다. 구독 해제 함수를 돌려준다. */
export const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};

/**
 * `mode` 에 짝지은 테마를 적용하고 모드를 브라우저별로 남긴다(테마 이름이 아니라 `light` · `dark`).
 * 저장소가 막히면 새로고침 전까지만 유지된다.
 */
export const applyTheme = (mode: ThemeMode, pair: ThemePair = DEFAULT_THEME_PAIR) => {
  document.documentElement.dataset.theme = pair[mode];
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // 저장소 차단(사생활 보호 모드 · 정책). 화면 전환은 그대로 된다.
  }
};
