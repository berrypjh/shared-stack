import type { Catalog, CommandRef } from '../../domain/model';

type Target = { executor?: string; options?: { command?: string; commands?: string[] } };

/**
 * `project.json` 의 targets. build 시점에 Vite 가 JSON 으로 묶는다 — 화면은 정의를 옮겨 적지 않고 파일에서 읽는다.
 * 키는 이 파일에서 본 상대 경로라 저장소 경로로 푼다.
 */
const PROJECT_TARGETS = import.meta.glob<Record<string, Target>>(
  ['../../../../../{apps,libs,plugins}/*/project.json'],
  { eager: true, import: 'targets' },
);
const HERE = new URL('apps/devhub/src/lib/catalog/', 'file:///repo/');
const targetsByPath = new Map(
  Object.entries(PROJECT_TARGETS).map(([key, targets]) => [
    new URL(key, HERE).pathname.slice('/repo/'.length),
    targets,
  ]),
);

/** 루트 `package.json` 의 scripts. 경로 import 는 Nx 모듈 경계 규칙이 막아 같은 glob 로 읽는다. */
const [SCRIPTS] = Object.values(
  import.meta.glob<Record<string, string>>('../../../../../package.json', {
    eager: true,
    import: 'scripts',
  }),
);

/** 명령이 실제로 하는 일: 정의 파일, 그 안의 자리, executor, 실행 줄들. */
export type CommandDefinition = {
  file: string;
  key: string;
  executor: string | null;
  lines: string[];
};

const manifestOf = (catalog: Catalog, project: string) =>
  [...catalog.applications, ...catalog.packages, ...catalog.tools].find(
    (entity) => entity.nxProject === project,
  )?.root;

/** 정의 파일에서 읽은 정의. 파일에 없으면 `null` — 추측하지 않는다(테스트가 모든 명령에 있음을 확인한다). */
export const definitionOf = (
  catalog: Catalog,
  { source }: CommandRef,
): CommandDefinition | null => {
  if (source.kind === 'package-script') {
    const body = SCRIPTS[source.script];
    return body === undefined
      ? null
      : { file: 'package.json', key: `scripts.${source.script}`, executor: null, lines: [body] };
  }
  const root = manifestOf(catalog, source.project);
  const file = `${root}/project.json`;
  const target = targetsByPath.get(file)?.[source.target];
  if (!root || !target) return null;
  const { command, commands } = target.options ?? {};
  return {
    file,
    key: `targets.${source.target}`,
    executor: target.executor ?? null,
    lines: commands ?? (command ? [command] : []),
  };
};
