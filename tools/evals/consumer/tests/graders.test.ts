import { describe, expect, it } from 'vitest';

import {
  gradePublicImport,
  gradeRetrieval,
  gradeRouting,
  gradeTaskSuccess,
  gradeVerification,
  loadPackageSurfaces,
} from '../graders';
import { loadDataset } from '../runner/dataset';

import { passingVerification, requireTask, traceFor } from './helpers';

const dev = await loadDataset('dev');
const surfaces = await loadPackageSurfaces();
const web = requireTask(dev, 'web-button-loading');
const none = requireTask(dev, 'no-ui-date-format');

const surfaceFor = (name: string) => {
  const surface = surfaces.find((s) => s.name === name);
  if (!surface) throw new Error(`workspace has no package surface for ${name}`);
  return surface;
};

describe('routing grader', () => {
  it('reports null when the executor did not record a selection', () => {
    const g = gradeRouting(web, traceFor(web));
    expect(g.platformCorrect).toBeNull();
    expect(g.packageCorrect).toBeNull();
  });

  it('accepts an exact platform and package match', () => {
    const g = gradeRouting(
      web,
      traceFor(web, { selectedPlatform: 'web', selectedPackages: ['@berrypjh/react-ui'] }),
    );
    expect(g).toMatchObject({ platformCorrect: true, packageCorrect: true });
    expect(g.forbiddenPackagesUsed).toEqual([]);
  });

  it('flags a forbidden package and a wrong package set', () => {
    const g = gradeRouting(
      web,
      traceFor(web, {
        selectedPlatform: 'web',
        selectedPackages: ['@berrypjh/react-ui', '@berrypjh/ui-core'],
      }),
    );
    expect(g.packageCorrect).toBe(false);
    expect(g.forbiddenPackagesUsed).toEqual(['@berrypjh/ui-core']);
  });

  it('flags unnecessary UI routing on a "none" task', () => {
    const clean = gradeRouting(
      none,
      traceFor(none, { selectedPlatform: 'none', selectedPackages: [] }),
    );
    expect(clean.unnecessaryUiRouting).toBe(false);

    const noisy = gradeRouting(
      none,
      traceFor(none, {
        selectedPlatform: 'none',
        selectedPackages: [],
        retrieved: ['component:@berrypjh/react-ui#Button'],
      }),
    );
    expect(noisy.unnecessaryUiRouting).toBe(true);
  });

  it('leaves unnecessaryUiRouting null for non-"none" tasks', () => {
    expect(
      gradeRouting(web, traceFor(web, { selectedPlatform: 'web', selectedPackages: [] }))
        .unnecessaryUiRouting,
    ).toBeNull();
  });
});

describe('retrieval grader', () => {
  it('computes recall@K and reciprocal rank on exact evidence ids', () => {
    const g = gradeRetrieval(web, traceFor(web, { retrieved: web.expected.requiredEvidence }), 5);
    expect(g.recallAtK).toBe(1);
    expect(g.reciprocalRank).toBe(1);
    expect(g.duplicateRetrievals).toBe(0);
  });

  it('scores a miss as zero reciprocal rank, not null', () => {
    const g = gradeRetrieval(web, traceFor(web, { retrieved: ['token:color.primary.pr500'] }), 5);
    expect(g.recallAtK).toBe(0);
    expect(g.reciprocalRank).toBe(0);
    expect(g.firstHitRank).toBeNull();
  });

  it('returns null when the task declares no required evidence', () => {
    const g = gradeRetrieval(none, traceFor(none, { retrieved: [] }), 5);
    expect(g.recallAtK).toBeNull();
    expect(g.reciprocalRank).toBeNull();
  });

  it('counts duplicate retrievals', () => {
    const g = gradeRetrieval(
      web,
      traceFor(web, { retrieved: ['package:@berrypjh/react-ui', 'package:@berrypjh/react-ui'] }),
      5,
    );
    expect(g.duplicateRetrievals).toBe(1);
  });

  it('honours K when ranking beyond the cutoff', () => {
    const padding = ['token:radius.md', 'token:radius.sm', 'token:radius.lg', 'token:radius.xl'];
    const g = gradeRetrieval(
      web,
      traceFor(web, { retrieved: [...padding, ...web.expected.requiredEvidence] }),
      2,
    );
    expect(g.hitsAtK).toBe(0);
    expect(g.recallAtK).toBe(0);
    expect(g.firstHitRank).toBe(5);
  });
});

