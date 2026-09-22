import { catalog } from '../../data';
import type { CommandRef } from '../../domain/model';

import { definitionOf } from './command-definition';
import { gatesOf, relatedOf } from './command-related';

const command = (id: string) => catalog.commands.find((c) => c.id === id) as CommandRef;
const related = (id: string) => relatedOf(catalog, command(id), definitionOf(catalog, command(id)));
const gates = (id: string) =>
  gatesOf(catalog, command(id)).map(({ workflow, job, affected }) => [
    workflow.id,
    job.id,
    affected,
  ]);

describe('definitionOf', () => {
  it('reads every command from the file that defines it', () => {
    const missing = catalog.commands.filter((c) => definitionOf(catalog, c) === null);
    expect(missing.map((c) => c.id)).toEqual([]);
  });

  it('gives the script body or the target executor and lines, verbatim', () => {
    expect(definitionOf(catalog, command('script:size'))).toEqual({
      file: 'package.json',
      key: 'scripts.size',
      executor: null,
      lines: ['size-limit'],
    });
    expect(definitionOf(catalog, command('design-tokens:build:tokens'))).toEqual({
      file: 'libs/design-tokens/project.json',
      key: 'targets.build:tokens',
      executor: 'nx:run-commands',
      lines: ['tsx libs/design-tokens/src/build.ts'],
    });
    expect(definitionOf(catalog, command('react-ui:bundle-js'))?.executor).toBe(
      '@nx/rollup:rollup',
    );
    expect(definitionOf(catalog, command('berry-commit:build'))?.file).toBe(
      'plugins/berry-commit/project.json',
    );
  });
});

describe('relatedOf', () => {
  it('names the projects and tools a definition points at', () => {
    expect(related('script:build:libs')).toEqual(
      expect.arrayContaining(['design-tokens', 'ui-core', 'react-ui', 'react-native-ui']),
    );
    expect(related('script:build:libs')).not.toContain('demo-web');
    expect(related('script:eval:consumer:smoke')).toContain('consumer-eval');
    expect(related('react-ui:build-cli')).toEqual(
      expect.arrayContaining(['react-ui', 'consumer-retrieval']),
    );
  });
});

describe('gatesOf', () => {
  it('links scripts a workflow runs, and targets it runs on affected projects', () => {
    expect(gates('script:build:libs')).toEqual([
      ['pr-check', 'size', false],
      ['pr-check', 'consumer-eval', false],
      ['consumer-eval-heldout', 'held-out', false],
    ]);
    expect(gates('react-ui:test')).toEqual([['pr-check', 'test', true]]);
    expect(gates('script:release:npm')).toEqual([['release', 'release', false]]);
  });

  it('leaves out projects a step excludes, and commands no workflow runs', () => {
    expect(gates('demo-mobile:build')).toEqual([]);
    expect(gates('demo-web:build')).toEqual([['pr-check', 'build', true]]);
    expect(gates('script:eval:consumer:dev')).toEqual([]);
  });
});
