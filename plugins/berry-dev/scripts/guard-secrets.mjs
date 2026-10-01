/**
 * PreToolUse(Bash) hook adapter — stdin JSON 을 읽어 `secret-policy.mjs` 로 판정한다.
 *
 * 막을 때만 deny JSON 을 stdout 에 쓴다. 통과는 exit 0 · 빈 stdout 이고 allow 를 내지 않는다
 * (Claude Code 의 다른 권한 판정을 건너뛰지 않게). 입력이 깨졌거나 hook 자체가 실패하면 통과시킨다 —
 * 모든 Bash 가 막히는 쪽이 더 나쁘다. 그래서 이 hook 은 보조 장치이지 마지막 방어선이 아니다.
 */
import { findSecretReason } from './secret-policy.mjs';

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const main = async () => {
  const payload = JSON.parse(await readStdin());
  if (payload?.tool_name !== 'Bash') {
    return;
  }
  const command = payload.tool_input?.command;
  if (typeof command !== 'string') {
    return;
  }

  const reason = findSecretReason(command);
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

main().catch(() => process.exit(0));
