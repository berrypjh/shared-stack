import type { CiWorkflow } from '../domain/model';

/**
 * GitHub Actions workflow 가 부르는 명령. `run` 은 workflow 에 적힌 그대로다(테스트가 대조한다).
 * 설치 · 체크아웃 같은 준비 step 은 싣지 않는다. 결과(성공 · 실패)는 싣지 않는다.
 */
export const workflows: CiWorkflow[] = [
  {
    id: 'pr-check',
    path: '.github/workflows/pr-check.yml',
    name: 'PR Quality Check',
    trigger: 'main 으로 가는 pull request 가 열리거나 커밋이 더해질 때',
    jobs: [
      { id: 'derive-shas', name: 'Derive NX base/head SHAs', needs: [], steps: [] },
      {
        id: 'format',
        name: 'Format Check (Prettier)',
        needs: ['derive-shas'],
        steps: [
          {
            name: 'Format Check (Prettier)',
            run: 'pnpm nx format:check --base=$NX_BASE --head=$NX_HEAD',
            invokes: { kind: 'command', command: 'script:format:check' },
          },
        ],
      },
      {
        id: 'lint',
        name: 'Lint (affected)',
        needs: ['derive-shas'],
        steps: [
          {
            name: 'Lint (affected)',
            run: 'pnpm nx affected -t lint --parallel=3 --base=$NX_BASE --head=$NX_HEAD',
            invokes: { kind: 'target', target: 'lint' },
          },
        ],
      },
      {
        id: 'typecheck',
        name: 'Typecheck (affected)',
        needs: ['derive-shas'],
        steps: [
          {
            name: 'Typecheck (affected)',
            run: 'pnpm nx affected -t typecheck --parallel=3 --base=$NX_BASE --head=$NX_HEAD',
            invokes: { kind: 'target', target: 'typecheck' },
          },
        ],
      },
      {
        id: 'test',
        name: 'Unit Tests (affected)',
        needs: ['derive-shas', 'format', 'lint', 'typecheck'],
        steps: [
          {
            name: 'Run Unit Tests',
            run: 'pnpm nx affected -t test --configuration=ci --parallel=3 --base=$NX_BASE --head=$NX_HEAD',
            invokes: { kind: 'target', target: 'test' },
          },
        ],
      },
      {
        id: 'size',
        name: 'Bundle Size (size-limit)',
        needs: ['format', 'lint'],
        steps: [
          {
            name: 'Build libs',
            run: 'pnpm run build:libs',
            invokes: { kind: 'command', command: 'script:build:libs' },
          },
          {
            name: 'size-limit',
            run: 'pnpm run size',
            invokes: { kind: 'command', command: 'script:size' },
          },
        ],
      },
      {
        id: 'a11y',
        name: 'Accessibility (Storybook + axe)',
        needs: ['format', 'lint'],
        steps: [
          {
            name: 'Build Storybook',
            run: 'pnpm run build-storybook',
            invokes: { kind: 'command', command: 'script:build-storybook' },
          },
          {
            name: 'Run a11y tests (axe + WCAG 2 AA)',
            run: 'pnpm run storybook:a11y',
            invokes: { kind: 'command', command: 'script:storybook:a11y' },
          },
        ],
      },
      {
        id: 'consumer-eval',
        name: 'Consumer Eval (deterministic)',
        needs: ['format', 'lint'],
        steps: [
          {
            name: 'Build libs (declarations + generated catalog)',
            run: 'pnpm run build:libs',
            invokes: { kind: 'command', command: 'script:build:libs' },
          },
          {
            name: 'Harness typecheck and tests',
            run: 'pnpm run tools:check',
            invokes: { kind: 'command', command: 'script:tools:check' },
          },
          {
            name: 'Deterministic eval smoke',
            run: 'pnpm run eval:consumer:smoke',
            invokes: { kind: 'command', command: 'script:eval:consumer:smoke' },
          },
        ],
      },
      {
        id: 'build',
        name: 'Build (affected)',
        needs: ['derive-shas', 'format', 'lint', 'typecheck', 'test'],
        steps: [
          {
            name: 'Build Affected Projects',
            run: 'pnpm nx affected -t build --parallel=3 --exclude=@berrypjh/demo-mobile --base=$NX_BASE --head=$NX_HEAD',
            invokes: { kind: 'target', target: 'build', exclude: ['@berrypjh/demo-mobile'] },
          },
        ],
      },
    ],
    notes: [
      {
        text: '--configuration=ci 는 ci 설정이 있는 target(react-native-ui test 의 jest --ci)에만 적용된다. 설정이 없는 target 은 Nx 가 기본 설정으로 돌린다',
        evidence: { path: 'libs/react-native-ui/project.json', symbol: '"ci"' },
      },
    ],
  },
  {
    id: 'chromatic',
    path: '.github/workflows/chromatic.yml',
    name: 'Chromatic',
    trigger: 'libs/react-ui/** 가 바뀐 main 대상 pull request 와 main push',
    jobs: [
      {
        id: 'chromatic',
        name: 'Run Chromatic',
        needs: [],
        steps: [
          {
            name: 'Build Libraries',
            run: 'pnpm run build:libs:web',
            invokes: { kind: 'command', command: 'script:build:libs:web' },
          },
          {
            name: 'Build Storybook',
            run: 'pnpm run build-storybook',
            invokes: { kind: 'command', command: 'script:build-storybook' },
          },
          {
            name: 'Run Chromatic',
            invokes: { kind: 'action', action: 'chromaui/action@latest' },
          },
        ],
      },
    ],
    notes: [
      {
        text: 'Chromatic 은 저장소 밖 서비스다. project token secret 이 있어야 돌고, 그 결과는 DevHub 가 알지 못한다',
        evidence: { path: '.github/workflows/chromatic.yml', symbol: 'CHROMATIC_PROJECT_TOKEN' },
      },
    ],
  },
  {
    id: 'consumer-eval-heldout',
    path: '.github/workflows/consumer-eval-heldout.yml',
    name: 'Consumer Eval (held-out)',
    trigger: '수동 실행(workflow_dispatch)만 — 정기 실행이 없다',
    jobs: [
      {
        id: 'held-out',
        name: 'Held-out evaluation',
        needs: [],
        steps: [
          {
            name: 'Build libs (declarations + generated catalog)',
            run: 'pnpm run build:libs',
            invokes: { kind: 'command', command: 'script:build:libs' },
          },
          {
            name: 'Run held-out evaluation',
            run: 'pnpm exec tsx tools/evals/consumer/runner/run.ts \\',
            invokes: { kind: 'direct', tool: 'consumer-eval' },
          },
        ],
      },
    ],
    notes: [
      {
        text: 'live executor 가 없다. replay trace 를 주지 않으면 harness 가 실행을 거부한다 — 가짜 결과를 만들지 않는다',
        evidence: {
          path: '.github/workflows/consumer-eval-heldout.yml',
          symbol: 'The harness will refuse to run rather than fabricate metrics.',
        },
      },
    ],
  },
  {
    id: 'release',
    path: '.github/workflows/release.yml',
    name: 'Release Libraries',
    trigger: 'main(정식) · pre-release(베타) 브랜치 push',
    jobs: [
      {
        id: 'release',
        name: 'Release Libraries',
        needs: [],
        steps: [
          {
            name: 'NX Release (Beta)',
            run: 'pnpm release:npm:beta',
            when: "github.ref == 'refs/heads/pre-release'",
            invokes: { kind: 'command', command: 'script:release:npm:beta' },
          },
          {
            name: 'NX Release (Stable)',
            run: 'pnpm release:npm',
            when: "github.ref == 'refs/heads/main'",
            invokes: { kind: 'command', command: 'script:release:npm' },
          },
        ],
      },
    ],
  },
];
