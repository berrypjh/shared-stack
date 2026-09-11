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
  'select/select.scss',
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
 * 선언된 `outline` 값. 없으면 null.
 *
 * `outline:\s*(?!none)` 같은 lookahead 는 쓰지 않는다 — `\s*` 가 0글자로 되돌아가면
 * 공백 위치에서 lookahead 가 통과해 `outline: none` 도 "outline 이 있다"로 읽힌다.
 * 값을 꺼내 직접 비교하는 편이 짧고 틀릴 여지가 없다.
 */
const outlineValue = (body: string): string | null =>
  body.match(/(?:^|[\s;])outline:([^;]*)/)?.[1].trim() ?? null;

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

/**
 * SkipLink 는 포커스를 받을 때만 드러나는 우회 링크다 — 그 모드에서 포커스 표시를 잃으면
 * 링크가 있다는 사실 자체가 사라진다.
 *
 * `SHEETS` 의 규칙(그림자에만 기댄 포커스에는 forced-colors 대응이 있다)으로는 볼 수 없다.
 * 이 시트는 `.ui-button:focus-visible` 과 같은 전략을 골랐기 때문이다 — outline 과 그림자를
 * 함께 선언해 그림자가 지워져도 outline 이 남는다. 그래서 전용 블록 대신 **outline 이
 * 실제로 선언되어 있는지**를 본다.
 */
describe('SkipLink', () => {
  const source = css('skip-link/skip-link.scss');

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    expect(source.length).toBeGreaterThan(100);
  });

  it('포커스 상태가 그림자와 함께 outline 을 선언한다', () => {
    const focusRules = rules(source).filter((rule) => rule.selector.includes(':focus'));

    // 수집이 조용히 비면 아래 검사가 공허하게 통과한다.
    expect(focusRules.length).toBeGreaterThan(0);

    const unprotected = focusRules
      .filter((rule) => /box-shadow:\s*(?!none)/.test(rule.body))
      .filter((rule) => {
        const outline = outlineValue(rule.body);
        return outline === null || outline === 'none';
      })
      .map((rule) => rule.selector);

    expect(unprotected).toEqual([]);
  });

  it('포커스 표시를 outline: none 으로 지우지 않는다', () => {
    const suppressed = rules(source)
      .filter((rule) => outlineValue(rule.body) === 'none')
      .map((rule) => rule.selector);

    expect(suppressed).toEqual([]);
  });
});

/**
 * SegmentControl 은 두 상태를 forced-colors 에서 잃기 쉽다.
 *
 * - 포커스: 그림자만으로 그리면 지워진다. SkipLink·버튼과 같은 전략으로 **outline 을 선언**한다.
 * - 선택: 배경·글자색만으로 표현하므로 시스템 색으로 평탄화되면 어느 세그먼트가 눌렸는지
 *   보이지 않는다. 그 모드에서만 시스템 색(`Highlight`)으로 채운다.
 */
describe('SegmentControl', () => {
  const source = css('segment-control/segment-control.scss');

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    expect(source.length).toBeGreaterThan(100);
  });

  it('포커스 표시가 outline 으로 선언되어 있다', () => {
    const focusRules = rules(source).filter((rule) => rule.selector.includes(':focus-visible'));

    expect(focusRules.length).toBeGreaterThan(0);

    const invisible = focusRules
      .filter((rule) => {
        const outline = outlineValue(rule.body);
        return outline === null || outline === 'none';
      })
      .map((rule) => rule.selector);

    expect(invisible).toEqual([]);
  });

  it('포커스 표시를 outline: none 으로 지우지 않는다', () => {
    const suppressed = rules(source)
      .filter((rule) => outlineValue(rule.body) === 'none')
      .map((rule) => rule.selector);

    expect(suppressed).toEqual([]);
  });

  it('forced-colors 에서 선택된 세그먼트를 시스템 색으로 채운다', () => {
    const selected = rules(forcedColorsBody(source)).filter((rule) =>
      rule.selector.includes('.is-active'),
    );

    expect(selected.some((rule) => /background-color:\s*Highlight/.test(rule.body))).toBe(true);
  });
});

/**
 * Checkbox·Radio 는 `appearance: none` 인 native input 을 토큰 색으로 칠한다. forced-colors
 * 에서는 그 배경·테두리 색이 시스템 색으로 평탄화되어 checked·indeterminate 가 사라진다.
 *
 * 그 모드에서는 **native 외형으로 되돌린다** — 상태를 OS 가 시스템 색으로 직접 그린다.
 * `forced-color-adjust: none` 으로 저자 색을 되살리지 않는다: 사용자가 고른 고대비 팔레트를
 * 끄는 셈이다.
 */
