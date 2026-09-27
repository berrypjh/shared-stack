import type { Application } from '../domain/model';

export const applications: Application[] = [
  {
    id: 'demo-web',
    role: 'demo',
    packageName: '@berrypjh/demo-web',
    root: 'apps/demo-web',
    packageManifest: { path: 'apps/demo-web/package.json' },
    visibility: 'internal',
    nxProject: '@berrypjh/demo-web',
    nxManifest: { path: 'apps/demo-web/project.json' },
    platform: 'web',
    purpose:
      'react-ui 를 실제 앱에 통합했을 때 살아 있는 것 — 테마 전환 · CSS 캐스케이드 · Tailwind preset · 패키지 경계 — 을 확인한다',
    docs: ['demo-web-agents', 'demo-web-readme'],
    source: [{ path: 'apps/demo-web/src/main.tsx' }],
  },
  {
    id: 'demo-mobile',
    role: 'demo',
    packageName: '@berrypjh/demo-mobile',
    root: 'apps/demo-mobile',
    packageManifest: { path: 'apps/demo-mobile/package.json' },
    visibility: 'internal',
    nxProject: '@berrypjh/demo-mobile',
    nxManifest: { path: 'apps/demo-mobile/project.json' },
    platform: 'react-native',
    purpose: 'react-native-ui 를 Expo 앱에 통합해 컴포넌트 상태를 눈으로 확인하는 유일한 자리',
    docs: ['demo-mobile-agents', 'demo-mobile-readme'],
    source: [{ path: 'apps/demo-mobile/index.js' }, { path: 'apps/demo-mobile/src/app/App.tsx' }],
    gaps: [
      {
        kind: 'no-test',
        note: '테스트 파일도 test target 도 없다. 통합 결과는 기기에서 눈으로 확인한다',
        evidence: [
          { path: '.claude/rules/demo-mobile.md' },
          { path: 'apps/demo-mobile/project.json' },
        ],
      },
    ],
  },
  {
    id: 'devhub-e2e',
    role: 'e2e',
    root: 'apps/devhub-e2e',
    nxProject: '@berrypjh/devhub-e2e',
    nxManifest: { path: 'apps/devhub-e2e/project.json' },
    platform: 'node',
    purpose:
      'devhub 를 실제 브라우저에서 확인한다 — 셸 키보드 · 반응형 · 검색 · 딥링크 · dialog 포커스 · 평가 화면. 앱 소스를 import 하지 않고 평가 fixture 는 공개 계약으로만 만든다',
    docs: ['devhub-e2e-agents'],
    source: [
      { path: 'apps/devhub-e2e/src/support/keyboard.ts', symbol: 'tabTo' },
      { path: 'apps/devhub-e2e/src/support/observability.ts', symbol: 'serveObservability' },
    ],
  },
  {
    id: 'devhub',
    role: 'explorer',
    packageName: '@berrypjh/devhub',
    root: 'apps/devhub',
    packageManifest: { path: 'apps/devhub/package.json' },
    visibility: 'internal',
    nxProject: '@berrypjh/devhub',
    nxManifest: { path: 'apps/devhub/project.json' },
    platform: 'web',
    purpose:
      '저장소의 구조와 근거를 탐색하고, 수집 · export 된 품질 결과를 계약으로 검증한 뒤에만 평가 화면에서 보여 준다',
    docs: [
      'devhub-agents',
      'observability-usage',
      'observability-architecture',
      'observability-metrics',
      'observability-verification',
      'observability-limitations',
    ],
    source: [{ path: 'apps/devhub/src/main.tsx' }],
  },
];
