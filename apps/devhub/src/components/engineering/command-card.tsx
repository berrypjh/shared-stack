import { CopyButton } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import { commandLine } from '@/domain/commands';
import type { CommandRef } from '@/domain/model';
import { definitionOf } from '@/lib/catalog/command-definition';
import { gatesOf, relatedOf } from '@/lib/catalog/command-related';
import { CONSTRAINT } from '@/lib/catalog/labels';
import { commandAnchor } from '@/lib/catalog/routes';

import { FileRow } from '../source/file-row';
import { EntityLink } from '../ui/entity-link';

const Label = ({ children }: { children: string }) => (
  <dt className="typo-caption-small text-text-light">{children}</dt>
);

/**
 * 명령 하나: 정확한 실행 줄, 목적, 실행 조건(근거 파일과 함께), CI 가 부르는 자리, 관련 항목, 정의.
 * 조건은 늘 보인다 — 접지 않는다. 성공 · 실패는 없다: DevHub 는 명령을 실행하지 않는다.
 */
export const CommandCard = ({ command }: { command: CommandRef }) => {
  const line = commandLine(command);
  const definition = definitionOf(catalog, command);
  const gates = gatesOf(catalog, command);
  const related = relatedOf(catalog, command, definition);
  const heading = `${commandAnchor(command.id)}-heading`;
  return (
    <article
      id={commandAnchor(command.id)}
      tabIndex={-1}
      aria-labelledby={heading}
      className="flex scroll-mt-lg flex-col gap-sm py-md"
    >
      <h3 id={heading} className="flex items-center gap-2xs">
        <code className="font-mono typo-body-small-strong break-all">{line}</code>
        <CopyButton text={line} label={`명령 복사: ${line}`} />
      </h3>
      <p className="typo-body-small">{command.purpose}</p>
      <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
        <Label>실행 조건</Label>
        <dd>
          {command.constraints.length ? (
            <List className="flex flex-col gap-xs">
              {command.constraints.map(({ kind, evidence }) => (
                <ListItem key={kind} className="flex flex-col">
                  <span className="text-text-warning">{CONSTRAINT[kind]}</span>
                  <span className="devhub-code text-text-light">근거 {evidence.path}</span>
                </ListItem>
              ))}
            </List>
          ) : (
            <span className="text-text-light">알려진 조건 없음 — 어디서나 돈다는 뜻은 아니다</span>
          )}
        </dd>
        <Label>CI</Label>
        <dd>
          {gates.length ? (
            <List className="flex flex-col gap-2xs">
              {gates.map(({ workflow, job, step, affected }) => (
                <ListItem key={`${workflow.id}/${job.id}/${step.name}`}>
                  {workflow.name} › {job.name}
                  {affected && <span className="text-text-light"> · 바뀐 프로젝트일 때만</span>}
                  {step.when && <span className="text-text-light"> · 조건 {step.when}</span>}
                </ListItem>
              ))}
            </List>
          ) : (
            <span className="text-text-light">CI 가 부르지 않는다</span>
          )}
        </dd>
        <Label>관련 항목</Label>
        <dd className="flex flex-wrap gap-x-md">
          {related.length ? (
            related.map((id) => <EntityLink key={id} id={id} />)
          ) : (
            <span className="text-text-light">없음 — 정의가 특정 항목을 가리키지 않는다</span>
          )}
        </dd>
      </dl>
      {definition && (
        <details className="rounded-md border border-stroke-light">
          <summary className="cursor-pointer px-sm py-xs typo-caption-small">
            정의 · <span className="font-mono">{definition.file}</span> › {definition.key}
          </summary>
          <div className="flex flex-col gap-sm border-t border-stroke-light p-sm">
            {definition.executor && (
              <p className="typo-caption-small">
                executor <code className="font-mono">{definition.executor}</code>
              </p>
            )}
            {definition.lines.length > 0 && (
              <pre className="overflow-x-auto rounded-sm bg-background-default p-sm devhub-code">
                <code>{definition.lines.join('\n')}</code>
              </pre>
            )}
            <ul>
              <FileRow source={{ path: definition.file }} label="정의 파일" />
            </ul>
          </div>
        </details>
      )}
    </article>
  );
};
