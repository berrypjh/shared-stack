import type { ReactNode } from 'react';

import { buttonPresentation } from './components/button';
import { dividerPresentation } from './components/divider';
import { fabPresentation } from './components/fab';
import { iconButtonPresentation } from './components/iconButton';
import { popoverPresentation } from './components/popover';
import { searchFieldPresentation } from './components/searchField';
import { selectPresentation } from './components/select';
import { stackPresentation } from './components/stack';
import { textFieldPresentation } from './components/textField';
import type {
  ComponentRoute,
  PresentationGroup,
  PresentationMeta,
  ScenarioOverrides,
} from './model';

/**
 * 등록된 component presentation 목록.
 *
 * `data` 는 platform 을 모르고 `renderScenario` 만 React 를 안다. scenario props 는 각
 * definition 안에서 실제 컴포넌트 타입에 대해 검사되므로, registry 는 id 로만 렌더를 요청한다 —
 * 그래서 prop 계약이 서로 다른 컴포넌트를 한 목록에 담을 수 있다.
 */
export type WebPresentation = {
  data: PresentationMeta;
  /**
   * scenario 를 실제 컴포넌트로 그린다. `overrides` 는 Canvas · Variant Matrix · State Matrix 가
   * 같은 adapter 를 쓰기 위한 것이다 — 비교용 renderer 를 따로 만들지 않는다.
   * 원본 scenario 는 바뀌지 않는다.
   */
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides) => ReactNode;
};

/**
 * 등록 순서가 곧 사이드바·Library Browser 의 표시 순서다. 묶음별 순서를 두 곳에 적지 않도록
 * 여기 한 번만 적는다.
 */
const REGISTERED: readonly WebPresentation[] = [
  buttonPresentation,
  textFieldPresentation,
  selectPresentation,
  searchFieldPresentation,
  fabPresentation,
  iconButtonPresentation,
  stackPresentation,
  dividerPresentation,
  popoverPresentation,
];

export const allPresentations = (): readonly WebPresentation[] => REGISTERED;

export const presentationById = (id: string): WebPresentation | undefined =>
  REGISTERED.find((p) => p.data.id === id);

/** 등록되지 않은 경로는 `undefined` 다 — 아무 컴포넌트로도 떨어지지 않는다. */
export const presentationByPath = (pathname: string): WebPresentation | undefined =>
  REGISTERED.find((p) => p.data.path === (pathname as ComponentRoute));

export const presentationsInGroup = (group: PresentationGroup): readonly WebPresentation[] =>
  REGISTERED.filter((p) => p.data.group === group);
