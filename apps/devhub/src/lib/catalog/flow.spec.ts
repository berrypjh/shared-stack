// @vitest-environment node
import { catalog } from '../../data';
import type { Journey, JourneyStep } from '../../domain/model';

import { flowModel, NODE } from './flow';
import { inspectStep } from './inspect-step';

const models = catalog.journeys.map((journey) => ({
  journey,
  model: flowModel(journey, catalog.contexts),
}));

const step = (id: string, over: Partial<JourneyStep> = {}): JourneyStep => ({
  id,
  intent: id,
  behavior: id,
  context: 'ci',
  owner: 'release-scripts',
  status: 'implemented',
  source: [{ path: 'nx.json' }],
  tests: [],
  docs: [],
  next: [],
  ...over,
});

/** 한 단계에서 두 레인으로 갈라지고, 저장소 밖 단계를 하나 가진 흐름. */
const branching: Journey = {
  id: 'branching',
  kind: 'package',
  title: '분기',
  goal: '분기',
  steps: [
    step('start', { next: ['left', 'right'] }),
    step('left'),
    step('right', { context: 'registry' }),
    step('outside', { status: 'documented-only', source: [], docs: ['root-agents'] }),
  ],
};

describe('flow model', () => {
  it('draws every step once, numbered in catalog order, and one edge per next link', () => {
    for (const { journey, model } of models) {
      expect(model.nodes.map((node) => node.id)).toEqual(journey.steps.map((step) => step.id));
      expect(model.nodes.map((node) => node.order)).toEqual(journey.steps.map((_, i) => i + 1));
      expect(model.edges.map((edge) => `${edge.from}->${edge.to}`).sort()).toEqual(
        journey.steps.flatMap((step) => step.next.map((next) => `${step.id}->${next}`)).sort(),
      );
    }
  });

  it('uses one lane per execution context the journey visits, in catalog order', () => {
    for (const { journey, model } of models) {
      const visited = new Set(journey.steps.map((step) => step.context));
      expect(model.lanes.map((lane) => lane.id)).toEqual(
        catalog.contexts.filter((context) => visited.has(context.id)).map((context) => context.id),
      );
      for (const node of model.nodes) {
        const lane = model.lanes.find((l) => l.id === node.context);
        expect(node.y).toBeGreaterThanOrEqual(lane?.y ?? Infinity);
        expect(node.y + NODE.height).toBeLessThanOrEqual((lane?.y ?? 0) + (lane?.height ?? 0));
      }
    }
  });

  it('moves forward edges to the right and never overlaps two steps', () => {
    for (const { model } of models) {
      const byId = new Map(model.nodes.map((node) => [node.id, node]));
      for (const edge of model.edges.filter((e) => !e.back)) {
        expect((byId.get(edge.to)?.x ?? 0) > (byId.get(edge.from)?.x ?? 0)).toBe(true);
      }
      const cells = model.nodes.map((node) => `${node.x},${node.y}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it('draws the branches of one step side by side in their own lanes', () => {
    const model = flowModel(branching, catalog.contexts);
    const left = model.nodes.find((n) => n.id === 'left');
    const right = model.nodes.find((n) => n.id === 'right');
    expect(left?.x).toBe(right?.x);
    expect(left?.y).not.toBe(right?.y);
  });
});

describe('inspectStep', () => {
  it('resolves the step, its context, next steps, and evidence lists', () => {
    const inspection = inspectStep(catalog, 'release', 'version');
    expect(inspection?.order).toBe(2);
    expect(inspection?.context?.id).toBe('ci');
    expect(inspection?.next.map((n) => n.id)).toEqual(['changelog']);
    expect(inspection?.tests.map((suite) => suite.id)).toEqual(['tools-vitest']);
  });

  it('explains a documented-only step that has no repository source', () => {
    const inspection = inspectStep({ ...catalog, journeys: [branching] }, 'branching', 'outside');
    expect(inspection?.step.source).toEqual([]);
    expect(inspection?.empty.source).toContain('문서가 안내함');
  });

  it('returns nothing for an unknown journey or step', () => {
    expect(inspectStep(catalog, 'no-such-journey', 'push')).toBeUndefined();
    expect(inspectStep(catalog, 'release', 'no-such-step')).toBeUndefined();
  });
});
