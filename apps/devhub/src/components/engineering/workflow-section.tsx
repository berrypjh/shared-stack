import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import { commandLine } from '@/domain/commands';
import type { CiStep, CiWorkflow } from '@/domain/model';
import { commandAnchor, workflowAnchor } from '@/lib/catalog/routes';

import { FileRow } from '../source/file-row';
import { EntityLink, LINK } from '../ui/entity-link';

export const CI_ANCHOR = 'engineering-ci';

/** step 이 부르는 것. 카탈로그 명령이면 그 카드로 잇는다. */
const Invokes = ({ step }: { step: CiStep }) => {
  const { invokes } = step;
  switch (invokes.kind) {
    case 'command': {
      const command = catalog.commands.find((c) => c.id === invokes.command);
      return (
        <a href={`#${commandAnchor(invokes.command)}`} className={LINK}>
          {command ? commandLine(command) : invokes.command}
        </a>
      );
    }
    case 'target': {
      const count = catalog.commands.filter(
        (c) =>
          c.source.kind === 'nx-target' &&
          c.source.target === invokes.target &&
          !invokes.exclude?.includes(c.source.project),
      ).length;
      return (
        <span>
          바뀐 프로젝트의 <code className="font-mono">{invokes.target}</code> target — 카탈로그 명령{' '}
          {count}개 중 affected 인 것만
          {invokes.exclude?.length ? ` · 제외 ${invokes.exclude.join(', ')}` : ''}
        </span>
      );
    }
    case 'direct':
      return (
        <span>
          스크립트 없이 진입점을 직접 — <EntityLink id={invokes.tool} />
        </span>
      );
    case 'action':
      return (
        <span>
          저장소 밖 GitHub Action <code className="font-mono">{invokes.action}</code>
        </span>
      );
  }
};

const Workflow = ({ workflow }: { workflow: CiWorkflow }) => (
  <article
    id={workflowAnchor(workflow.id)}
    tabIndex={-1}
    aria-labelledby={`ci-${workflow.id}`}
    className="flex scroll-mt-lg flex-col gap-sm py-md"
  >
    <h3 id={`ci-${workflow.id}`} className="typo-body-small-strong">
      {workflow.name}
    </h3>
    <p className="typo-caption-small text-text-light">언제: {workflow.trigger}</p>
    <ul>
      <FileRow source={{ path: workflow.path }} label="정의" />
    </ul>
    {workflow.notes?.map((note) => (
      <p key={note.text} className="typo-caption-small text-text-warning">
        {note.text}
      </p>
    ))}
    <List className="flex flex-col gap-sm border-l border-stroke-light pl-md">
      {workflow.jobs.map((job) => (
        <ListItem key={job.id} className="flex flex-col gap-2xs typo-body-small">
          <span className="typo-body-small-strong">{job.name}</span>
          {job.needs.length > 0 && (
            <span className="typo-caption-small text-text-light">
              먼저: {job.needs.join(' · ')}
            </span>
          )}
          {job.steps.length ? (
            <List className="flex flex-col gap-xs">
              {job.steps.map((step) => (
                <ListItem key={step.name} className="flex flex-col">
                  <span className="typo-caption-small text-text-light">
                    {step.name}
                    {step.when && ` · 조건 ${step.when}`}
                  </span>
                  {step.run && <code className="devhub-code">{step.run}</code>}
                  <span className="typo-caption-small">
                    <Invokes step={step} />
                  </span>
                </ListItem>
              ))}
            </List>
          ) : (
            <span className="typo-caption-small text-text-light">
              저장소 명령을 부르지 않는다 — 뒤 job 이 쓸 affected 범위만 정한다
            </span>
          )}
        </ListItem>
      ))}
    </List>
  </article>
);

/** CI 가 어떤 명령을 부르는가. 결과(통과 · 실패)는 싣지 않는다. */
export const WorkflowSection = () => (
  <WorkspaceSection id={CI_ANCHOR} title={`CI workflow ${catalog.workflows.length}개`}>
    <p className="typo-caption-small text-text-light">
      workflow 에 적힌 실행 줄 그대로다. 설치 · 체크아웃 같은 준비 step 은 뺐다. 실행 결과는 GitHub
      에 있고 DevHub 는 알지 못한다.
    </p>
    <div className="flex flex-col divide-y divide-stroke-light">
      {catalog.workflows.map((workflow) => (
        <Workflow key={workflow.id} workflow={workflow} />
      ))}
    </div>
  </WorkspaceSection>
);
