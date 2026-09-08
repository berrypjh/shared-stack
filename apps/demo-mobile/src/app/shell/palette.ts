import { useTheme } from '@berrypjh/react-native-ui';

/**
 * 데모 UI가 쓰는 색을 테마 토큰에서 한 번에 뽑습니다.
 *
 * 화면 어디서도 색을 하드코딩하지 않기 위한 단일 출처입니다. 이전 데모는
 * `#0f172a`·`#fff` 같은 리터럴과 색이 아예 없는 `Text` 스타일이 섞여 있어서,
 * 테마를 바꾸면 글자가 배경에 묻혔습니다.
 */

/** sRGB 상대 휘도 (WCAG 2.x). */
const luminance = (hex: string) => {
  const h = hex.replace('#', '').slice(0, 6);
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
};

/** WCAG 2.x 명암비. 1(같은 색) ~ 21(검정 대 흰색). */
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const useDemoPalette = () => {
  const { tokens } = useTheme();
  const { color, spacing, radius } = tokens;

  /**
   * 임의의 색 위에 올릴 글자색을 고릅니다.
   *
   * 후보는 뉴트럴 스케일 양끝입니다 — 테마가 바꾸지 않는 primitive라 어떤 테마에서도
   * 같은 기준으로 동작합니다. `text.contrastText` 하나로 고정하면 밝은 배경(예:
   * `neutral.ne200`)에서 대비가 1.18:1까지 떨어집니다.
   *
   * 휘도 임계값으로 가르지 않고 **실제 대비를 둘 다 계산해서** 큰 쪽을 씁니다. 중간 톤
   * (`primary.pr500` 등)에서는 임계값 방식이 반대쪽을 골라 5.55:1 이 1.97:1 로 떨어집니다.
   */
  const readableOn = (background: string) => {
    const dark = color.neutral.ne900;
    const light = color.neutral.ne100;

    return contrast(background, dark) >= contrast(background, light) ? dark : light;
  };

  /**
   * `Box bg="neutral.ne200"` 처럼 토큰 경로로 지정한 배경의 실제 hex 를 얻습니다.
   * 그 위에 올릴 글자색을 `readableOn` 으로 정하려면 값이 필요합니다.
   */
  const hexAt = (path: string) => {
    const [group, key] = path.split('.');
    return (color as unknown as Record<string, Record<string, string>>)[group][key];
  };

  return {
    /** 스크롤 본문 바탕. */
    page: color.background.default,
    /** 섹션 카드 바탕. 본문보다 한 단 올라온 면. */
    card: color.background.surface,
    /** 카드·구분선 테두리. */
    border: color.field.border,
    /** 본문 글자. */
    title: color.text.default,
    /** 보조 설명. */
    body: color.text.light,
    /** 캡션·hex 값처럼 더 약한 글자. */
    muted: color.text.placeholder,
    /** 강조(선택된 칩 등). */
    accent: color.background.primary,
    readableOn,
    hexAt,
    spacing,
    radius,
    color,
  };
};
