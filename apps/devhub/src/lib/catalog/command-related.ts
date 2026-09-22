import type {
  Catalog,
  CiJob,
  CiStep,
  CiWorkflow,
  CommandGroupId,
  CommandRef,
} from '../../domain/model';

import type { CommandDefinition } from './command-definition';

type Entity =
  | Catalog['applications'][number]
  | Catalog['packages'][number]
  | Catalog['tools'][number];

const entitiesOf = (catalog: Catalog): Entity[] => [
  ...catalog.applications,
  ...catalog.packages,
  ...catalog.tools,
];

/**
 * 명령과 관련된 앱 · 패키지 · 도구. 근거 셋에서만 유도한다:
 * target 을 가진 프로젝트, 이 명령을 드는 항목, 정의가 이름(`@berrypjh/x`)이나 경로(`tools/…`)로 가리키는 항목.
 */
export const relatedOf = (
  catalog: Catalog,
  command: CommandRef,
  definition: CommandDefinition | null,
): string[] => {
  const text = definition?.lines.join('\n') ?? '';
  const named = (entity: Entity) =>
    (entity.nxProject !== undefined &&
      new RegExp(`${entity.nxProject.replace(/[/@-]/g, '\\$&')}(?![\\w-])`).test(text)) ||
    new RegExp(`(^|[\\s'"])${entity.root.replace(/[/.-]/g, '\\$&')}(?=[/\\s'"]|$)`, 'm').test(text);
  const owner = (entity: Entity) =>
    command.source.kind === 'nx-target' && entity.nxProject === command.source.project;
  return entitiesOf(catalog)
    .filter((entity) => owner(entity) || entity.commands.includes(command.id) || named(entity))
    .map((entity) => entity.id);
};

/** 명령 하나를 CI 가 부르는 자리. `affected` 면 바뀐 프로젝트에서만 돈다. */
export type CiGate = { workflow: CiWorkflow; job: CiJob; step: CiStep; affected: boolean };

/** 이 명령을 부르는 CI step. target step 은 같은 target 의 Nx 명령 전부에 걸리되 제외된 프로젝트는 뺀다. */
export const gatesOf = (catalog: Catalog, command: CommandRef): CiGate[] =>
  catalog.workflows.flatMap((workflow) =>
    workflow.jobs.flatMap((job) =>
      job.steps.flatMap((step): CiGate[] => {
        const { invokes } = step;
        if (invokes.kind === 'command' && invokes.command === command.id) {
          return [{ workflow, job, step, affected: false }];
        }
        if (
          invokes.kind === 'target' &&
          command.source.kind === 'nx-target' &&
          command.source.target === invokes.target &&
          !invokes.exclude?.includes(command.source.project)
        ) {
          return [{ workflow, job, step, affected: true }];
        }
        return [];
      }),
    ),
  );

/** 묶음의 명령, 카탈로그 순서 그대로. */
export const commandsIn = (catalog: Catalog, group: CommandGroupId) =>
  catalog.commands.filter((command) => command.group === group);
