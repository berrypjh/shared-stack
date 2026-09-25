import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Bash guard 계약 (docs/claude-harness/contracts.md §7).
 *
 * hook 을 실제 프로세스로 실행하고 명령 문자열은 stdin JSON 으로만 넘긴다 — 어떤 명령도 실행하지 않는다.
 * local hook(`.claude/hooks/guard-bash.mjs`)의 판정은 통합 전 동작을 그대로 고정한 것이다.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LOCAL_HOOK = path.join(REPO_ROOT, '.claude/hooks/guard-bash.mjs');
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins/berry-dev');
const ADAPTER = path.join(PLUGIN_ROOT, 'scripts/guard-secrets.mjs');

type Result = { status: number | null; stdout: string };
type Decision = 'allow' | 'port' | 'secret';

const run = (hook: string, input: string): Result => {
  const result = spawnSync(process.execPath, [hook], { input, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout };
};

const bash = (command: unknown) =>
  JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });

/** deny JSON 이면 사유, 아니면 null. deny 가 아닌 출력은 실패로 본다. */
const reasonOf = ({ status, stdout }: Result): string | null => {
  expect(status).toBe(0);
  if (stdout === '') return null;
  const output = JSON.parse(stdout) as Record<string, unknown>;
  expect(Object.keys(output)).toEqual(['hookSpecificOutput']);
  const specific = output.hookSpecificOutput as Record<string, string>;
  expect(Object.keys(specific).sort()).toEqual([
    'hookEventName',
    'permissionDecision',
    'permissionDecisionReason',
  ]);
  expect(specific.hookEventName).toBe('PreToolUse');
  expect(specific.permissionDecision).toBe('deny');
  return specific.permissionDecisionReason;
};

const decisionOf = (reason: string | null): Decision => {
  if (reason === null) return 'allow';
  if (reason.includes('포트 바인딩')) return 'port';
  if (reason.startsWith('secret 파일에 접근하고 있습니다')) return 'secret';
  throw new Error(`unknown reason: ${reason}`);
};

const decide = (hook: string, command: string) => decisionOf(reasonOf(run(hook, bash(command))));

/** secret 경로와 우회 수단이 함께 있는 명령. */
const SECRET_BLOCKED = [
  `node -e "require('fs').readFileSync('.env', 'utf8')"`,
  'FILE=.env rg . "$FILE"',
  `python3 -c "open('.env',encoding='utf8').read()"`,
  `bun -e "Bun.file('.env')"`,
  `ruby -e "File.read('.env')"`,
  'grep KEY .env.local',
  "awk '{print}' .env.production",
  'base64 .env',
  'xxd .env',
  'od -c .env.development.local',
  'strings .env',
  'dd if=.env of=copy',
  'cp .env /tmp/copy',
  'mv .env backup',
  'tee copy < .env',
  'cat .env > out.txt',
  'cat .env >> out.txt',
  'rg KEY config/.env',
  'grep KEY "my dir/.env"',
  "printf 'x' > probe.key",
  'strings certs/server.key',
  'base64 AuthKey.p8',
  'xxd signing.p12',
  'cp release.jks /tmp/',
  'grep x embedded.mobileprovision',
  'tool --file=.env | tee x',
  'grep x a,.env',
  'grep x `echo .env`',
];

/** secret 을 건드리지 않거나, 우회 수단이 없거나(Read deny 영역), 템플릿인 명령. */
const SECRET_ALLOWED = [
  'cat .env',
  'ls -la .env',
  'cat .env 2>/dev/null',
  'cat .env 2>&1',
  'cat .env.example > copy.txt',
  'grep KEY .env.sample',
  'cp .env.template .env.example',
  'grep x server.pem',
  'echo hi > /tmp/out',
  'node -e "console.log(1)"',
  'grep -rn "onClick" apps --include="*.tsx"',
  'base64 public/logo.png',
  'git status --porcelain',
];

/** local 전용. 판정은 통합 전과 같아야 한다. */
const PORT_BLOCKED = [
  'pnpm nx serve @berrypjh/devhub',
  'nx run @berrypjh/devhub:serve',
  'pnpm start',
  'pnpm run storybook',
  'pnpm quality:lab',
  'pnpm local-registry',
  'npx expo start',
  'nx e2e @berrypjh/devhub-e2e',
  'nx run @berrypjh/devhub-e2e:e2e',
  'nx run-many -t lint,e2e',
  'npx playwright test',
];

