import { z } from 'zod';

import { parseReport } from './report';

export type TreeshakeScenario = {
  name: string;
  kind: 'single' | 'multi' | 'all-exports';
  symbols: string[];
  /** minify 후 byte. 오류가 난 scenario 는 null. */
  raw: number | null;
  gzip: number | null;
  error: string | null;
};

export type TreeshakeReport = {
  target: string;
  pkg: string;
  external: string[];
  scenarios: TreeshakeScenario[];
};

const scenarioBase = {
  name: z.string().min(1),
  kind: z.enum(['single', 'multi', 'all-exports']),
  symbols: z.array(z.string()),
};

const scenarioSchema = z.union([
  z.strictObject({
    ...scenarioBase,
    raw: z.number().int().nonnegative(),
    gzip: z.number().int().nonnegative(),
  }),
  z.strictObject({ ...scenarioBase, error: z.string().min(1) }),
]);

const reportSchema = z.looseObject({
  target: z.string().min(1),
  pkg: z.string().min(1),
  external: z.array(z.string()),
  scenarios: z.array(scenarioSchema),
});

/** `pnpm treeshake <target> [symbol]... --json` 의 출력. */
export const parseTreeshakeReport = (text: string): TreeshakeReport => {
  const report = parseReport(text, reportSchema, 'treeshake-json');
  return {
    target: report.target,
    pkg: report.pkg,
    external: report.external,
    scenarios: report.scenarios.map((scenario) =>
      'error' in scenario
        ? {
            name: scenario.name,
            kind: scenario.kind,
            symbols: scenario.symbols,
            raw: null,
            gzip: null,
            error: scenario.error,
          }
        : {
            name: scenario.name,
            kind: scenario.kind,
            symbols: scenario.symbols,
            raw: scenario.raw,
            gzip: scenario.gzip,
            error: null,
          },
    ),
  };
};
