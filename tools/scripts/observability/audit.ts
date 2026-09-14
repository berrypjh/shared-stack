import {
  type AccessibilitySummary,
  type AuditTarget,
  runIdSchema,
  sanitizeExcerpt,
} from '@berrypjh/observability-contracts';

import { normalizeAxeResults, WCAG_TAGS } from './adapters/axe';

/**
 * quality-lab 을 localhost 에서 axe 로 검사한다. URL·route·theme·viewport 는 여기 정한 목록뿐이고,
 * 브라우저 조작은 주입한 `openBrowser` 가 한다 — 이 모듈은 결과를 정규화하고 실패를 그대로 남긴다.
 */

/** quality-lab NAV 의 route. `audit.test.ts` 가 nav.ts 와 같은지 확인한다. */
export const QUALITY_LAB_ROUTES = [
  '/',
  '/quality/tests',
  '/quality/checks',
  '/quality/packages',
  '/bundles',
  '/ai',
  '/design-system',
  '/accessibility',
  '/browser',
  '/runs',
] as const;

export const AUDIT_THEMES = ['light', 'dark'] as const;

export const AUDIT_VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

export const AUDIT_SCOPE = 'document';

export const USAGE =
  'usage: pnpm quality --base-url=http://localhost:4300 [--run-id=<id>]  (quality-lab 을 pnpm quality:lab 으로 먼저 띄운다)';

export class QualityArgsError extends Error {}

export type QualityArgs = { baseUrl: string; runId: string };

const ALLOWED_HOSTS = ['localhost', '127.0.0.1'];

const pad = (value: number) => String(value).padStart(2, '0');

const defaultRunId = (date: Date) =>
  `a11y-${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}`;

