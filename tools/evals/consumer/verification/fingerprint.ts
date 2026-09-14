/**
 * 결정적 failure fingerprint.
 *
 * stderr 전체 해시를 쓰지 않는다 — 임시 디렉터리 이름·시간·순서 같은 noise 때문에
 * 같은 실패가 매번 다른 지문을 갖게 되기 때문이다. 대신 안정적인 조각만 조합한다:
 *
 *   verification kind + 명령 정체성 + 정규화된 진단 코드 + 핵심 위치(basename:line)
 */

const DIAGNOSTIC_PATTERNS = [
  /\berror\s+(TS\d+)\b/g,
  /\b(AssertionError)\b/g,
  /\b(No test files found)\b/g,
  /\b(Cannot find module)\b/g,
];

const LOCATION = /([\w.-]+\.[cm]?[jt]sx?)[(:](\d+)[,:]/;

/** 절대 경로·임시 run id를 지운 명령 정체성. */
export const normalizeCommand = (command: string | null): string => {
  if (!command) return 'in-process';
  return command
    .replace(/(^|\s)\/[^\s]*\//g, '$1')
    .replace(/\b[0-9a-f]{8,}\b/gi, '<id>')
    .replace(/\s+/g, ' ')
    .trim();
};

const diagnosticCodes = (output: string): string[] => {
  const codes = new Set<string>();
  for (const pattern of DIAGNOSTIC_PATTERNS) {
    for (const match of output.matchAll(pattern)) codes.add(match[1]);
  }
  return [...codes].sort();
};

const primaryLocation = (output: string): string | null => {
  const match = LOCATION.exec(output);
  return match ? `${match[1]}:${match[2]}` : null;
};

export const failureFingerprint = (
  kind: string,
  command: string | null,
  output: string,
  exitCode: number | null,
): string => {
  const codes = diagnosticCodes(output);
  const parts = [
    kind,
    normalizeCommand(command),
    codes.length > 0 ? codes.join('+') : `exit:${exitCode ?? 'unknown'}`,
    primaryLocation(output) ?? 'no-location',
  ];
  return parts.join('|');
};
