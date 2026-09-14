import { axeRuleSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { AxeResultError, normalizeAxeResults } from './axe';

type Node = { target: unknown; html: string; impact: string | null };

const node = (target: unknown, html = '<p>x</p>', impact: string | null = null): Node => ({
  target,
  html,
  impact,
});

const axeRule = (id: string, impact: string | null, nodes: Node[]) => ({
  id,
  impact,
  tags: ['wcag2aa'],
  description: `${id} description`,
  help: `${id} help`,
  helpUrl: `https://dequeuniversity.com/rules/axe/4.11/${id}?application=axeAPI`,
  nodes: nodes.map((item) => ({ ...item, any: [], all: [], none: [], failureSummary: 'Fix it' })),
});

const results = (overrides: Record<string, unknown> = {}) => ({
  testEngine: { name: 'axe-core', version: '4.11.1' },
  testRunner: { name: 'axe' },
  testEnvironment: { userAgent: 'Mozilla/5.0 HeadlessChrome/140', windowWidth: 1280 },
  url: 'http://localhost:4300/bundles',
  timestamp: '2026-09-13T12:00:00.000Z',
  toolOptions: {},
  violations: [],
  incomplete: [],
  inapplicable: [axeRule('audio-caption', null, [])],
  passes: [axeRule('document-title', null, [node(['html'], '<html>')])],
  ...overrides,
});

describe('normalizeAxeResults', () => {
  it('위반 0 과 incomplete 를 따로 센다 — incomplete 는 통과가 아니다', () => {
    const normalized = normalizeAxeResults(
      results({
        incomplete: [
          axeRule('aria-valid-attr-value', null, [
            node(['#email'], '<input aria-describedby="hint">'),
          ]),
        ],
      }),
    );
    expect(normalized.engine).toEqual({ name: 'axe-core', version: '4.11.1' });
    expect(normalized.counts).toEqual({
      violationRules: 0,
      violationNodes: 0,
      incompleteRules: 1,
      incompleteNodes: 1,
      inapplicableRules: 1,
      passRules: 1,
    });
    expect(normalized.incomplete[0]).toMatchObject({
      id: 'aria-valid-attr-value',
      impact: 'unknown',
    });
    expect(normalized.impactNodes).toEqual({
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      unknown: 0,
    });
    for (const item of normalized.incomplete) axeRuleSchema.parse(item);
  });

  it('impact 가 null 이면 node 의 가장 심한 impact, 그것도 없으면 unknown 이다', () => {
    const normalized = normalizeAxeResults(
      results({
        violations: [
          axeRule('label', null, [
            node(['#a'], '<input>', 'minor'),
            node(['#b'], '<input>', 'serious'),
          ]),
          axeRule('region', null, [node(['#c'])]),
        ],
      }),
    );
    expect(normalized.violations.map((item) => [item.id, item.impact])).toEqual([
      ['label', 'serious'],
      ['region', 'unknown'],
    ]);
    expect(normalized.impactNodes).toEqual({
      critical: 0,
      serious: 2,
      moderate: 0,
      minor: 0,
      unknown: 1,
    });
  });

  it('같은 rule 이 두 번 오면 합치고 같은 node 는 한 번만 센다', () => {
    const normalized = normalizeAxeResults(
      results({
        violations: [
          axeRule('color-contrast', 'serious', [node(['p'])]),
          axeRule('color-contrast', 'serious', [node(['p']), node(['a'])]),
        ],
      }),
    );
    expect(normalized.violations).toHaveLength(1);
    expect(normalized.violations[0].nodeCount).toBe(2);
    expect(normalized.counts).toMatchObject({ violationRules: 1, violationNodes: 2 });
  });

  it('axe 결과가 없거나 모양이 틀리면 오류다 — 위반 0 으로 읽지 않는다', () => {
    expect(() => normalizeAxeResults(undefined)).toThrow(AxeResultError);
    expect(() => normalizeAxeResults(undefined)).toThrow('axe 결과가 없습니다');
    expect(() => normalizeAxeResults({ violations: [] })).toThrow(/axe 결과 모양이 다릅니다/);
  });

  it('html 발췌·helpUrl 을 정제하고 브라우저 환경 정보를 싣지 않는다', () => {
    const token = `ghp_${'a'.repeat(30)}`;
    const normalized = normalizeAxeResults(
      results({
        violations: [
          axeRule('link-name', 'serious', [
            node(
              ['a.secret'],
              `<a href="/private?token=abc#frag" data-key="${token}">/Users/park/app ${'x'.repeat(400)}</a>`,
            ),
          ]),
        ],
      }),
    );
    const [violation] = normalized.violations;
    const excerpt = violation.nodes[0].excerpt ?? '';
    expect(excerpt).toContain('[redacted]');
    expect(excerpt).toContain('~/app');
    expect(excerpt).not.toContain('token=abc');
    expect(excerpt).not.toContain('ghp_');
    expect(excerpt.length).toBeLessThanOrEqual(200);
    expect(violation.helpUrl).toBe('https://dequeuniversity.com/rules/axe/4.11/link-name');
    expect(JSON.stringify(normalized)).not.toContain('HeadlessChrome');
    axeRuleSchema.parse(violation);
  });

  it('shadow DOM·iframe target 은 경로를 이어 쓰고 node 는 20개까지 싣는다', () => {
    const many = Array.from({ length: 25 }, (_, index) => node([`#n${index}`]));
    const normalized = normalizeAxeResults(
      results({
        violations: [
          axeRule('button-name', 'critical', [node([['#host', 'button']])]),
          axeRule('image-alt', 'critical', many),
        ],
      }),
    );
    expect(normalized.violations[0].nodes[0].target).toEqual(['#host >>> button']);
    expect(normalized.violations[1]).toMatchObject({ nodeCount: 25 });
    expect(normalized.violations[1].nodes).toHaveLength(20);
    expect(normalized.impactNodes.critical).toBe(26);
  });
});
