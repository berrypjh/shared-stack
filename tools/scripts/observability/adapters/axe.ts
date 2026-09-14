import {
  AXE_IMPACTS,
  type AxeCounts,
  type AxeImpact,
  type AxeRule,
  type ImpactNodes,
  MAX_AXE_NODES,
  sanitizeExcerpt,
} from '@berrypjh/observability-contracts';

import { z } from 'zod';

/**
 * axe-core `AxeResults` → 공개 가능한 rule·node. 원본 html·환경(userAgent 등)은 싣지 않고,
 * impact null 을 pass 로 읽지 않는다. 결과가 없으면 0 위반이 아니라 오류다.
 */

/** Storybook test-runner 와 quality-lab audit 이 같은 WCAG tag 로 검사한다. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

export class AxeResultError extends Error {}

const nodeSchema = z.looseObject({
  target: z.array(z.union([z.string(), z.array(z.string())])),
  html: z.string().optional(),
  impact: z.string().nullable().optional(),
});

const ruleSchema = z.looseObject({
  id: z.string().min(1),
  impact: z.string().nullable().optional(),
  tags: z.array(z.string()),
  help: z.string(),
  helpUrl: z.string().optional(),
  nodes: z.array(nodeSchema),
});

const resultsSchema = z.looseObject({
  testEngine: z.looseObject({ name: z.string(), version: z.string() }),
  violations: z.array(ruleSchema),
  incomplete: z.array(ruleSchema),
  inapplicable: z.array(ruleSchema),
  passes: z.array(ruleSchema),
});

type RawRule = z.infer<typeof ruleSchema>;
type RawNode = z.infer<typeof nodeSchema>;

const EXCERPT_MAX = 200;
const TARGET_MAX = 300;
const SEVERITY: Record<string, number> = { minor: 1, moderate: 2, serious: 3, critical: 4 };

const isImpact = (value: unknown): value is Exclude<AxeImpact, 'unknown'> =>
  typeof value === 'string' && value in SEVERITY;

/** 가장 심한 impact. 알 수 있는 값이 없으면 unknown. */
const worst = (values: unknown[]): AxeImpact =>
  values
    .filter(isImpact)
    .reduce<AxeImpact>(
      (best, value) => (best === 'unknown' || SEVERITY[value] > SEVERITY[best] ? value : best),
      'unknown',
    );

/** 속성 URL 의 query·fragment 를 떼고 credential·홈 경로를 가린 뒤 자른다. */
const excerptOf = (html: string | undefined) => {
  if (!html) return null;
  const stripped = html
    .replace(/\s+/g, ' ')
    .replace(/((?:href|src|action|srcset)=["'][^"'?#]*)[?#][^"']*/gi, '$1');
  return sanitizeExcerpt(stripped, EXCERPT_MAX);
};

const targetOf = (node: RawNode): string[] => {
  const parts = node.target
    .map((part) => (Array.isArray(part) ? part.join(' >>> ') : part))
    .filter((part) => part.length > 0)
    .map((part) => sanitizeExcerpt(part, TARGET_MAX));
  return parts.length > 0 ? parts.slice(0, 5) : ['(target 없음)'];
};

const helpUrlOf = (value: string | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'dequeuniversity.com'
      ? `${url.origin}${url.pathname}`
      : null;
  } catch {
    return null;
  }
};

/** 같은 rule id 는 합치고, 같은 target 의 node 는 한 번만 센다. */
type MergedRule = { rule: RawRule; impacts: unknown[]; nodes: Map<string, RawNode> };

const normalizeRules = (rules: RawRule[]): AxeRule[] => {
  const merged = new Map<string, MergedRule>();
  for (const rule of rules) {
    const entry: MergedRule = merged.get(rule.id) ?? { rule, impacts: [], nodes: new Map() };
    entry.impacts.push(rule.impact);
    for (const node of rule.nodes) {
      const key = JSON.stringify(node.target);
      if (!entry.nodes.has(key)) entry.nodes.set(key, node);
    }
    merged.set(rule.id, entry);
  }
  return [...merged.values()].map(({ rule, impacts, nodes }) => {
    const all = [...nodes.values()];
    const declared = worst(impacts);
    return {
      id: rule.id,
      impact: declared === 'unknown' ? worst(all.map((node) => node.impact)) : declared,
      tags: rule.tags.filter((tag) => /^[\w.-]{1,40}$/.test(tag)).slice(0, 40),
      help: sanitizeExcerpt(rule.help, 300) || rule.id,
      helpUrl: helpUrlOf(rule.helpUrl),
      nodeCount: all.length,
      nodes: all.slice(0, MAX_AXE_NODES).map((node) => ({
        target: targetOf(node),
        excerpt: excerptOf(node.html),
      })),
    };
  });
};

const nodeTotal = (rules: AxeRule[]) => rules.reduce((sum, rule) => sum + rule.nodeCount, 0);

export type NormalizedAxe = {
  engine: { name: 'axe-core'; version: string };
  counts: AxeCounts;
  impactNodes: ImpactNodes;
  violations: AxeRule[];
  incomplete: AxeRule[];
};

export const normalizeAxeResults = (raw: unknown): NormalizedAxe => {
  if (raw === undefined || raw === null) throw new AxeResultError('axe 결과가 없습니다');
  const parsed = resultsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AxeResultError(
      `axe 결과 모양이 다릅니다: ${z.prettifyError(parsed.error).replace(/\s+/g, ' ').slice(0, 300)}`,
    );
  }
  const { testEngine } = parsed.data;
  if (testEngine.name !== 'axe-core' || !/^\d+\.\d+\.\d+$/.test(testEngine.version)) {
    throw new AxeResultError(`axe-core 결과가 아닙니다 (${testEngine.name} ${testEngine.version})`);
  }
  const violations = normalizeRules(parsed.data.violations);
  const incomplete = normalizeRules(parsed.data.incomplete);
  const impactNodes = Object.fromEntries(
    AXE_IMPACTS.map((impact) => [
      impact,
      nodeTotal(violations.filter((rule) => rule.impact === impact)),
    ]),
  ) as ImpactNodes;
  return {
    engine: { name: 'axe-core', version: testEngine.version },
    counts: {
      violationRules: violations.length,
      violationNodes: nodeTotal(violations),
      incompleteRules: incomplete.length,
      incompleteNodes: nodeTotal(incomplete),
      inapplicableRules: new Set(parsed.data.inapplicable.map((rule) => rule.id)).size,
      passRules: new Set(parsed.data.passes.map((rule) => rule.id)).size,
    },
    impactNodes,
    violations,
    incomplete,
  };
};