const PORT_ALLOWED = [
  'echo "pnpm nx serve x"',
  'grep -rn "nx e2e" docs',
  'git log --grep="npx playwright test"',
  'pnpm nx build @berrypjh/devhub',
  'pnpm nx test @berrypjh/devhub',
  // 알려진 공백: root script `devhub` 는 `nx serve` 별칭이지만 PORT_BOUND 에 없다. 범위 변경은 별도 결정이다.
  'pnpm devhub',
];

describe('local hook — 통합 전 동작 고정', () => {
  it.each(SECRET_BLOCKED)('secret 차단: %s', (command) => {
    expect(decide(LOCAL_HOOK, command)).toBe('secret');
  });

  it.each(SECRET_ALLOWED)('통과: %s', (command) => {
    expect(decide(LOCAL_HOOK, command)).toBe('allow');
  });

  it.each(PORT_BLOCKED)('포트 차단: %s', (command) => {
    expect(decide(LOCAL_HOOK, command)).toBe('port');
  });

  it.each(PORT_ALLOWED)('포트 통과: %s', (command) => {
    expect(decide(LOCAL_HOOK, command)).toBe('allow');
  });

  it('포트와 secret 이 함께 있으면 포트 사유가 먼저다', () => {
    expect(decide(LOCAL_HOOK, 'pnpm nx serve x > .env')).toBe('port');
  });

  it.each([
    ['JSON 아님', 'not json'],
    ['빈 객체', '{}'],
    ['command 없음', '{"tool_input":{}}'],
    ['command 가 숫자', bash(1)],
  ])('%s 는 exit 0 · 빈 stdout (fail-open)', (_label, input) => {
    expect(run(LOCAL_HOOK, input)).toEqual({ status: 0, stdout: '' });
  });

  it('secret 사유는 경로와 수단만 말하고 명령 전체를 싣지 않는다', () => {
    const reason = reasonOf(run(LOCAL_HOOK, bash(SECRET_BLOCKED[0]))) ?? '';
    expect(reason).toContain('경로: .env');
    expect(reason).toContain('수단: 인터프리터 eval');
    expect(reason).not.toContain('readFileSync');
    expect(reason).not.toContain('utf8');
  });
});

describe('plugin adapter — 같은 secret 정책', () => {
  it.each(SECRET_BLOCKED)('secret 차단: %s', (command) => {
    expect(decide(ADAPTER, command)).toBe('secret');
  });

  it.each([...SECRET_ALLOWED, ...PORT_BLOCKED, ...PORT_ALLOWED])('통과: %s', (command) => {
    expect(decide(ADAPTER, command)).toBe('allow');
  });

  it.each(SECRET_BLOCKED)('local hook 과 같은 사유: %s', (command) => {
    expect(reasonOf(run(ADAPTER, bash(command)))).toBe(reasonOf(run(LOCAL_HOOK, bash(command))));
  });

  it.each([
    ['JSON 아님', 'not json'],
    ['빈 객체', '{}'],
    ['tool_name 없음', JSON.stringify({ tool_input: { command: 'grep KEY .env' } })],
    [
      'Bash 가 아닌 tool',
      JSON.stringify({ tool_name: 'Read', tool_input: { command: 'grep KEY .env' } }),
    ],
    ['command 없음', JSON.stringify({ tool_name: 'Bash', tool_input: {} })],
    ['command 가 숫자', bash(1)],
    ['command 가 배열', bash(['grep', 'KEY', '.env'])],
  ])('%s 는 exit 0 · 빈 stdout (fail-open, allow 를 내지 않는다)', (_label, input) => {
    expect(run(ADAPTER, input)).toEqual({ status: 0, stdout: '' });
  });

  it('차단 stdout 은 deny JSON 한 개뿐이다', () => {
    const { stdout } = run(ADAPTER, bash('base64 .env'));
    expect(stdout.trim()).toBe(stdout);
    expect(reasonOf({ status: 0, stdout })).toContain('경로: .env, 수단: 원시 읽기 명령');
  });
});

