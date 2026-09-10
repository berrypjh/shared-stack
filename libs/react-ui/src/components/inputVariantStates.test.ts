/**
 * 세 입력 variant 의 **시각 상태 매핑 계약**.
 *
 * 목표 우선순위는 RN 리졸버(`InputBase.styles.test.ts`)와 같다: `disabled > error > focused >
 * 평상시`. RN 은 그것을 함수로 계산하지만 web 은 CSS 가 정한다 — 그래서 "어느 규칙이 이기나"를
 * 선언 순서에 맡기면 파일을 재정렬하는 것만으로 조용히 바뀐다.
 *
 * 그래서 값을 묻지 않고 **매칭되는 상태 규칙이 정확히 하나인지**를 본다. 서로 배타적이면
 * 결과가 특정도와 선언 순서 어느 쪽에도 좌우되지 않는다. (`test/componentStyles.ts` 가
 * InputLabel·FormHelperText 에 같은 성질을 쓴다.)
 *
 * 규칙은 CSSOM 이 아니라 **컴파일된 CSS 텍스트**에서 읽는다 — jsdom 의 CSSOM 은 shorthand 안에
 * `var()` 가 들어간 선언(`border: var(--x) solid var(--y)`)을 만나면 그 규칙을 통째로 버린다.
 * 매칭 판정만 jsdom 에 맡긴다: `element.matches()` 는 `:not()` 과 복합 셀렉터를 제대로 다룬다.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'sass';

const COMPONENTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const VARIANTS = [
  ['plain', 'ui-plain-input', 'plain-input/plain-input.scss'],
  ['filled', 'ui-filled-input', 'filled-input/filled-input.scss'],
  ['boxed', 'ui-boxed-input', 'boxed-input/boxed-input.scss'],
] as const;

const FOCUSED = 'ui-input-base--focused';
const ERROR = 'ui-input-base--error';
const DISABLED = 'ui-input-base--disabled';

type Rule = { selector: string; body: string };

/**
 * `@media` 블록과 주석을 걷어낸다.
 *
 * 상태 우선순위는 미디어 쿼리 밖에서 정해진다. 주석을 지우는 이유는 다르다 — 아래 파서가
 * `{` 앞을 셀렉터로 보기 때문에, 규칙 위 주석이 남으면 셀렉터에 섞여 `matches()` 가 깨진다.
 */
const withoutAtRules = (source: string): string =>
  source.replaceAll(/@media[^{]*\{[\s\S]*?\n\}/g, '').replaceAll(/\/\*[\s\S]*?\*\//g, '');

const rules = (source: string): Rule[] =>
  [...withoutAtRules(source).matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((match) =>
    match[1]
      .split(',')
      .map((selector) => ({ selector: selector.replace(/\s+/g, ' ').trim(), body: match[2] }))
      .filter((rule) => rule.selector !== ''),
  );

/**
 * 상태 클래스를 언급하는 규칙만. 평상시(base) 규칙과 `:hover` 는 뺀다 —
 * hover 는 이미 `:not()` 으로 배타적이고, 상태끼리의 다툼이 아니다.
 */
const stateRules = (source: string, property: RegExp): Rule[] =>
  rules(source)
    .filter((rule) => !rule.selector.includes(':hover'))
    .filter((rule) => [FOCUSED, ERROR, DISABLED].some((cls) => rule.selector.includes(cls)))
    .filter((rule) => property.test(rule.body));

const elementWith = (root: string, states: readonly string[]): HTMLElement => {
  const element = document.createElement('div');
  element.className = ['ui-input-base', root, ...states].join(' ');
  return element;
};

const COMBINATIONS = [
  [[], undefined],
  [[FOCUSED], FOCUSED],
  [[ERROR], ERROR],
  [[ERROR, FOCUSED], ERROR],
  [[DISABLED], DISABLED],
  [[DISABLED, FOCUSED], DISABLED],
  [[DISABLED, ERROR], DISABLED],
  [[DISABLED, ERROR, FOCUSED], DISABLED],
] as const;

describe.each(VARIANTS)('%s variant', (_name, root, sheet) => {
  const source = compile(path.join(COMPONENTS, sheet)).css;

  it('컴파일된 CSS 를 실제로 읽는다', () => {
    expect(source.length).toBeGreaterThan(100);
    expect(stateRules(source, /border/).length).toBeGreaterThan(0);
  });

  /**
   * 테두리 색의 임자는 상태 조합마다 정확히 하나여야 한다. 둘 이상이 매칭되면 누가 이기는지가
   * 선언 순서에 달리고, 그것은 계약이 아니라 우연이다.
   */
  it.each(COMBINATIONS)('%s 에서 테두리 규칙이 정확히 하나 매칭된다', (states, owner) => {
    const element = elementWith(root, states);
    const matched = stateRules(source, /border(-bottom)?-color:/).filter((rule) =>
      element.matches(rule.selector),
    );

    expect(matched.map((rule) => rule.selector)).toHaveLength(owner === undefined ? 0 : 1);

    if (owner !== undefined) {
      expect(matched[0].selector).toContain(owner);
    }
  });

  /**
   * 포커스 halo 는 비활성 입력에 남으면 안 된다.
   *
   * `focused` 와 `disabled` 는 독립된 boolean 이라 (`InputBase.utils.ts` 의 클래스 목록)
   * 두 클래스가 함께 붙는 상태가 실재한다. halo 규칙이 `disabled` 를 배제하지 않으면
   * 비활성인데 포커스처럼 보이는 입력이 나온다.
   */
  it.each([[[DISABLED, FOCUSED]], [[DISABLED, ERROR, FOCUSED]]] as const)(
    '%s 에서는 포커스 halo 가 남지 않는다',
    (states) => {
      const element = elementWith(root, states);
      const halos = stateRules(source, /box-shadow:\s*(?!none)/).filter((rule) =>
        element.matches(rule.selector),
      );

      expect(halos.map((rule) => rule.selector)).toEqual([]);
    },
  );

  it('평상시에는 halo 가 없고 focused 에서만 생긴다', () => {
    const halo = (states: readonly string[]) =>
      stateRules(source, /box-shadow:\s*(?!none)/).filter((rule) =>
        elementWith(root, states).matches(rule.selector),
      );

    expect(halo([])).toEqual([]);
    expect(halo([FOCUSED]).length).toBeGreaterThan(0);
  });
});
