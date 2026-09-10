import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'sass';

const COMPONENTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/components');

/**
 * 컴포넌트 SCSS 를 실제로 컴파일해 jsdom 문서에 적용한다.
 *
 * 파일당 한 번 `beforeAll` 에서 부른다 — vitest 는 파일마다 환경을 새로 만든다.
 */
export const applyComponentStyles = (...stylesheets: string[]): void => {
  const css = stylesheets
    .map((stylesheet) => compile(path.join(COMPONENTS, stylesheet)).css)
    .join('\n');

  const style = document.createElement('style');
  style.textContent = css;

  document.head.append(style);
};

type ColorRule = {
  selector: string;
  color: string;
};

/** 적용된 스타일시트에서 `color` 를 선언하는 규칙 전부. */
const colorRules = (): ColorRule[] =>
  [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .map((rule) => ({ selector: rule.selectorText, color: rule.style.getPropertyValue('color') }))
    .filter((rule) => rule.color !== '');

/**
 * 이 요소에 매칭되는 **상태** 색 규칙. 기본 규칙(상태 클래스를 언급하지 않는 것)은 뺀다.
 *
 * `getComputedStyle` 로 이긴 색을 직접 묻지 않는 이유: **jsdom 은 specificity 를 계산하지
 * 않는다.** 선언 순서만 보고 마지막 것을 돌려준다 (특정도가 높은 규칙을 앞에 두는 probe 로
 * 확인함). 그래서 계산된 색을 믿으면 실제 브라우저와 다른 결론을 내린다.
 *
 * 대신 **셀렉터 매칭**만 쓴다 — jsdom 의 CSS 파서와 nwsapi 는 `:not()` 과 복합 셀렉터를
 * 제대로 다룬다. 상태 규칙끼리 서로 배타적이면 어떤 조합에서도 매칭되는 상태 규칙이 정확히
 * 하나이고, 그러면 **결과가 특정도와 선언 순서 어느 쪽에도 좌우되지 않는다.** 우선순위를
 * 우연에 맡기지 않는다는 것이 바로 이 성질이다.
 *
 * 반환 순서는 스타일시트 선언 순서다. 길이가 1이 아니면 배타성이 깨진 것이다.
 *
 * **기본 규칙은 여기서 볼 수 없다.** jsdom 의 CSSOM 은 `margin: 0 0 var(--ds-spacing-xs)` 처럼
 * shorthand 안에 `var()` 가 들어간 선언을 파싱하지 못하고 그 규칙을 통째로 버린다. 두 컴포넌트
 * 모두 기본 규칙이 그런 `margin` 을 갖고 있어 목록에 나타나지 않는다. 상태 규칙이 하나도
 * 매칭되지 않으면 기본 규칙이 남는다는 것이 BEM 구조상 보장이고, 그 값은 SCSS 를 읽어 확인한다.
 */
export const matchingStateColorRules = (
  element: Element,
  stateClasses: readonly string[],
): ColorRule[] =>
  colorRules()
    .filter((rule) => stateClasses.some((stateClass) => rule.selector.includes(stateClass)))
    .filter((rule) => element.matches(rule.selector));
