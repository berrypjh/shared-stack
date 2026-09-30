import type { Journey } from '../../domain/model';

/** 심볼 몇 개만 import 한 번들과 전체 export 번들을 byte 로 비교하는 트리셰이킹 진단. */
export const treeshake: Journey = {
  id: 'treeshake',
  kind: 'measure',
  title: '트리셰이킹 진단',
  goal: '심볼 몇 개만 import 한 번들이 전체 export 번들보다 얼마나 작은지 byte 로 봄. CI 게이트가 아니고 번들 회귀는 size-limit 이 막음',
  steps: [
    {
      id: 'build',
      intent: '라이브러리를 빌드함',
      behavior: 'build:libs 가 패키지 exports 가 가리키는 dist 를 만듦',
      context: 'workspace',
      owner: 'treeshake-check',
      status: 'implemented',
      commands: ['pnpm build:libs'],
      source: [{ path: 'package.json', symbol: 'build:libs' }],
      tests: [],
      docs: [],
      next: ['run', 'collect'],
    },
    {
      id: 'run',
      intent: '진단을 돌림',
      behavior:
        'pnpm treeshake 가 target 과 심볼로 심볼별 single · multi · 전체 baseline scenario 를 만듦',
      context: 'workspace',
      owner: 'treeshake-check',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: [
        'pnpm treeshake react-ui',
        'pnpm treeshake react-ui Button',
        'pnpm treeshake react-ui Button TextField',
        'pnpm treeshake react-ui Button --json',
      ],
      source: [
        { path: 'package.json', symbol: 'tools/scripts/treeshake/check.ts' },
        { path: 'tools/scripts/treeshake/measure.ts', symbol: 'TARGETS' },
        { path: 'tools/scripts/treeshake/measure.ts', symbol: 'scenariosFor' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['bundle'],
    },
    {
      id: 'bundle',
      intent: '가짜 entry 를 번들함',
      behavior: '임시 폴더의 entry 를 esbuild 로 번들 · minify. React · React Native 는 external',
      context: 'workspace',
      owner: 'treeshake-check',
      status: 'partial',
      source: [
        { path: 'tools/scripts/treeshake/measure.ts', symbol: '--tree-shaking=true' },
        { path: 'tools/scripts/treeshake/measure.ts', symbol: 'NODE_PATH' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['measure'],
      gaps: [
        {
          kind: 'known-failure',
          note: 'react-ui 는 심볼과 상관없이 거의 같은 값. 컴포넌트 최상위 displayName 할당을 번들러가 순수하다고 증명하지 못함. 고치면 breaking 이라 별도 승인 필요',
          evidence: [
            {
              path: 'libs/react-ui/src/components/button/Button.tsx',
              symbol: 'Button.displayName',
            },
          ],
        },
      ],
    },
    {
      id: 'measure',
      intent: 'byte 를 잼',
      behavior: '번들 결과를 raw byte 와 gzip byte 로 잼. CSS 와 source map 은 빠짐',
      context: 'workspace',
      owner: 'treeshake-check',
      status: 'implemented',
      source: [
        { path: 'tools/scripts/treeshake/measure.ts', symbol: 'Buffer.byteLength' },
        { path: 'tools/scripts/treeshake/measure.ts', symbol: 'zlib.gzipSync' },
      ],
      tests: [],
      docs: [],
      next: ['report'],
    },
    {
      id: 'report',
      intent: '결과를 출력함',
      behavior: '표와 첫 심볼의 절감 비율을 보이고, single 이 baseline 의 95% 를 넘으면 경고',
      context: 'workspace',
      owner: 'treeshake-check',
      status: 'implemented',
      outputs: [
        { name: 'scenario', meaning: 'single: X · multi: X+Y · all-exports' },
        { name: 'raw', meaning: 'minify 후 byte' },
        { name: 'gzip', meaning: 'gzip 압축 후 byte' },
        { name: 'vs all', meaning: 'baseline 대비 raw 증감(− 는 작아짐). baseline 행은 —' },
      ],
      source: [
        { path: 'tools/scripts/treeshake/check.ts', symbol: '0.95' },
        { path: 'tools/scripts/treeshake/check.ts', symbol: "args.includes('--json')" },
      ],
      tests: [],
      docs: [],
      next: [],
    },
    {
      id: 'collect',
      intent: '평가 화면으로 가져옴',
      behavior:
        'quality:collect 가 react-ui 의 정해진 심볼로 --json 진단을 돌려 저장하고 DevHub 로 내보냄',
      context: 'workspace',
      owner: 'observability-collectors',
      status: 'implemented',
      commands: [
        'pnpm quality:collect --profile=core --run-id=<id>',
        'pnpm quality:export --run-id=<id>',
      ],
      source: [
        { path: 'tools/scripts/observability/registry.ts', symbol: 'bundle.treeshake.react-ui' },
      ],
      tests: ['tools-vitest'],
      docs: ['observability-usage'],
      next: [],
      evaluation: 'bundles',
    },
  ],
};
