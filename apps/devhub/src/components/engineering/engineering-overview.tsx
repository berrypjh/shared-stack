import { DocumentLayout, WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import { unlistedTargets } from '@/data/commands';
import { commandLine } from '@/domain/commands';
import { findSection } from '@/lib/catalog/entities';
import { testAnchor } from '@/lib/catalog/routes';

import { SectionSummary } from '../entity/section-summary';
import { EntityLink } from '../ui/entity-link';

import { CommandGroupSection, groupAnchor } from './command-group-section';
import { CI_ANCHOR, WorkflowSection } from './workflow-section';

const commandById = new Map(catalog.commands.map((command) => [command.id, command]));

const OUTLINE = [
  { id: 'section-list', title: '도구' },
  ...catalog.commandGroups.map((group) => ({ id: groupAnchor(group.id), title: group.title })),
  { id: CI_ANCHOR, title: 'CI workflow' },
  { id: 'engineering-tests', title: '테스트 묶음' },
];

const TestSuites = () => (
  <WorkspaceSection id="engineering-tests" title={`테스트 묶음 ${catalog.tests.length}개`}>
    <List className="flex flex-col divide-y divide-stroke-light">
      {catalog.tests.map((suite) => {
        const command = commandById.get(suite.command);
        return (
          <ListItem
            key={suite.id}
            id={testAnchor(suite.id)}
            tabIndex={-1}
            className="flex scroll-mt-lg flex-col gap-2xs py-sm"
          >
            <span className="typo-body-small-strong">{suite.id}</span>
            <span className="typo-caption-small text-text-light">
              {suite.runner} · <span className="font-mono">{suite.config.path}</span>
              {command && (
                <>
                  {' '}
                  · <code className="font-mono">{commandLine(command)}</code>
                </>
              )}
            </span>
            <span className="flex flex-wrap gap-x-md typo-caption-small">
              확인 대상:
              {suite.subjects.map((id) => (
                <EntityLink key={id} id={id} />
              ))}
            </span>
          </ListItem>
        );
      })}
    </List>
  </WorkspaceSection>
);

/**
 * 엔지니어링: 도구, 묶음별 명령(실행 줄 · 조건 · CI · 관련 항목 · 정의), CI workflow, 테스트 묶음.
 * DevHub 는 명령을 실행하지 않고 결과 · 측정값을 싣지 않는다 — 결과는 quality-lab 의 몫이다.
 */
export const EngineeringOverview = () => (
  <DocumentLayout outline={OUTLINE}>
    <p className="typo-body-small">
      루트 script {catalog.commands.filter((c) => c.source.kind === 'package-script').length}개와
      project.json 의 Nx target{' '}
      {catalog.commands.filter((c) => c.source.kind === 'nx-target').length}개. 정의는 build 시점에
      그 파일에서 읽었다. 여기서는 아무 명령도 실행하지 않는다.
    </p>
    <p className="typo-caption-small text-text-light">
      넣지 않은 target:{' '}
      {[...new Set(unlistedTargets.map((t) => t.target))].map((target) => {
        const list = unlistedTargets.filter((t) => t.target === target);
        return (
          <span key={target}>
            <code className="font-mono">{target}</code>({list.length}개 프로젝트) — {list[0].reason}
          </span>
        );
      })}
    </p>
    <SectionSummary section={findSection('engineering')} />
    {catalog.commandGroups.map((group) => (
      <CommandGroupSection key={group.id} group={group} />
    ))}
    <WorkflowSection />
    <TestSuites />
  </DocumentLayout>
);
