// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { catalog } from '../index';

/** 카탈로그가 설명하는 저장소. 읽기만 한다. */
const ROOT = join(import.meta.dirname, '../../../../..');

const { journeys, contexts } = catalog;
const entities = [...catalog.applications, ...catalog.packages, ...catalog.tools];
const entityIds = new Set(entities.map((entity) => entity.id));
const contextIds = new Set(contexts.map((context) => context.id));
const commandIds = new Set(catalog.commands.map((command) => command.id));
const testIds = new Set(catalog.tests.map((suite) => suite.id));
const documentIds = new Set(catalog.documents.map((doc) => doc.id));
const steps = journeys.flatMap((journey) => journey.steps.map((step) => ({ journey, step })));
const where = (journeyId: string, stepId: string) => `${journeyId}/${stepId}`;
const duplicates = (ids: string[]) => ids.filter((id, index) => ids.indexOf(id) !== index);

describe('journey ids', () => {
  it('are unique and never shadow an entity or document id', () => {
    const ids = journeys.map((journey) => journey.id);
    expect(duplicates(ids)).toEqual([]);
    expect(ids.filter((id) => entityIds.has(id) || documentIds.has(id))).toEqual([]);
    for (const journey of journeys) {
      expect({ journey: journey.id, repeats: duplicates(journey.steps.map((s) => s.id)) }).toEqual({
        journey: journey.id,
        repeats: [],
      });
    }
    expect(duplicates(contexts.map((context) => context.id))).toEqual([]);
  });
});

describe('journey graph', () => {
  it('links only to steps of the same journey, never to itself', () => {
    const broken = steps.flatMap(({ journey, step }) =>
      step.next
        .filter((id) => id === step.id || !journey.steps.some((s) => s.id === id))
        .map((id) => `${where(journey.id, step.id)} → ${id}`),
    );
    expect(broken).toEqual([]);
  });

  it('reaches every step from the steps nothing points to', () => {
    for (const journey of journeys) {
      const targets = new Set(journey.steps.flatMap((step) => step.next));
      const entries = journey.steps.filter((step) => !targets.has(step.id)).map((s) => s.id);
      expect(entries.length).toBeGreaterThan(0);
      const seen = new Set(entries);
      const queue = [...entries];
      while (queue.length) {
        const id = queue.shift();
        const current = journey.steps.find((s) => s.id === id);
        for (const next of current?.next ?? []) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect({
        journey: journey.id,
        unreachable: journey.steps.filter((s) => !seen.has(s.id)).map((s) => s.id),
      }).toEqual({
        journey: journey.id,
        unreachable: [],
      });
    }
  });
});

describe('journey references', () => {
  it('resolve owners, contexts, commands, tests, and documents', () => {
    const broken = steps.flatMap(({ journey, step }) => {
      const at = where(journey.id, step.id);
      return [
        ...(entityIds.has(step.owner) ? [] : [`${at} owner ${step.owner}`]),
        ...(contextIds.has(step.context) ? [] : [`${at} context ${step.context}`]),
        ...step.commands.filter((id) => !commandIds.has(id)).map((id) => `${at} command ${id}`),
        ...step.tests.filter((id) => !testIds.has(id)).map((id) => `${at} test ${id}`),
        ...step.docs.filter((id) => !documentIds.has(id)).map((id) => `${at} doc ${id}`),
      ];
    });
    expect(broken).toEqual([]);
  });

  it('cite paths that exist, with every symbol written in the file and directories marked', () => {
    const refs = steps.flatMap(({ journey, step }) =>
      [...step.source, ...(step.gaps ?? []).flatMap((gap) => gap.evidence)].map((ref) => ({
        at: where(journey.id, step.id),
        ref,
      })),
    );
    const problems = refs.flatMap(({ at, ref }) => {
      const file = join(ROOT, ref.path);
      if (!existsSync(file)) return [`${at}: missing ${ref.path}`];
      if (statSync(file).isDirectory() !== (ref.directory === true)) {
        return [`${at}: directory flag wrong for ${ref.path}`];
      }
      if (ref.symbol && !readFileSync(file, 'utf8').includes(ref.symbol)) {
        return [`${at}: ${ref.symbol} not in ${ref.path}`];
      }
      return [];
    });
    expect(problems).toEqual([]);
  });
});

describe('journey status', () => {
  it('claims implemented or partial only with source, partial only with a gap', () => {
    const wrong = steps.flatMap(({ journey, step }) => {
      const at = where(journey.id, step.id);
      if (step.status === 'documented-only') {
        return step.source.length === 0 && step.docs.length > 0
          ? []
          : [`${at}: documented-only needs docs and no source`];
      }
      if (step.source.length === 0) return [`${at}: ${step.status} without source`];
      if (step.status === 'partial' && !step.gaps?.length) return [`${at}: partial without a gap`];
      return [];
    });
    expect(wrong).toEqual([]);
  });
});

describe('journey coverage', () => {
  it('gives web and React Native their own consumer journey', () => {
    const byPlatform = (platform: string) =>
      journeys.filter((journey) => journey.platform === platform && journey.actor === 'consumer');
    expect(byPlatform('web')).toHaveLength(1);
    expect(byPlatform('react-native')).toHaveLength(1);
  });

  it('shows retrieval, eval, the plugin, observability, and release as owners', () => {
    const owners = new Set(steps.map(({ step }) => step.owner));
    for (const id of [
      'consumer-retrieval',
      'consumer-eval',
      'berry-commit',
      'observability-collectors',
      'quality-lab',
      'release-scripts',
    ]) {
      expect(owners.has(id)).toBe(true);
    }
  });
});
