/**
 * SCSS 셀렉터가 실제로 방출되는 클래스만 가리키는지 확인한다.
 *
 * jsdom 은 SCSS 를 적용하지 않아서 스타일 회귀를 렌더링으로 잡을 수 없다. 오타 하나로 규칙
 * 전체가 죽어도 테스트는 전부 통과한다 — 실제로 `plain-input.scss` 의 hover·focus·error·
 * disabled 규칙이 `ui-plain-input-base--` 라는 존재하지 않는 접두사를 가리키며 죽어 있었다.
 * 그래서 소스를 직접 훑는 결정적 검사를 둔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { boxedInputClasses } from '../boxed-input/BoxedInput.constants';
import { filledInputClasses } from '../filled-input/FilledInput.constants';
import { plainInputClasses } from '../plain-input/PlainInput.constants';

import { inputBaseClasses } from './InputBase.constants';

const COMPONENTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STYLESHEETS = [
  'input-base/input-base.scss',
  'plain-input/plain-input.scss',
  'filled-input/filled-input.scss',
  'boxed-input/boxed-input.scss',
];

/** 컴포넌트가 실제로 DOM 에 붙이는 클래스 전부. */
const emitted = new Set<string>([
  ...Object.values(inputBaseClasses),
  ...Object.values(plainInputClasses),
  ...Object.values(filledInputClasses),
  ...Object.values(boxedInputClasses),
]);

/** 셀렉터에 등장하는 `.ui-*` 클래스. 주석은 먼저 걷어낸다. */
const usedClasses = (source: string): string[] => {
  const withoutComments = source
    .replaceAll(/\/\*[\s\S]*?\*\//g, ' ')
    .replaceAll(/\/\/[^\n]*/g, ' ');

  return [...withoutComments.matchAll(/\.(ui-[a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
};

describe('Input 계열 SCSS 셀렉터', () => {
  it.each(STYLESHEETS)('%s 는 방출되는 클래스만 가리킨다', (stylesheet) => {
    const source = fs.readFileSync(path.join(COMPONENTS, stylesheet), 'utf8');
    const unknown = [...new Set(usedClasses(source))].filter((name) => !emitted.has(name));

    expect(unknown).toEqual([]);
  });

  it('검사할 클래스를 실제로 찾는다', () => {
    // 정규식이 조용히 아무것도 못 잡으면 위 검사가 전부 통과해 버린다.
    const source = fs.readFileSync(path.join(COMPONENTS, 'input-base/input-base.scss'), 'utf8');

    expect(usedClasses(source).length).toBeGreaterThan(10);
  });
});
