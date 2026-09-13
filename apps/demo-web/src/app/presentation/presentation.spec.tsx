import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COMPONENT_ROUTES } from '../app';
import { NAV } from '../shell/nav';

import { buttonPresentation } from './components/button';
import { DeveloperComponentPage } from './DeveloperComponentPage';
import { allPresentations, presentationById, presentationByPath } from './registry';

const definitions = allPresentations();
const eachDefinition = definitions.map((p) => [p.data.id, p] as const);

/**
 * scenario 목록은 Developer View 와 앞으로의 Designer View 가 공유하는 유일한 source 다.
 * identity 가 흔들리거나 section 이 없는 scenario 를 가리키면 한쪽 화면만 조용히 비므로,
 * 규칙 자체를 검증한다 — 특정 id 목록을 여기 다시 적지 않는다.
 */
describe('presentation registry', () => {
  it('definition id 가 유일하다', () => {
    const ids = definitions.map((p) => p.data.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('pathname 이 유일하다', () => {
    const paths = definitions.map((p) => p.data.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('id 와 pathname 으로 찾는다', () => {
    for (const p of definitions) {
      expect(presentationById(p.data.id)).toBe(p);
      expect(presentationByPath(p.data.path)).toBe(p);
    }
  });

  it('등록되지 않은 id·경로는 undefined 다 — 다른 컴포넌트로 떨어지지 않는다', () => {
    expect(presentationById('nope')).toBeUndefined();
    expect(presentationByPath('/components/nope')).toBeUndefined();
  });

  /** 사이드바 라벨과 페이지 h1 은 같은 문장이다. definition 이 갈리면 그 규칙이 깨진다. */
  it.each(eachDefinition)('%s 의 route 와 label 이 NAV 와 같다', (_id, p) => {
    const item = NAV.flatMap((g) => g.items).find((i) => i.path === p.data.path);
    expect(item?.label).toBe(p.data.label);
  });
});

/**
 * registry 가 현재 demo 의 컴포넌트 route 전부를 덮는지 본다. route 목록을 여기 다시 적지 않고
 * `app.tsx` 의 route table 에서 읽는다 — 새 컴포넌트 page 를 등록하고 definition 을 빠뜨리면
 * Designer 에서만 조용히 unsupported 가 되므로, 그것을 테스트가 막는다.
 */
describe('component route 커버리지', () => {
  it('모든 컴포넌트 route 에 definition 이 있다', () => {
    const registered = new Set(definitions.map((p) => p.data.path));
    expect(COMPONENT_ROUTES.filter((path) => !registered.has(path))).toEqual([]);
  });

  it('definition 은 컴포넌트 route 밖을 가리키지 않는다', () => {
    const routes = new Set<string>(COMPONENT_ROUTES);
    expect(definitions.map((p) => p.data.path).filter((path) => !routes.has(path))).toEqual([]);
  });

  /** 사이드바의 컴포넌트 항목은 registry 에서 파생된다 — 개수가 갈리면 파생이 끊긴 것이다. */
  it('NAV 의 컴포넌트 항목 수가 definition 수와 같다', () => {
    const navComponentPaths = NAV.flatMap((g) => g.items)
      .map((i) => i.path)
      .filter((path) => path.startsWith('/components/'));
    expect(navComponentPaths).toHaveLength(definitions.length);
    expect(new Set(navComponentPaths)).toEqual(new Set(definitions.map((p) => p.data.path)));
  });
});

describe('presentation section 참조', () => {
  it.each(eachDefinition)('%s 의 section id 가 유일하다', (_id, p) => {
    const ids = p.data.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(eachDefinition)('%s 의 scenario id 가 유일하다', (_id, p) => {
    const ids = p.data.scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(eachDefinition)('%s 의 section 이 참조하는 scenario 가 모두 존재한다', (_id, p) => {
    const known = new Set(p.data.scenarios.map((s) => s.id));
    const referenced = p.data.sections.flatMap((s) => s.scenarioIds);
    expect(referenced.filter((id) => !known.has(id))).toEqual([]);
  });

  /** 어느 section 도 가리키지 않는 scenario 는 화면에 못 나온다 — 죽은 data 다. */
  it.each(eachDefinition)('%s 에 orphan scenario 가 없다', (_id, p) => {
    const referenced = p.data.sections.flatMap((s) => s.scenarioIds);
    const counted = referenced.reduce<Record<string, number>>(
      (acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }),
      {},
    );
    expect(p.data.scenarios.map((s) => counted[s.id] ?? 0)).toEqual(p.data.scenarios.map(() => 1));
  });

  it.each(eachDefinition)('%s 의 default scenario 가 존재한다', (_id, p) => {
    expect(p.data.scenarios.map((s) => s.id)).toContain(p.data.defaultScenarioId);
  });

  it.each(eachDefinition)('%s 의 모든 scenario 가 무언가를 렌더한다', (_id, p) => {
    for (const scenario of p.data.scenarios) {
      expect(p.renderScenario(scenario.id)).not.toBeNull();
    }
  });

  it.each(eachDefinition)('%s 는 없는 scenario id 에 null 을 준다 — 예외가 아니다', (_id, p) => {
    expect(p.renderScenario('no-such-scenario')).toBeNull();
  });

  it.each(eachDefinition)('%s 의 scenario.sectionId 가 실제 배치와 일치한다', (_id, p) => {
    const placement = new Map(
      p.data.sections.flatMap((s) => s.scenarioIds.map((id) => [id, s.id] as const)),
    );
    for (const scenario of p.data.scenarios) {
      expect(placement.get(scenario.id)).toBe(scenario.sectionId);
    }
  });
});

describe('Button definition', () => {
  const { data } = buttonPresentation;

  it('route 가 /components/button 이다', () => {
    expect(data.path).toBe('/components/button');
    expect(data.group).toBe('components');
  });

  it('등록돼 있다', () => {
    expect(presentationById('button')).toBe(buttonPresentation);
  });
});

/**
 * Developer View 가 기존 정보 구조를 그대로 그리는지 본다. scenario abstraction 을 넣은 뒤에도
 * 제목 계층·section 순서·example 순서가 그대로여야 하고, 각 example 은 접근 가능한 이름을
 * 잃지 않아야 한다 (WCAG 4.1.2).
 */
describe('Developer Button 화면', () => {
  const at = () => render(<DeveloperComponentPage presentation={buttonPresentation} />);
  const { data } = buttonPresentation;

  it('h1 과 lead 를 갖는다', () => {
    at();
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
    expect(screen.getByText(data.lead)).toBeTruthy();
  });

  it('기존 section 을 같은 순서로 그린다', () => {
    at();
    expect(screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent)).toEqual([
      'Variants',
      'Sizes',
      'Colors',
      'Loading State',
      'Disabled',
      'Full Width',
    ]);
  });

  it('section note 를 그린다', () => {
    at();
    for (const note of data.sections.map((s) => s.note).filter(Boolean)) {
      expect(screen.getByText(note as string)).toBeTruthy();
    }
  });

  it('example 을 section 순서대로, 이름을 가진 채 그린다', () => {
    at();
    const expected = data.sections
      .flatMap((s) => s.scenarioIds)
      .map((id) => data.scenarios.find((s) => s.id === id)?.label);

    expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(expected);
    expect(screen.getAllByRole('button', { name: /\S/ })).toHaveLength(expected.length);
  });

  it('disabled scenario 는 실제로 disabled 다', () => {
    at();
    const disabledIds = new Set(data.sections.find((s) => s.id === 'disabled')?.scenarioIds ?? []);
    const disabledLabels = data.scenarios.filter((s) => disabledIds.has(s.id)).map((s) => s.label);

    expect(disabledLabels.length).toBeGreaterThan(0);
    for (const label of disabledLabels) {
      const matches = screen.getAllByRole('button', { name: label });
      expect(matches.some((el) => (el as HTMLButtonElement).disabled)).toBe(true);
    }
  });
});