describe('public import grader', () => {
  it('derives allowed specifiers from the real package exports', () => {
    const reactUi = surfaceFor('@berrypjh/react-ui');
    expect(reactUi.publicSpecifiers).toContain('@berrypjh/react-ui');
    expect(reactUi.publicSpecifiers).toContain('@berrypjh/react-ui/styles.css');
    expect(surfaceFor('@berrypjh/ui-core').consumerFacing).toBe(false);
  });

  it('passes a correct consumer import', () => {
    const g = gradePublicImport(
      [
        {
          path: 'src/App.tsx',
          content: `import '@berrypjh/react-ui/styles.css';\nimport { Button } from '@berrypjh/react-ui';\nexport const A = () => <Button />;`,
        },
      ],
      surfaces,
    );
    expect(g.passed).toBe(true);
    expect(g.violations).toEqual([]);
  });

  it('catches deep source, private package and unknown subpath imports', () => {
    const g = gradePublicImport(
      [
        {
          path: 'src/Bad.ts',
          content: [
            `import { Button } from '@berrypjh/react-ui/src/components/button';`,
            `import type { ButtonProps } from '@berrypjh/ui-core';`,
            `import { themes } from '@berrypjh/design-tokens';`,
            `import { cx } from '@berrypjh/react-ui/internal';`,
            `import x from '../../libs/react-ui/src/index';`,
            `const y = require('libs/react-native-ui/src/components/box');`,
          ].join('\n'),
        },
      ],
      surfaces,
    );
    expect(g.passed).toBe(false);
    expect(g.violations.map((v) => v.kind).sort()).toEqual([
      'deep-source-import',
      'deep-source-import',
      'private-package-import',
      'private-package-import',
      'relative-lib-escape',
      'unknown-subpath',
    ]);
    // 두 internal 패키지가 모두 걸려야 한다 — 하나만 막히면 경계가 반쪽이다.
    expect(
      g.violations
        .filter((v) => v.kind === 'private-package-import')
        .map((v) => v.specifier)
        .sort(),
    ).toEqual(['@berrypjh/design-tokens', '@berrypjh/ui-core']);
  });

  it('ignores specifier-shaped text inside comments and strings', () => {
    const g = gradePublicImport(
      [
        {
          path: 'src/Note.ts',
          content: `// import { Button } from '@berrypjh/react-ui/src/x';\nexport const doc = "@berrypjh/ui-core";`,
        },
      ],
      surfaces,
    );
    expect(g.violations).toEqual([]);
  });
});

describe('verification grader', () => {
  it('passes only when every required check ran and passed', () => {
    const g = gradeVerification(web, traceFor(web, { verification: passingVerification(web) }));
    expect(g.passed).toBe(true);
    expect(g.invocationRate).toBe(1);
  });

  it('fails when a required check was never invoked', () => {
    const runs = passingVerification(web).filter((v) => v.kind !== 'test');
    const g = gradeVerification(web, traceFor(web, { verification: runs }));
    expect(g.missingRequired).toEqual(['test']);
    expect(g.passed).toBe(false);
    expect(g.invocationRate).toBeCloseTo(2 / 3);
  });

  it('fails when a required check ran and failed', () => {
    const runs = passingVerification(web).map((v) =>
      v.kind === 'typecheck'
        ? { ...v, status: 'failed' as const, exitCode: 2, failureFingerprint: 'typecheck:TS2305' }
        : v,
    );
    const g = gradeVerification(web, traceFor(web, { verification: runs }));
    expect(g.failedRequired).toEqual(['typecheck']);
    expect(g.passed).toBe(false);
  });
});

