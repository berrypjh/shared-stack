/**
 * 중앙 리졸버의 상태 → 토큰 매핑을 **모든 등록 테마**에서 고정합니다.
 *
 * light 테마에는 값이 우연히 같은 토큰 쌍이 여럿 있습니다 (`field.border` == `border.disabled.color`,
 * `text.disable` == `text.placeholder`, `field.surfaceSubtle` == `background.default`). light 만
 * 보면 리졸버가 둘을 바꿔 써도 통과합니다. 레지스트리를 순회하면 값이 갈라지는 테마가
 * 자동으로 그 실수를 잡습니다.
 *
 * 렌더링이 아니라 순수 함수를 직접 부릅니다 — 거대한 스냅샷 없이 조합을 넓게 덮기 위해서입니다.
 * chrome 이 실제로 View 에 닿는지는 각 variant 의 렌더 테스트가 봅니다.
 */
import { Native, type RNTokens, themes } from '@berrypjh/ui-core';

import type { ColorValue } from 'react-native';

import { resolveInputBaseStyles } from './InputBase.styles';

const NAMESPACES = Native as unknown as Record<string, { tokens: RNTokens }>;

const tokensFor = (name: string): RNTokens =>
  NAMESPACES[name[0].toUpperCase() + name.slice(1)].tokens;

const REGISTERED = themes.map((theme) => [theme.name, tokensFor(theme.name)] as const);

const RESTING = {
  size: 'md',
  color: 'primary',
  focused: false,
  error: false,
  disabled: false,
} as const;

const resolve = (
  tokens: RNTokens,
  over: Partial<Parameters<typeof resolveInputBaseStyles>[0]> = {},
) => resolveInputBaseStyles({ tokens, variant: 'boxed', ...RESTING, ...over });

/** 토큰 트리에 실제로 존재하는 색 문자열 전부. */
const colorValues = (tokens: RNTokens): Set<string> => {
  const found = new Set<string>();

  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      if (node.startsWith('#')) found.add(node);
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };

  walk(tokens);
  return found;
};

