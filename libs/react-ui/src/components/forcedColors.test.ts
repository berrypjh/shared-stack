/**
 * forced-colors(Windows 고대비) 모드에서 상태 표시가 살아남는지 검사한다.
 *
 * 그 모드에서 브라우저는 저자 색을 **전부 시스템 색으로 갈아끼우고 `box-shadow` 를 지운다**
 * (CSS Color Adjust 1). 그래서 두 가지가 조용히 사라진다.
 *
 * 1. `box-shadow` 로 그린 포커스 링·밑줄 — 아예 렌더되지 않는다.
 * 2. `border-color` 변화로만 표현한 상태 — 평상시와 포커스가 같은 시스템 색으로 평탄화된다.
 *
 * 둘이 겹치면 입력의 포커스 표시가 통째로 없어진다 — WCAG 2.4.7 Focus Visible(AA) 위반이다.
 * 살아남는 것은 `outline` 이라, 그 모드에서만 outline 을 켜서 복구한다.
 *
 * jsdom 의 CSSOM 은 `@media (forced-colors: active)` 를 신뢰할 수 있게 파싱하지 못하므로
 * 컴파일된 CSS 를 **텍스트로** 읽는다. 셀렉터 목록을 박아 두는 대신 "box-shadow 로 포커스를
 * 그리는 규칙에는 forced-colors 대응이 있다"는 **규칙 자체**를 검사한다 — 새 variant 가
 * 생기면 목록을 고치지 않아도 함께 걸린다.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'sass';

const COMPONENTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

/**
 * 포커스를 `box-shadow` 로만 그리는 스타일시트.
 *
 * `button-base.scss` 는 여기 없다 — `:focus-visible` 이 outline 과 halo 를 함께 선언해
 * forced-colors 에서도 outline 이 남는다. 버튼은 아래 전용 describe 에서 다른 것을 본다.
 */
const SHEETS = [
  'plain-input/plain-input.scss',
  'boxed-input/boxed-input.scss',
  'filled-input/filled-input.scss',
] as const;

type Rule = { selector: string; body: string };

/**
 * 컴파일된 CSS. 주석은 먼저 걷어낸다 — 아래 파서는 `{` 앞을 셀렉터로 보므로, 규칙 위에 달린
 * 주석이 남아 있으면 셀렉터에 딸려 들어간다.
 */
const css = (sheet: string): string =>
  compile(path.join(COMPONENTS, sheet)).css.replaceAll(/\/\*[\s\S]*?\*\//g, '');

/** `@media (forced-colors: active) { … }` 본문. 중괄호 깊이를 세어 잘라낸다. */
const forcedColorsBody = (source: string): string => {
  const start = source.indexOf('@media (forced-colors: active)');
  if (start === -1) return '';

  const open = source.indexOf('{', start);
  let depth = 0;

  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return '';
};

/**
 * `selector { body }` 를 평평하게 훑는다. 중첩 at-rule 은 이 파일 범위에 없다.
 *
 * 그룹 셀렉터(`A, B { … }`)는 하나씩 쪼갠다 — CSS 쪽은 묶어 쓰는 것이 자연스럽고,
 * 검사는 셀렉터 단위여야 어느 쪽이 빠졌는지 이름으로 드러난다.
 */
const rules = (source: string): Rule[] =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((m) =>
    m[1]
      .split(',')
      .map((selector) => ({ selector: selector.replace(/\s+/g, ' ').trim(), body: m[2] }))
      .filter((rule) => rule.selector !== ''),
  );

/** forced-colors 밖에서 `box-shadow` 로 무언가를 그리는 규칙. */
const boxShadowRules = (source: string): Rule[] => {
  const body = forcedColorsBody(source);
  const outside = body === '' ? source : source.replace(body, '');

  return rules(outside).filter((rule) => /box-shadow:\s*(?!none)/.test(rule.body));
};

describe.each(SHEETS)('%s', (sheet) => {
  const source = css(sheet);

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    // 컴파일이 조용히 빈 문자열을 주면 아래 검사가 전부 공허하게 통과한다.
    expect(source.length).toBeGreaterThan(100);
  });

  it('forced-colors 대응 블록이 있다', () => {
    expect(forcedColorsBody(source)).not.toBe('');
  });

  /**
   * 포커스는 forced-colors 에서도 보여야 한다 (WCAG 2.4.7).
   *
   * 검사 대상은 `box-shadow` **에만** 기대는 규칙이다. 같은 규칙이 이미 `outline` 을 함께
   * 선언했다면 outline 이 살아남으므로 대응이 필요 없다 — `.ui-button:focus-visible` 이
   * 그 경우다. 불필요한 CSS 를 요구하지 않도록 그쪽은 제외한다.
   */
  it('box-shadow 에만 기대는 포커스 표시마다 forced-colors 대응이 있다', () => {
    const forced = rules(forcedColorsBody(source));
    const focusShadows = boxShadowRules(source)
      .filter((rule) => /--focused|:focus-visible/.test(rule.selector))
      .filter((rule) => !/(^|\s|;)outline:/.test(rule.body));

    expect(focusShadows.length).toBeGreaterThan(0);

    const uncovered = focusShadows
      .filter(
        (shadow) =>
          !forced.some(
            (rule) => rule.selector === shadow.selector && /(^|\s|;)outline:/.test(rule.body),
          ),
      )
      .map((rule) => rule.selector);

    expect(uncovered).toEqual([]);
  });
});

/**
 * 채워진 버튼은 배경색만으로 자기를 식별시킨다. forced-colors 에서 배경은 `ButtonFace`,
 * 페이지는 `Canvas` 가 되는데 두 값이 같은 고대비 테마가 있어서 버튼이 사라질 수 있다.
 * 그 모드에서만 테두리를 켜서 경계를 만든다.
 */
describe('contained 버튼', () => {
  const source = css('button-base/button-base.scss');

  it('forced-colors 에서 경계를 갖는다', () => {
    const forced = rules(forcedColorsBody(source));

    const bordered = forced.some(
      (rule) =>
        rule.selector.includes('.ui-button--variant-contained') && /border:/.test(rule.body),
    );

    expect(bordered).toBe(true);
  });
});
