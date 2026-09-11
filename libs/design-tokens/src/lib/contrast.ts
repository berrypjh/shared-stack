/**
 * WCAG 2.1 상대 명도 대비 계산.
 *
 * 토큰 값이 바뀌어도 접근성 기준이 유지되는지 테스트로 고정하기 위한 순수 함수다.
 * 공식은 WCAG 2.1 Techniques G17/G18을 따른다.
 */

/** `#RGB` / `#RRGGBB` / `#RRGGBBAA` 를 [r, g, b] 로. 알파는 무시한다. */
const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const six =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(six.slice(i, i + 2), 16)) as [number, number, number];
};

/** sRGB 채널을 선형화한다. */
const linear = (channel: number): number => {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** 상대 명도 (WCAG 정의). */
export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = toRgb(hex).map(linear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 두 색의 대비비. 1(동일) ~ 21(흑백). 순서는 무관하다. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/**
 * 반투명 `fg`(`#RRGGBBAA`)를 불투명 `bg` 위에 합성한 불투명 `#rrggbb`.
 *
 * `contrastRatio` 는 알파를 무시하므로, 틴트 표면 위 글자는 이것으로 먼저 합성한 뒤 잰다.
 */
export const compositeOver = (fg: string, bg: string): string => {
  const hex = fg.replace('#', '');
  const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  const top = toRgb(fg);
  const bottom = toRgb(bg);
  const channels = top.map((c, i) => Math.round(c * alpha + bottom[i] * (1 - alpha)));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

/** WCAG AA 최소 대비. 본문 텍스트 4.5:1, UI 요소·큰 텍스트 3:1. */
export const WCAG_AA = { text: 4.5, nonText: 3 } as const;
