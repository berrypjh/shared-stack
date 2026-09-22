// @vitest-environment node
import { catalog } from '../../data';

import { architectureModel, drawnEnds, isolatedIds } from './architecture';
import { layoutProblems } from './architecture-checks';
import { filterModel, filterQuery, parseFilters } from './architecture-filters';
import { GRID } from './architecture-layout';

const model = architectureModel(catalog);
const node = (id: string) => {
  const found = model.nodes.find((n) => n.id === id);
  if (!found) throw new Error(`no node ${id}`);
  return found;
};
const edgesBetween = (source: string, target: string) =>
  model.edges.filter((edge) => edge.source === source && edge.target === target);

describe('architecture model', () => {
  it('has a node for every application, package, and tool, and nothing else', () => {
    const entities = [...catalog.applications, ...catalog.packages, ...catalog.tools];
    expect(model.nodes.map((n) => n.id).sort()).toEqual(entities.map((e) => e.id).sort());
  });

  it('draws exactly one edge per catalog relation, keeping its kind', () => {
    expect(model.edges.map((edge) => edge.id).sort()).toEqual(
      catalog.relations.map((relation) => relation.id).sort(),
    );
    for (const edge of model.edges) {
      expect(edge.kind).toBe(edge.relation.kind);
      expect(drawnEnds(edge.relation)).toEqual({ source: edge.source, target: edge.target });
    }
  });

  it('draws the token → contract → renderer → demo spine, with web and RN as siblings', () => {
    const spine: [string, string][] = [
      ['design-tokens', 'ui-core'],
      ['ui-core', 'react-ui'],
      ['ui-core', 'react-native-ui'],
      ['react-ui', 'demo-web'],
      ['react-native-ui', 'demo-mobile'],
    ];
    for (const [source, target] of spine) {
      expect({ source, target, edges: edgesBetween(source, target).length > 0 }).toEqual({
        source,
        target,
        edges: true,
      });
      expect(node(source).y).toBeLessThan(node(target).y);
    }
    expect(node('react-ui').y).toBe(node('react-native-ui').y);
    expect(node('demo-web').y).toBe(node('demo-mobile').y);
  });

  it('keeps two kinds between the same nodes as two separate, bent edges', () => {
    const pair = edgesBetween('design-tokens', 'ui-core');
    expect(pair.map((edge) => edge.kind).sort()).toEqual([
      'build-dependency',
      'generated-artifact',
    ]);
    expect(new Set(pair.map((edge) => edge.path)).size).toBe(2);
  });

  it('shows the subsystems outside the UI spine', () => {
    expect(edgesBetween('observability-collectors', 'quality-lab')[0]?.kind).toBe(
      'generated-artifact',
    );
    expect(edgesBetween('quality-lab-e2e', 'quality-lab').map((e) => e.kind)).toEqual([
      'verification',
    ]);
    expect(edgesBetween('consumer-retrieval', 'react-ui')[0]?.kind).toBe('generated-artifact');
    expect(edgesBetween('consumer-eval', 'react-native-ui')[0]?.kind).toBe('verification');
  });

  it('leaves release, plugin, measurement, and config nodes without invented edges', () => {
    const isolated = isolatedIds(model);
    for (const id of [
      'release-scripts',
      'berry-commit',
      'token-measurement',
      'treeshake-check',
      'eslint-config',
    ]) {
      expect(isolated.has(id)).toBe(true);
    }
  });
});

describe('layout', () => {
  it('places only catalog nodes, each on its own cell', () => {
    expect(Object.keys(GRID).sort()).toEqual(model.nodes.map((n) => n.id).sort());
    const cells = Object.values(GRID).map(([column, row]) => `${column},${row}`);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('draws no edge through a node it does not connect, and no overlapping labels', () => {
    expect(layoutProblems(model)).toEqual([]);
  });
});

describe('filters', () => {
  it('accepts only known values and writes a stable query', () => {
    const filters = parseFilters(
      new URLSearchParams('platform=web&kind=package&visibility=secret&x=1'),
    );
    expect(filters).toEqual({ kind: 'package', platform: 'web' });
    expect(filterQuery(filters)).toBe('?kind=package&platform=web');
    expect(filterQuery({})).toBe('');
  });

  it('keeps matching nodes and only edges whose both ends remain', () => {
    const packages = filterModel(model, { kind: 'package' });
    expect(packages.nodes.every((n) => n.kind === 'package')).toBe(true);
    expect(packages.edges.map((e) => e.id).sort()).toEqual(
      catalog.relations
        .filter((r) => [r.from, r.to].every((id) => catalog.packages.some((p) => p.id === id)))
        .map((r) => r.id)
        .sort(),
    );
    const publicOnly = filterModel(model, { visibility: 'public' });
    expect(publicOnly.nodes.map((n) => n.id).sort()).toEqual(
      catalog.packages
        .filter((p) => p.visibility === 'public')
        .map((p) => p.id)
        .sort(),
    );
  });

  it('can leave nothing', () => {
    const none = filterModel(model, { kind: 'application', platform: 'platform-neutral' });
    expect(none.nodes).toEqual([]);
    expect(none.edges).toEqual([]);
  });
});