describe.each([
  ['Checkbox', 'checkbox/checkbox.scss', '.ui-checkbox__input'],
  ['Radio', 'radio/radio.scss', '.ui-radio__input'],
])('%s', (_name, sheet, inputSelector) => {
  const source = css(sheet);

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    expect(source.length).toBeGreaterThan(100);
  });

  it('forced-colors 에서 native 컨트롤로 돌아간다', () => {
    const native = rules(forcedColorsBody(source)).filter((rule) =>
      rule.selector.includes(inputSelector),
    );

    expect(native.some((rule) => /appearance:\s*auto/.test(rule.body))).toBe(true);
  });

  it('포커스 표시가 outline 으로 선언되어 있다', () => {
    const focusRules = rules(source).filter((rule) => rule.selector.includes(':focus-visible'));

    expect(focusRules.length).toBeGreaterThan(0);
    expect(
      focusRules.filter((rule) => {
        const outline = outlineValue(rule.body);
        return outline === null || outline === 'none';
      }),
    ).toEqual([]);
  });

  it('forced-color-adjust: none 으로 시스템 팔레트를 끄지 않는다', () => {
    expect(source).not.toMatch(/forced-color-adjust:\s*none/);
  });
});

/**
 * Switch 는 Checkbox·Radio 처럼 native 외형으로 되돌리지 않는다 — native 체크박스에는 thumb 이
 * 없어서 "켜짐/꺼짐 위치"라는 이 컨트롤의 표현이 사라진다.
 *
 * 대신 forced-colors 에서 살아남는 수단만으로 그린다.
 *
 * - thumb 은 **border** 로 채운다. 그 모드에서 배경색은 Canvas 로 지워지지만 테두리는 남는다.
 * - 켜짐/꺼짐은 thumb **위치**가 1차로 말한다 (색이 아니다). 그 위에 시스템 색을 얹는다:
 *   checked 는 `Highlight`, disabled 는 `GrayText`.
 * - 포커스는 outline 이다.
 */
describe('Switch', () => {
  const source = css('switch/switch.scss');

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    expect(source.length).toBeGreaterThan(100);
  });

  it('thumb 을 배경이 아니라 border 로 그린다', () => {
    const thumb = rules(source).filter((rule) => rule.selector === '.ui-switch__input::before');

    expect(thumb.some((rule) => /(^|[\s;])border:[^;]*solid/.test(rule.body))).toBe(true);
  });

  it('forced-colors 에서 checked 를 Highlight, disabled 를 GrayText 로 구분한다', () => {
    const forced = rules(forcedColorsBody(source));

    expect(
      forced.some((rule) => rule.selector.includes(':checked') && /Highlight/.test(rule.body)),
    ).toBe(true);
    expect(
      forced.some((rule) => rule.selector.includes(':disabled') && /GrayText/.test(rule.body)),
    ).toBe(true);
  });

  it('포커스 표시가 outline 으로 선언되어 있다', () => {
    const focusRules = rules(source).filter((rule) => rule.selector.includes(':focus-visible'));

    expect(focusRules.length).toBeGreaterThan(0);
    expect(
      focusRules.filter((rule) => {
        const outline = outlineValue(rule.body);
        return outline === null || outline === 'none';
      }),
    ).toEqual([]);
  });

  it('forced-color-adjust: none 으로 시스템 팔레트를 끄지 않는다', () => {
    expect(source).not.toMatch(/forced-color-adjust:\s*none/);
  });
});

/**
 * aria-activedescendant 목록의 활성 option 은 DOM 포커스가 아니라서 UA 포커스 링이 없다.
 * 배경 틴트(`field.surfaceSubtle`)는 패널과 1.1:1 안팎이라 활성 위치를 보여 주지 못하고
 * forced-colors 에서는 사라진다. 그래서 활성 option 은 **outline 을 선언**해야 한다.
 */
describe.each([
  ['SearchField', 'search-field/search-field.scss', '.ui-search-field__suggestion--active'],
  ['Select', 'select/select.scss', '.ui-select__option--highlighted'],
])('%s 활성 option', (_name, sheet, activeSelector) => {
  const source = css(sheet);

  it('활성 표시가 outline 으로 선언되어 있다', () => {
    const active = rules(source).filter((rule) => rule.selector.startsWith(activeSelector));
    const outlined = active.filter((rule) => {
      const outline = outlineValue(rule.body);
      return outline !== null && outline !== 'none';
    });

    expect(outlined.length).toBeGreaterThan(0);
  });
});
