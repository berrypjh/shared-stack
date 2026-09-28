import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { accessibilitySummarySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import {
  AUDIT_ROUTES,
  AUDIT_THEMES,
  AUDIT_VIEWPORTS,
  auditTargets,
  parseQualityArgs,
  QualityArgsError,
  runDevhubAudit,
} from './audit';

const NOW = new Date('2026-09-13T12:00:00.000Z');
const clock = () => NOW;

const axe = (violations: unknown[] = []) => ({
  testEngine: { name: 'axe-core', version: '4.11.1' },
  violations,
  incomplete: [],
  inapplicable: [],
  passes: [],
});

describe('parseQualityArgs — localhost DevHub 만 검사한다', () => {
  it('base URL 과 run id 를 읽고 run id 가 없으면 시각으로 만든다', () => {
    expect(parseQualityArgs(['--base-url=http://localhost:4400'], clock)).toEqual({
      baseUrl: 'http://localhost:4400',
      runId: 'a11y-20260913-1200',
    });
    expect(
      parseQualityArgs(['--base-url=http://127.0.0.1:4400', '--run-id=local-a11y-01'], clock),
    ).toEqual({ baseUrl: 'http://127.0.0.1:4400', runId: 'local-a11y-01' });
  });

  it('원격·경로·query·모르는 flag 는 거부한다', () => {
    for (const argv of [
      ['--base-url=https://example.com'],
      ['--base-url=http://192.168.0.2:4400'],
      ['--base-url=http://localhost:4400/bundles'],
      ['--base-url=http://localhost:4400?x=1'],
      ['--base-url=http://localhost:4400', '--url=http://evil'],
      [],
    ]) {
      expect(() => parseQualityArgs(argv, clock)).toThrow(QualityArgsError);
    }
  });
});

describe('audit target', () => {
  it('route 목록은 DevHub 평가 화면 목록과 같다', () => {
    const screens = readFileSync(
      fileURLToPath(new URL('../../../apps/devhub/src/lib/evaluation/screens.ts', import.meta.url)),
      'utf8',
    );
    expect([...screens.matchAll(/path: '([^']+)'/g)].map((match) => match[1])).toEqual(
      AUDIT_ROUTES,
    );
  });

  it('route × theme × viewport 를 모두 명시한다', () => {
    const targets = auditTargets();
    expect(AUDIT_THEMES).toEqual(['light', 'dark']);
    expect(AUDIT_VIEWPORTS.map((viewport) => viewport.name)).toEqual(['desktop', 'mobile']);
    expect(targets).toHaveLength(AUDIT_ROUTES.length * 4);
    expect(
      targets.find((item) => item.id === 'devhub:/evaluation/bundles:dark:mobile'),
    ).toMatchObject({
      route: '/evaluation/bundles',
      theme: 'dark',
      viewport: { name: 'mobile', width: 390, height: 844 },
    });
  });
});

describe('runDevhubAudit', () => {
  const base = { baseUrl: 'http://localhost:4400', now: clock };

  it('base URL 에 닿지 않으면 브라우저를 열지 않고 not-run 이다', async () => {
    const openBrowser = vi.fn();
    const summary = await runDevhubAudit({
      ...base,
      reachable: async () => false,
      openBrowser,
    });
    accessibilitySummarySchema.parse(summary);
    expect(openBrowser).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ sourceScope: 'devhub', outcome: 'not-run', targets: [] });
    expect(summary.reason).toContain('pnpm dev:devhub');
  });

  it('브라우저를 띄우지 못하면 scan-failed 이고 target 을 지어내지 않는다', async () => {
    const summary = await runDevhubAudit({
      ...base,
      reachable: async () => true,
      openBrowser: async () => {
        throw new Error('browserType.launch: Timeout 30000ms exceeded');
      },
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary).toMatchObject({ outcome: 'scan-failed', targets: [] });
    expect(summary.reason).toContain('Timeout 30000ms');
  });

  it('target 별 실패·axe 결과 누락은 그 target 만 실패로 두고 partial 이다', async () => {
    const close = vi.fn(async () => undefined);
    const scan = vi.fn(async (target: { id: string }) => {
      if (target.id === 'devhub:/evaluation/ai:dark:desktop')
        throw new Error('page.goto: net::ERR_CONNECTION_RESET at /Users/park/x');
      if (target.id === 'devhub:/evaluation/design-system:light:mobile') return undefined;
      return axe();
    });
    const summary = await runDevhubAudit({
      ...base,
      reachable: async () => true,
      openBrowser: async () => ({ scan, close }),
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('partial');
    expect(close).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledTimes(auditTargets().length);
    const byId = Object.fromEntries(summary.targets.map((item) => [item.id, item]));
    expect(byId['devhub:/evaluation/ai:dark:desktop']).toMatchObject({
      status: 'scan-failed',
      counts: null,
    });
    expect(byId['devhub:/evaluation/ai:dark:desktop'].reason).toContain('~/x');
    expect(byId['devhub:/evaluation/design-system:light:mobile'].reason).toContain(
      'axe 결과가 없습니다',
    );
    expect(byId['devhub:/evaluation/bundles:light:desktop']).toMatchObject({
      status: 'scanned',
      scope: 'document',
      counts: { violationRules: 0, violationNodes: 0 },
    });
    expect(summary.engine).toEqual({ name: 'axe-core', version: '4.11.1' });
  });

  it('모든 target 이 실패하면 scan-failed 다', async () => {
    const summary = await runDevhubAudit({
      ...base,
      reachable: async () => true,
      openBrowser: async () => ({
        scan: async () => {
          throw new Error('boom');
        },
        close: async () => undefined,
      }),
    });
    expect(summary.outcome).toBe('scan-failed');
    expect(summary.targets.every((item) => item.status === 'scan-failed')).toBe(true);
  });
});