describe.each(REGISTERED)('%s 테마', (_name, T) => {
  describe('표면은 variant 가 정한다', () => {
    it('plain 은 표면이 없다', () => {
      expect(resolve(T, { variant: 'plain' }).container.backgroundColor).toBe('transparent');
    });

    it('filled 는 값이 비어도 표면을 가진다 — 시각 variant지 "채워짐" 상태가 아니다', () => {
      expect(resolve(T, { variant: 'filled' }).container.backgroundColor).toBe(
        T.color.field.surface,
      );
    });

    it('filled 는 disabled 여도 표면을 유지한다', () => {
      expect(resolve(T, { variant: 'filled', disabled: true }).container.backgroundColor).toBe(
        T.color.field.surface,
      );
    });

    it('boxed 는 평상시 투명하고 disabled 일 때만 표면을 얻는다', () => {
      expect(resolve(T).container.backgroundColor).toBe('transparent');
      expect(resolve(T, { disabled: true }).container.backgroundColor).toBe(
        T.color.field.surfaceSubtle,
      );
    });
  });

  describe('테두리 색 우선순위 — disabled > error > focused > 평상시', () => {
    it.each([
      ['평상시', {}, () => T.color.field.border],
      ['focused', { focused: true }, () => T.border.primary.color],
      [
        'secondary focused',
        { focused: true, color: 'secondary' as const },
        () => T.color.stroke.secondary,
      ],
      ['error', { error: true }, () => T.color.stroke.error],
      ['error + focused', { error: true, focused: true }, () => T.color.stroke.error],
      [
        'disabled + error + focused',
        { disabled: true, error: true, focused: true },
        () => T.border.disabled.color,
      ],
    ])('%s', (_label, over, expected) => {
      expect(resolve(T, over).container.borderColor).toBe(expected());
    });
  });

  describe('테두리 두께는 focus 만 굵힌다', () => {
    it.each([
      ['평상시', {}, () => T.border.primary.width],
      ['focused', { focused: true }, () => T.component.field.focusRingWidth],
      ['error 는 색만 바꾼다', { error: true }, () => T.border.primary.width],
      [
        'disabled 는 focus 를 이긴다',
        { disabled: true, focused: true },
        () => T.border.primary.width,
      ],
    ])('%s', (_label, over, expected) => {
      expect(resolve(T, over).container.borderWidth).toBe(expected());
    });
  });

  describe('state-critical 은 소비자 style 뒤에 다시 얹을 것만 남긴다', () => {
    it.each([
      ['평상시', {}, false],
      ['focused', { focused: true }, false],
      ['error', { error: true }, true],
      ['disabled', { disabled: true }, true],
    ])('%s → %s', (_label, over, expected) => {
      expect(resolve(T, over).containerStateCritical !== null).toBe(expected);
    });

    it('입력 텍스트는 disabled 일 때만 다시 얹는다', () => {
      expect(resolve(T).inputStateCritical).toBeNull();
      expect(resolve(T, { disabled: true }).inputStateCritical).toEqual({
        color: T.color.text.disable,
      });
    });
  });

  describe('타이포와 placeholder', () => {
    it('평상시 글자색과 placeholder 는 서로 다른 토큰을 쓴다', () => {
      const resolved = resolve(T);

      expect(resolved.input.color).toBe(T.color.text.default);
      expect(resolved.placeholderTextColor).toBe(T.color.text.placeholder);
    });

    it.each([
      ['md', 'md' as const, () => T.typography.body.medium.fontSize],
      ['sm', 'sm' as const, () => T.typography.body.small.fontSize],
    ])('%s 는 대응하는 body 타이포를 쓴다', (_label, size, expected) => {
      expect(resolve(T, { size }).input.fontSize).toBe(expected());
    });
  });

  describe('모바일 최소 터치 타깃', () => {
    it.each([
      ['md', 'md' as const],
      ['sm', 'sm' as const],
    ])('%s 는 터치 타깃 아래로 내려가지 않는다', (_label, size) => {
      const { minHeight } = resolve(T, { size }).container;

      expect(minHeight).toBe(Math.max(T.component.field.height[size], T.spacing['4xl']));
      expect(minHeight).toBeGreaterThanOrEqual(T.spacing['4xl']);
    });
  });

  describe('radius seam', () => {
    it('생략하면 canonical 기본값이다', () => {
      expect(resolve(T, { variant: 'filled' }).container.borderRadius).toBe(T.radius.md);
    });

    it('plain 은 상자가 아니라 radius 가 없다', () => {
      expect(resolve(T, { variant: 'plain' }).container.borderRadius).toBe(0);
    });
  });

  /**
   * 리졸버가 만들어도 되는 색은 **토큰 트리에 있는 값**과, "표면 없음"의 프레임워크 표현인
   * `transparent` 뿐입니다. 하드코딩한 hex 가 끼어들면 테마 전환에서 그 자리만 굳습니다.
   */
  it('토큰에 없는 색을 만들지 않는다', () => {
    const allowed = colorValues(T);
    const emitted: (ColorValue | undefined)[] = [];

    for (const variant of ['plain', 'filled', 'boxed'] as const) {
      for (const over of [
        {},
        { focused: true },
        { error: true },
        { disabled: true },
        { color: 'secondary' as const, focused: true },
      ]) {
        const r = resolve(T, { variant, ...over });

        emitted.push(
          r.container.backgroundColor,
          r.container.borderColor,
          r.container.borderBottomColor,
          r.input.color,
          r.placeholderTextColor,
          r.inputStateCritical?.color,
        );
      }
    }

    const unknown = [...new Set(emitted)].filter(
      (value): value is string =>
        typeof value === 'string' && value !== 'transparent' && !allowed.has(value),
    );

    expect(unknown).toEqual([]);
  });
});
