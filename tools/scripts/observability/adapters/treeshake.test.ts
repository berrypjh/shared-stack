import { describe, expect, it } from 'vitest';

import { ReportParseError } from './report';
import { parseTreeshakeReport } from './treeshake';

/** `pnpm treeshake react-ui cx Box --json` 의 모양. */
const REPORT = {
  target: 'react-ui',
  pkg: '@berrypjh/react-ui',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  scenarios: [
    { name: 'single: cx', kind: 'single', symbols: ['cx'], raw: 34244, gzip: 10697 },
    {
      name: 'single: Nope',
      kind: 'single',
      symbols: ['Nope'],
      error: 'No matching export in "libs/react-ui/dist/index.esm.js" for import "Nope"',
    },
    { name: 'multi: cx+Nope', kind: 'multi', symbols: ['cx', 'Nope'], error: 'esbuild failed' },
    { name: 'all-exports (baseline)', kind: 'all-exports', symbols: [], raw: 86916, gzip: 14508 },
  ],
};

describe('parseTreeshakeReport', () => {
  it('scenario 마다 raw·gzip 또는 오류를 가진다', () => {
    const report = parseTreeshakeReport(JSON.stringify(REPORT));
    expect(report.pkg).toBe('@berrypjh/react-ui');
    expect(report.scenarios.map((s) => [s.name, s.raw, s.gzip, s.error])).toEqual([
      ['single: cx', 34244, 10697, null],
      [
        'single: Nope',
        null,
        null,
        'No matching export in "libs/react-ui/dist/index.esm.js" for import "Nope"',
      ],
      ['multi: cx+Nope', null, null, 'esbuild failed'],
      ['all-exports (baseline)', 86916, 14508, null],
    ]);
  });

  it('JSON 이 아니면 corrupt, 모양이 다르면 invalid', () => {
    const kind = (text: string) => {
      try {
        parseTreeshakeReport(text);
        return 'ok';
      } catch (error) {
        return error instanceof ReportParseError ? error.kind : String(error);
      }
    };
    expect(kind('target:  react-ui (@berrypjh/react-ui)')).toBe('corrupt');
    expect(
      kind(
        JSON.stringify({
          ...REPORT,
          scenarios: [{ name: 'x', kind: 'single', symbols: [], raw: 1 }],
        }),
      ),
    ).toBe('invalid');
  });
});
