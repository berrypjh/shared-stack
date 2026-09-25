/**
 * Bash 명령 문자열에서 secret 파일을 우회해서 읽는 조합을 찾는 순수 정책. I/O 가 없다.
 *
 * secret 경로와 우회 수단(`BYPASS`)이 **함께** 있을 때만 사유를 돌려준다. 애매하면 막지 않는다.
 * 셸 parser 도 OS sandbox 도 아니다 — 명령 문자열을 단순 토큰으로 볼 뿐이라 우회할 수 있다.
 * 계약은 docs/claude-harness/contracts.md §7.
 */

/** Read deny 를 우회해서 파일 내용을 읽을 수 있는 수단. */
export const BYPASS = [
  { pattern: /(?<![0-9])>{1,2}(?!&)/, what: '셸 리다이렉트' },
  { pattern: /\b(?:node|bun|deno)\s+(?:-e|--eval|eval)\b/, what: '인터프리터 eval' },
  { pattern: /\b(?:python3?|ruby|perl)\s+-[ce]\b/, what: '인터프리터 eval' },
  { pattern: /\b(?:xxd|base64|od|strings|dd|tee|cp|mv|grep|rg|awk)\b/, what: '원시 읽기 명령' },
];

export const SECRET_BASENAME = /^\.env(\.|$)|\.(key|p8|p12|jks|mobileprovision)$/;
export const SAFE_BASENAME = /\.(example|sample|template)$/;

/** 명령어를 단순 토큰화해서 secret 경로 후보를 찾는다. 따옴표, 쉼표, =도 구분자로 본다. */
export const tokenize = (command) => command.split(/[\s;|&<>()'"`,=]+/).filter(Boolean);

export const findSecretPath = (command) =>
  tokenize(command).find((token) => {
    const basename = token.split('/').pop() ?? '';
    return SECRET_BASENAME.test(basename) && !SAFE_BASENAME.test(basename);
  });

/**
 * 차단 대상이면 사유, 아니면 null. 원본 명령을 본다 — eval 코드 안의 경로까지 확인해야 해서
 * 따옴표 안 문자열을 지우지 않는다. 사유에는 경로와 수단만 넣고 명령 전체를 싣지 않는다.
 */
export const findSecretReason = (command) => {
  const secretPath = findSecretPath(command);
  if (!secretPath) {
    return null;
  }

  const bypass = BYPASS.find((rule) => rule.pattern.test(command));
  if (!bypass) {
    return null;
  }

  return `secret 파일에 접근하고 있습니다 — 경로: ${secretPath}, 수단: ${bypass.what}. 이 방식은 Read deny 경로 검사를 우회할 수 있어 차단합니다. 값이 필요하면 .env.example의 키 이름만 확인하고, 실제 값은 사용자에게 물어보세요.`;
};
