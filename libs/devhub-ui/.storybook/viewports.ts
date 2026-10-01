/**
 * `preview.ts`(뷰포트 도구)와 `test-runner.ts`(실제 Playwright 창 크기)가 함께 쓰는 크기 표.
 * `INITIAL_VIEWPORTS`(addon-viewport 기본 목록)와 달리 DevHub 셸이 실제로 나뉘는 지점(`lg` · `xl`)에
 * 맞춘 세 크기다. 하나만 두는 이유는 두 파일의 크기가 어긋나면 "좁은 화면" 이야기가 실제로는
 * 넓은 채로 검사돼 `lg:hidden` 요소가 없다는 오류를 낸다 — 실제로 한 번 겪은 문제다.
 */
export const DS_VIEWPORTS = {
  mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} as const;