describe('task success grader', () => {
  const inputsFor = (trace: ReturnType<typeof traceFor>) => ({
    trace,
    routing: gradeRouting(web, trace),
    retrieval: gradeRetrieval(web, trace),
    publicImport: gradePublicImport(trace.changedFiles, surfaces),
    verification: gradeVerification(web, trace),
  });

  it('marks a fully verified trial as a success', () => {
    const trace = traceFor(web, {
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      changedFiles: [
        { path: 'src/App.tsx', content: `import { Button } from '@berrypjh/react-ui';` },
      ],
      verification: passingVerification(web),
      claimedSuccess: true,
    });
    const g = gradeTaskSuccess(inputsFor(trace));
    expect(g).toEqual({
      taskSucceeded: true,
      falseSuccess: false,
      claimCounted: true,
      failureCategory: null,
    });
  });

  it('separates claimed success from verified success', () => {
    const trace = traceFor(web, {
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      changedFiles: [
        { path: 'src/App.tsx', content: `import { Button } from '@berrypjh/react-ui';` },
      ],
      verification: passingVerification(web).filter((v) => v.kind !== 'test'),
      claimedSuccess: true,
    });
    const g = gradeTaskSuccess(inputsFor(trace));
    expect(g.taskSucceeded).toBe(false);
    expect(g.falseSuccess).toBe(true);
    expect(g.failureCategory).toBe('verification-omitted');
  });

  it('reports a non-public import as its own failure category', () => {
    const trace = traceFor(web, {
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      changedFiles: [
        {
          path: 'src/App.tsx',
          content: `import { Button } from '@berrypjh/react-ui/src/components/button';`,
        },
      ],
      verification: passingVerification(web),
      claimedSuccess: true,
    });
    expect(gradeTaskSuccess(inputsFor(trace)).failureCategory).toBe('public-api-violation');
  });

  it('reports unrecorded routing rather than guessing', () => {
    expect(gradeTaskSuccess(inputsFor(traceFor(web))).failureCategory).toBe('routing-unreported');
  });
});

describe('false success table', () => {
  const run = (kind: 'typecheck', status: 'passed' | 'failed') => ({
    kind,
    required: true,
    status,
    command: 'stub',
    exitCode: status === 'passed' ? 0 : 2,
    durationMs: 1,
    attempt: 1,
    failureFingerprint: status === 'failed' ? 'typecheck|stub|TS2322|App.tsx:1' : null,
    excerpt: null,
  });

  /** required verification 하나만 갖는 최소 task로 표를 만든다. */
  const minimal = { ...web, verification: [{ kind: 'typecheck' as const, required: true }] };

  const grade = (claimed: boolean | 'unknown' | null, verification: ReturnType<typeof run>[]) => {
    const trace = traceFor(minimal, {
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      retrieved: minimal.expected.requiredEvidence,
      claimedSuccess: claimed,
      verification,
    });
    return gradeTaskSuccess({
      trace,
      routing: gradeRouting(minimal, trace),
      retrieval: gradeRetrieval(minimal, trace),
      publicImport: gradePublicImport(trace.changedFiles, surfaces),
      verification: gradeVerification(minimal, trace),
    });
  };

  it.each([
    ['claimed true + required check failed', true, [run('typecheck', 'failed')], true, true],
    ['claimed true + required check omitted', true, [], true, true],
    ['claimed true + required check passed', true, [run('typecheck', 'passed')], false, true],
    ['claimed false + required check failed', false, [run('typecheck', 'failed')], false, true],
  ])('%s', (_label, claimed, verification, falseSuccess, counted) => {
    const g = grade(claimed as boolean, verification);
    expect(g.falseSuccess).toBe(falseSuccess);
    expect(g.claimCounted).toBe(counted);
  });

  it('excludes an unknown claim from the false success denominator', () => {
    const g = grade('unknown', [run('typecheck', 'failed')]);
    expect(g.falseSuccess).toBe(false);
    expect(g.claimCounted).toBe(false);
    expect(g.taskSucceeded).toBe(false);
  });

  it('excludes an unreported claim from the denominator too', () => {
    expect(grade(null, [run('typecheck', 'failed')]).claimCounted).toBe(false);
  });
});
