/**
 * Stable evidence ID convention.
 *
 * Retrieval grading은 prose matching을 하지 않는다. Gold와 trace 양쪽이
 * 같은 ID 문자열을 쓰고, 비교는 정확 일치로만 한다.
 *
 *   package:@berrypjh/react-ui
 *   component:@berrypjh/react-ui#Button
 *   prop:@berrypjh/react-ui#Button.loading
 *   export:@berrypjh/react-native-ui#useTheme
 *   token:color.primary.pr500
 *   doc:libs/react-ui/AGENTS.consumer.md
 *
 * Command 02의 generated catalog도 같은 convention을 재사용한다.
 */

export const EVIDENCE_KINDS = ['package', 'component', 'prop', 'export', 'token', 'doc'] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type ParsedEvidence = {
  kind: EvidenceKind;
  /** package/component/prop/export의 소유 패키지. token/doc은 null. */
  owner: string | null;
  /** `#` 뒤 심볼 경로 또는 token path / doc path. */
  subject: string;
};

const PATTERN = new RegExp(`^(${EVIDENCE_KINDS.join('|')}):(.+)$`);

export const packageEvidence = (pkg: string): string => `package:${pkg}`;
export const componentEvidence = (pkg: string, name: string): string => `component:${pkg}#${name}`;
export const propEvidence = (pkg: string, name: string, prop: string): string =>
  `prop:${pkg}#${name}.${prop}`;
export const exportEvidence = (pkg: string, name: string): string => `export:${pkg}#${name}`;
export const tokenEvidence = (path: string): string => `token:${path}`;
export const docEvidence = (repoRelPath: string): string => `doc:${repoRelPath}`;

/** 형식이 어긋나면 null. dataset schema가 이 결과로 validate한다. */
export const parseEvidenceId = (id: string): ParsedEvidence | null => {
  const m = PATTERN.exec(id);
  if (!m) return null;
  const kind = m[1] as EvidenceKind;
  const rest = m[2];
  if (kind === 'token' || kind === 'doc') return { kind, owner: null, subject: rest };
  if (kind === 'package') return { kind, owner: rest, subject: rest };
  const hash = rest.indexOf('#');
  if (hash <= 0 || hash === rest.length - 1) return null;
  return { kind, owner: rest.slice(0, hash), subject: rest.slice(hash + 1) };
};

export const isEvidenceId = (id: string): boolean => parseEvidenceId(id) !== null;
