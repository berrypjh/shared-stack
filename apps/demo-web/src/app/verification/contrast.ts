import { toChannels } from './checks';

/**
 * WCAG 2.1 대비 계산.
 *
 * 토큰 값 자체의 대비는 design-tokens 의 `contrast.test.ts` 가 결정적으로 보장한다.
 * 여기서는 **브라우저가 실제로 계산한 값**으로 다시 재서, 이 실행 환경에서도 성립하는지 본다.
 */

const luminance = (color: string): number | null => {
  const ch = toChannels(color);
  if (!ch) return null;
  const [r, g, b] = ch.split(' ').map((v) => {
    const n = Number(v) / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number | null => {
  const [la, lb] = [luminance(a), luminance(b)];
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

export type ContrastCheck = {
  label: string;
  fg: string;
  bg: string;
  /** 0 이면 WCAG 면제 대상이다. */
  need: number;
  note?: string;
};

export const CONTRAST_CHECKS: ContrastCheck[] = [
  { label: '본문 텍스트', fg: '--ds-text-default', bg: '--ds-background-default', need: 4.5 },
  { label: '보조 텍스트', fg: '--ds-text-light', bg: '--ds-background-default', need: 4.5 },
  { label: 'Placeholder', fg: '--ds-text-placeholder', bg: '--ds-background-surface', need: 4.5 },
  { label: '링크', fg: '--ds-text-link', bg: '--ds-background-default', need: 4.5 },
  {
    label: 'Primary 버튼 라벨',
    fg: '--ds-text-contrast-text',
    bg: '--ds-primary-btn-default',
    need: 4.5,
  },
  {
    label: 'Secondary 버튼 라벨',
    fg: '--ds-text-contrast-text',
    bg: '--ds-secondary-btn-default',
    need: 4.5,
  },
  {
    label: '필드 테두리',
    fg: '--ds-field-border',
    bg: '--ds-background-surface',
    need: 3,
    note: 'UI 경계',
  },
  {
    label: '포커스 표시자',
    fg: '--ds-stroke-primary',
    bg: '--ds-background-surface',
    need: 3,
    note: 'UI 경계',
  },
  {
    label: '선택 상태 라벨',
    fg: '--ds-text-contrast-text',
    bg: '--ds-background-primary',
    need: 4.5,
  },
  {
    label: '비활성 텍스트',
    fg: '--ds-text-disable',
    bg: '--ds-background-default',
    need: 0,
    note: 'WCAG 면제',
  },
];

export const CONTRAST_VARS = [...new Set(CONTRAST_CHECKS.flatMap((c) => [c.fg, c.bg]))];