describe('두 hook 의 합성', () => {
  /** Claude Code 는 매칭된 hook 을 병렬로 돌리고 deny 가 하나라도 있으면 막는다. */
  const combined = (command: string) => {
    const reasons = [LOCAL_HOOK, ADAPTER].map((hook) => reasonOf(run(hook, bash(command))));
    return reasons.some((reason) => reason !== null) ? 'deny' : 'allow';
  };

  it.each(SECRET_BLOCKED)('secret 은 둘 다 막는다: %s', (command) => {
    expect(combined(command)).toBe('deny');
    expect(decide(LOCAL_HOOK, command)).toBe(decide(ADAPTER, command));
  });

  it.each(PORT_BLOCKED)('포트는 local 만 막는다: %s', (command) => {
    expect([decide(LOCAL_HOOK, command), decide(ADAPTER, command)]).toEqual(['port', 'allow']);
  });

  it('포트와 secret 이 함께면 local 은 포트, adapter 는 secret 사유로 둘 다 막는다', () => {
    const command = 'pnpm nx serve x > .env';
    expect([decide(LOCAL_HOOK, command), decide(ADAPTER, command)]).toEqual(['port', 'secret']);
  });

  it('두 hook 은 상태 파일을 쓰지 않고 서로를 import 하지 않는다', () => {
    const local = readFileSync(LOCAL_HOOK, 'utf8');
    const adapter = readFileSync(ADAPTER, 'utf8');
    expect(adapter).not.toContain('guard-bash');
    expect(local).not.toContain('guard-secrets');
    for (const text of [local, adapter]) {
      expect(text).not.toMatch(/writeFile|appendFile|mkdir|node:fs/);
    }
  });
});

describe('secret 정책은 한 벌', () => {
  it('BYPASS · SECRET_BASENAME · SAFE_BASENAME · tokenize 정의가 secret-policy.mjs 에만 있다', () => {
    const scripts = [
      ...readdirSync(path.join(REPO_ROOT, '.claude/hooks')).map((name) => `.claude/hooks/${name}`),
      ...readdirSync(path.join(PLUGIN_ROOT, 'scripts')).map(
        (name) => `plugins/berry-dev/scripts/${name}`,
      ),
    ].filter((file) => file.endsWith('.mjs'));
    const defining = scripts.filter((file) =>
      /\b(?:BYPASS|SECRET_BASENAME|SAFE_BASENAME|tokenize)\s*=/.test(
        readFileSync(path.join(REPO_ROOT, file), 'utf8'),
      ),
    );
    expect(defining).toEqual(['plugins/berry-dev/scripts/secret-policy.mjs']);
  });
});

describe('등록과 경로', () => {
  it('hooks.json 은 PreToolUse · Bash 에 Node adapter 를 exec form 으로 등록한다', () => {
    const config = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, 'hooks/hooks.json'), 'utf8'));
    expect(config.hooks).toEqual({
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: 'node',
              // eslint-disable-next-line no-template-curly-in-string -- Claude Code 가 치환하는 변수 이름을 그대로 비교한다
              args: ['${CLAUDE_PLUGIN_ROOT}/scripts/guard-secrets.mjs'],
              timeout: 10,
            },
          ],
        },
      ],
    });
  });

  it('project 설정은 기존 local hook 하나만 등록한다 — plugin 은 아직 켜지 않았다', () => {
    const settings = JSON.parse(
      readFileSync(path.join(REPO_ROOT, '.claude/settings.json'), 'utf8'),
    );
    expect(settings.hooks.PreToolUse).toEqual([
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-bash.mjs"',
            timeout: 10,
          },
        ],
      },
    ]);
    expect(Object.keys(settings.enabledPlugins)).not.toContain('berry-dev@berrypjh');
  });

  it('공백이 있는 경로에 복사해도 두 hook 이 동작한다', () => {
    const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), 'berry guard ')));
    try {
      const project = path.join(tmp, 'my project');
      cpSync(LOCAL_HOOK, path.join(project, '.claude/hooks/guard-bash.mjs'));
      cpSync(PLUGIN_ROOT, path.join(project, 'plugins/berry-dev'), { recursive: true });
      const plugin = path.join(tmp, 'plugin cache', 'berry-dev');
      cpSync(PLUGIN_ROOT, plugin, { recursive: true });

      const command = 'grep KEY "my dir/.env"';
      expect(decide(path.join(project, '.claude/hooks/guard-bash.mjs'), command)).toBe('secret');
      expect(decide(path.join(plugin, 'scripts/guard-secrets.mjs'), command)).toBe('secret');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
