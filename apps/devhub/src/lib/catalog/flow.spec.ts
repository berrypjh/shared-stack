// @vitest-environment node
import { catalog } from '../../data';

import { flowModel, NODE } from './flow';
import { inspectStep } from './inspect-step';

const models = catalog.journeys.map((journey) => ({
  journey,
  model: flowModel(journey, catalog.contexts),
}));
const of = (id: string) => {
  const found = models.find(({ journey }) => journey.id === id);
  if (!found) throw new Error(`no journey ${id}`);
  return found;
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

  it('splits the token build into web and React Native side by side', () => {
    const { model } = of('token-pipeline');
    const web = model.nodes.find((n) => n.id === 'web');
    const rn = model.nodes.find((n) => n.id === 'rn');
    expect(web?.x).toBe(rn?.x);
    expect(web?.y).not.toBe(rn?.y);
  });

  it('starts web and React Native registration separately and joins them at verification', () => {
    const { journey } = of('component-export');
    const targets = new Set(journey.steps.flatMap((step) => step.next));
    expect(journey.steps.filter((s) => !targets.has(s.id)).map((s) => s.id)).toEqual([
      'web-register',
      'rn-register',
    ]);
  });
});

describe('inspectStep', () => {
  it('resolves the step, its context, next steps, and evidence lists', () => {
    const inspection = inspectStep(catalog, 'token-pipeline', 'facade');
    expect(inspection?.order).toBe(3);
    expect(inspection?.context?.id).toBe('workspace');
    expect(inspection?.next.map((n) => n.id)).toEqual(['web', 'rn']);
    expect(inspection?.commands.map((c) => c.line)).toEqual(['pnpm nx build @berrypjh/ui-core']);
    expect(inspection?.tests.map((t) => t.suite.id)).toEqual(['ui-core-vitest']);
  });

  it('explains a documented-only step that has no repository source', () => {
    const inspection = inspectStep(catalog, 'web-consumer', 'install');
    expect(inspection?.step.source).toEqual([]);
    expect(inspection?.empty.source).toContain('문서만 말한다');
  });

  it('returns nothing for an unknown journey or step', () => {
    expect(inspectStep(catalog, 'no-such-journey', 'install')).toBeUndefined();
    expect(inspectStep(catalog, 'web-consumer', 'no-such-step')).toBeUndefined();
  });
});