/** localhost quality-lab 만 받는다. 경로·query·credential 이 붙은 URL 은 거부한다. */
export const parseQualityArgs = (argv: string[], now: () => Date): QualityArgs => {
  const values: Partial<Record<'base-url' | 'run-id', string>> = {};
  for (const arg of argv) {
    const match = /^--(base-url|run-id)=(.+)$/.exec(arg);
    if (!match || values[match[1] as 'base-url' | 'run-id'] !== undefined) {
      throw new QualityArgsError(`알 수 없는 인자: ${arg}\n${USAGE}`);
    }
    values[match[1] as 'base-url' | 'run-id'] = match[2];
  }
  if (!values['base-url']) throw new QualityArgsError(`--base-url 이 필요합니다\n${USAGE}`);

  let url: URL;
  try {
    url = new URL(values['base-url']);
  } catch {
    throw new QualityArgsError(`--base-url 이 URL 이 아닙니다\n${USAGE}`);
  }
  const rawPath = values['base-url'].replace(/^[a-z]+:\/\/[^/?#]+/i, '');
  if (
    url.protocol !== 'http:' ||
    !ALLOWED_HOSTS.includes(url.hostname) ||
    !['', '/'].includes(rawPath) ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new QualityArgsError(
      `--base-url 은 http://localhost:<port> 또는 http://127.0.0.1:<port> 만 받습니다\n${USAGE}`,
    );
  }

  const runId = values['run-id'] ?? defaultRunId(now());
  if (!runIdSchema.safeParse(runId).success) {
    throw new QualityArgsError(`--run-id 는 소문자 kebab-case 여야 합니다\n${USAGE}`);
  }
  return { baseUrl: `${url.protocol}//${url.host}`, runId };
};

export type AuditTargetSpec = {
  id: string;
  label: string;
  route: (typeof QUALITY_LAB_ROUTES)[number];
  theme: (typeof AUDIT_THEMES)[number];
  viewport: (typeof AUDIT_VIEWPORTS)[number];
};

export const auditTargets = (): AuditTargetSpec[] =>
  QUALITY_LAB_ROUTES.flatMap((route) =>
    AUDIT_THEMES.flatMap((theme) =>
      AUDIT_VIEWPORTS.map((viewport) => ({
        id: `quality-lab:${route}:${theme}:${viewport.name}`,
        label: `${route} · ${theme} · ${viewport.name} ${viewport.width}×${viewport.height}`,
        route,
        theme,
        viewport,
      })),
    ),
  );

/** target 하나를 열고 안정화한 뒤 axe 원본 결과를 돌려준다. */
export type AuditBrowser = {
  scan: (target: AuditTargetSpec, url: string) => Promise<unknown>;
  close: () => Promise<void>;
};

export const AUDIT_LIMITATIONS = [
  '자동 검사는 WCAG 일부만 봅니다 — keyboard 흐름·focus 가시성·스크린리더·읽기 순서·복합 대비는 수동 확인 대상입니다',
  'incomplete 는 사람이 확인해야 하는 결과이고 통과가 아닙니다',
  'rule 통과 수는 접근성 성공률이 아닙니다',
  '안정화: networkidle 뒤 h1 이 보이고 aria-busy 가 사라지고 글꼴이 로드된 다음 reduced-motion 으로 검사합니다',
];

const errorText = (error: unknown) =>
  sanitizeExcerpt(error instanceof Error ? error.message : String(error), 300).replace(/\s+/g, ' ');

const unscanned = {
  scannedAt: null,
  counts: null,
  impactNodes: null,
  violations: [],
  incomplete: [],
};

const head = (spec: AuditTargetSpec) => ({
  id: spec.id,
  label: spec.label,
  route: spec.route,
  storyId: null,
  theme: spec.theme,
  viewport: { ...spec.viewport },
  scope: AUDIT_SCOPE,
});

export const runQualityLabAudit = async ({
  baseUrl,
  now,
  reachable,
  openBrowser,
}: {
  baseUrl: string;
  now: () => Date;
  reachable: () => Promise<boolean>;
  openBrowser: () => Promise<AuditBrowser>;
}): Promise<AccessibilitySummary> => {
  const startedAt = now().toISOString();
  const base = {
    id: 'a11y:quality-lab',
    sourceScope: 'quality-lab' as const,
    source: 'axe-playwright' as const,
    tags: [...WCAG_TAGS],
    enabledRules: ['color-contrast'],
    exclusions: [],
    index: null,
    checks: [],
    manual: [],
    limitations: AUDIT_LIMITATIONS,
    startedAt,
  };
  const stopped = (outcome: 'not-run' | 'scan-failed', reason: string): AccessibilitySummary => ({
    ...base,
    engine: null,
    finishedAt: now().toISOString(),
    outcome,
    reason,
    targets: [],
  });

  if (!(await reachable())) {
    return stopped(
      'not-run',
      `${baseUrl} 에 연결할 수 없습니다 — 다른 터미널에서 pnpm quality:lab 으로 먼저 띄웁니다`,
    );
  }

  let browser: AuditBrowser;
  try {
    browser = await openBrowser();
  } catch (error) {
    return stopped('scan-failed', `브라우저를 띄우지 못했습니다 — ${errorText(error)}`);
  }

  const targets: AuditTarget[] = [];
  let engine: AccessibilitySummary['engine'] = null;
  try {
    for (const spec of auditTargets()) {
      try {
        const normalized = normalizeAxeResults(await browser.scan(spec, `${baseUrl}${spec.route}`));
        engine = engine ?? normalized.engine;
        targets.push({
          ...head(spec),
          status: 'scanned',
          reason: null,
          scannedAt: now().toISOString(),
          counts: normalized.counts,
          impactNodes: normalized.impactNodes,
          violations: normalized.violations,
          incomplete: normalized.incomplete,
        });
      } catch (error) {
        targets.push({
          ...head(spec),
          ...unscanned,
          status: 'scan-failed',
          reason: `검사 실패 — ${errorText(error)}`,
        });
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }

  const failed = targets.filter((target) => target.status === 'scan-failed').length;
  const outcome =
    failed === 0 ? 'completed' : failed === targets.length ? 'scan-failed' : 'partial';
  return {
    ...base,
    engine,
    finishedAt: now().toISOString(),
    outcome,
    reason: outcome === 'completed' ? null : `target ${targets.length}개 중 ${failed}개 검사 실패`,
    targets,
  };
};
