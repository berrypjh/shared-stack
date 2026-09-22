/**
 * 라이트 · 다크만 쓴다. react-ui 토큰은 `data-theme` 로 바뀐다(`:root` 라이트, `[data-theme="dark"]` 다크).
 * `<html>` 에 두어 body 배경과 스크롤바까지 따라오게 한다. 첫 paint 전 적용은 `themeScript` 를
 * 문서 `<head>` 에 인라인으로 넣어서 한다.
 */
export type ThemeMode = 'light' | 'dark';

export const THEME_KEY = 'devhub-theme';

/**
 * `<head>` 에 넣는 인라인 스크립트. 저장된 선택을, 없으면 OS 설정을 첫 그리기 전에 적용해서
 * 페이지가 반대 테마로 깜빡이지 않게 한다. 저장소를 못 쓸 수도 있다.
 */
export const themeScript = `(function () {
  var mode;
  try { mode = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
  if (mode !== 'light' && mode !== 'dark') {
    mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = mode;
})();`;

export const currentTheme = (): ThemeMode =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

/** `<html data-theme>` 가 바뀔 때마다 `onChange` 를 부른다. 구독 해제 함수를 돌려준다. */
export const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};

/** `mode` 를 적용하고 브라우저별로 남긴다. 저장소가 막히면 새로고침 전까지만 유지된다. */
export const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // 저장소 차단(사생활 보호 모드 · 정책). 화면 전환은 그대로 된다.
  }
};
