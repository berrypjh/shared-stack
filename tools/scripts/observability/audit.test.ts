import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { accessibilitySummarySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it, vi } from 'vitest';

import {
  AUDIT_THEMES,
  AUDIT_VIEWPORTS,
  auditTargets,
  parseQualityArgs,
  QUALITY_LAB_ROUTES,
  QualityArgsError,
  runQualityLabAudit,
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

describe('parseQualityArgs — localhost quality-lab 만 검사한다', () => {
  it('base URL 과 run id 를 읽고 run id 가 없으면 시각으로 만든다', () => {
    expect(parseQualityArgs(['--base-url=http://localhost:4300'], clock)).toEqual({
      baseUrl: 'http://localhost:4300',
      runId: 'a11y-20260913-1200',
    });
    expect(
      parseQualityArgs(['--base-url=http://127.0.0.1:4300', '--run-id=local-a11y-01'], clock),
    ).toEqual({ baseUrl: 'http://127.0.0.1:4300', runId: 'local-a11y-01' });
  });

  it('원격·경로·query·모르는 flag 는 거부한다', () => {
    for (const argv of [
      ['--base-url=https://example.com'],
      ['--base-url=http://192.168.0.2:4300'],
      ['--base-url=http://localhost:4300/bundles'],
      ['--base-url=http://localhost:4300?x=1'],
      ['--base-url=http://localhost:4300', '--url=http://evil'],
      [],
    ]) {
      expect(() => parseQualityArgs(argv, clock)).toThrow(QualityArgsError);
    }
  });
});

describe('audit target', () => {
  it('route 목록은 quality-lab NAV 와 같다', () => {
    const nav = readFileSync(
      fileURLToPath(new URL('../../../apps/quality-lab/src/app/nav.ts', import.meta.url)),
      'utf8',
    );
    expect([...nav.matchAll(/path: '([^']+)'/g)].map((match) => match[1])).toEqual(
      QUALITY_LAB_ROUTES,
    );
  });

  it('route × theme × viewport 를 모두 명시한다', () => {
    const targets = auditTargets();
    expect(AUDIT_THEMES).toEqual(['light', 'dark']);
    expect(AUDIT_VIEWPORTS.map((viewport) => viewport.name)).toEqual(['desktop', 'mobile']);
    expect(targets).toHaveLength(QUALITY_LAB_ROUTES.length * 4);
    expect(targets.find((item) => item.id === 'quality-lab:/bundles:dark:mobile')).toMatchObject({
      route: '/bundles',
      theme: 'dark',
      viewport: { name: 'mobile', width: 390, height: 844 },
    });
  });
});

describe('runQualityLabAudit', () => {
  const base = { baseUrl: 'http://localhost:4300', now: clock };

  it('base URL 에 닿지 않으면 브라우저를 열지 않고 not-run 이다', async () => {
    const openBrowser = vi.fn();
    const summary = await runQualityLabAudit({
      ...base,
      reachable: async () => false,
      openBrowser,
    });
    accessibilitySummarySchema.parse(summary);
    expect(openBrowser).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ sourceScope: 'quality-lab', outcome: 'not-run', targets: [] });
    expect(summary.reason).toContain('pnpm quality:lab');
  });

  it('브라우저를 띄우지 못하면 scan-failed 이고 target 을 지어내지 않는다', async () => {
    const summary = await runQualityLabAudit({
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
      if (target.id === 'quality-lab:/ai:dark:desktop')
        throw new Error('page.goto: net::ERR_CONNECTION_RESET at /Users/park/x');
      if (target.id === 'quality-lab:/runs:light:mobile') return undefined;
      return axe();
    });
    const summary = await runQualityLabAudit({
      ...base,
      reachable: async () => true,
      openBrowser: async () => ({ scan, close }),
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('partial');
    expect(close).toHaveBeenCalledTimes(1);
    expect(scan).toHaveBeenCalledTimes(auditTargets().length);
    const byId = Object.fromEntries(summary.targets.map((item) => [item.id, item]));
    expect(byId['quality-lab:/ai:dark:desktop']).toMatchObject({
      status: 'scan-failed',
      counts: null,
    });
    expect(byId['quality-lab:/ai:dark:desktop'].reason).toContain('~/x');
    expect(byId['quality-lab:/runs:light:mobile'].reason).toContain('axe 결과가 없습니다');
    expect(byId['quality-lab:/bundles:light:desktop']).toMatchObject({
      status: 'scanned',
      scope: 'document',
      counts: { violationRules: 0, violationNodes: 0 },
    });
    expect(summary.engine).toEqual({ name: 'axe-core', version: '4.11.1' });
  });

  it('모든 target 이 실패하면 scan-failed 다', async () => {
    const summary = await runQualityLabAudit({
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
