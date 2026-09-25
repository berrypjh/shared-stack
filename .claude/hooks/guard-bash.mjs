/**
 * Bash 실행 전 체크하는 PreToolUse hook.
 *
 * 샌드박스에서 실행할 수 없는 명령과
 * secret 파일을 우회해서 읽을 수 있는 명령을 차단한다.
 *
 * 애매한 경우에는 막지 않는다.
 *
 * secret 판정은 berry-dev plugin 의 정책 하나를 import 한다. plugin hook 이 활성인지 확인하기 전까지
 * 이 hook 이 같은 보호를 유지한다(docs/claude-harness/architecture.md 전환 순서).
 */
import { findSecretReason } from '../../plugins/berry-dev/scripts/secret-policy.mjs';

// 포트 바인딩이 필요한 명령은 샌드박스에서 실행할 수 없다.
const PORT_BOUND = [
  {
    pattern:
      /\bnx\s+(?:serve|dev|start|preview|storybook)\b|\bnx\s+run\s+\S+:(?:serve|dev|start|preview|storybook)\b|\bpnpm\s+(?:run\s+)?(?:start|quality:lab|storybook|local-registry)\b|\bexpo\s+start\b/,
    what: 'dev 서버 (Vite, Storybook, Expo, local registry)',
  },
  {
    pattern:
      /\bnx\s+e2e\b|\bnx\s+run\s+\S+:e2e\b|\bnx\s+(?:run-many|affected)\s+[^\n]*-t\s*(?:\S*,)?e2e\b|\bplaywright\s+test\b/,
    what: 'Playwright e2e',
  },
];

const firstMatch = (rules, command) => rules.find((rule) => rule.pattern.test(command));

/**
 * 검색어 또는 출력 문자열에 포함된 명령까지 오탐하지 않도록
 * PORT_BOUND 검사 전에 quoted string을 제거한다.
 *
 * secret 검사는 원본 command를 사용한다.
 * eval 코드 내부에서 .env를 읽는 케이스까지 확인해야 하기 때문이다.
 */
const stripQuoted = (command) => command.replace(/'[^']*'|"[^"]*"/g, ' ');

// 차단 대상이면 사유를 반환하고, 아니면 null.
const findReason = (command) => {
  const blocked = firstMatch(PORT_BOUND, stripQuoted(command));
  if (blocked) {
    return `이 환경에서는 실행할 수 없습니다 — ${blocked.what}는 포트 바인딩이 차단됩니다. 사용자에게 직접 실행을 요청하고, 결과를 받기 전까지 검증했다고 보고하지 마세요.`;
  }

  return findSecretReason(command);
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const main = async () => {
  const payload = JSON.parse(await readStdin());
  const command = payload?.tool_input?.command;
  if (typeof command !== 'string') {
    return;
  }

  const reason = findReason(command);
  if (!reason) {
    return;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
};

// hook 자체의 오류 때문에 모든 Bash 실행이 막히는 상황은 피한다.
main().catch(() => process.exit(0));
