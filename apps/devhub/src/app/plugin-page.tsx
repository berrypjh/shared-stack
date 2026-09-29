import {
  DocumentColumn,
  Inspector,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
} from '@berrypjh/devhub-ui';

import { useParams } from 'react-router-dom';

import { Code } from '@/components/entity/entity-detail';
import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { CopyCommand } from '@/components/evaluation/copy-command';
import { PluginInspector } from '@/components/plugin/plugin-inspector';
import { PluginContents, PluginSurfaces } from '@/components/plugin/plugin-surfaces';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { catalog } from '@/data';
import type { Plugin } from '@/domain/model';
import { findEntity, findSection } from '@/lib/catalog/entities';

/** 설치 명령과 버전 · 분류. 명령은 `berry-commit` README 와 같은 형식이다. */
const Install = ({ plugin }: { plugin: Plugin }) => (
  <div className="flex flex-col gap-sm">
    <CopyCommand command={`claude plugin install ${plugin.id}@${plugin.marketplace}`} />
    <p className="flex flex-wrap items-center gap-xs typo-body-small text-text-light">
      <Code>{`v${plugin.version}`}</Code>
      <span aria-hidden="true">·</span>
      marketplace <Code>{plugin.marketplace}</Code>
      <span aria-hidden="true">·</span>
      분류 <Code>{plugin.category}</Code>
    </p>
  </div>
);

/**
 * `/plugins/<id>` — 문서 · 기록 화면과 같은 칸과 글자로, 머리(목적 · 설치 · 제공하는 것) 뒤에
 * 소비자가 쓰는 표면(skill · MCP · hook · 규칙)을 절로 잇는다. 오른쪽은 근거. 목적 · 근거는 같은 id 의 도구에서 읽는다.
 */
export const PluginPage = () => {
  const { id = '' } = useParams();
  const section = findSection('plugins');
  const entity = findEntity('plugins', id);
  const tool = catalog.tools.find((candidate) => candidate.id === id);
  useDocumentTitle(entity ? entity.label : `${section.title}에 없는 항목`);
  if (entity?.section !== 'plugins' || !tool) {
    return <EntityNotFound section={placeOf(section)} id={id} />;
  }
  const plugin = entity.record;
  return (
    <>
      <WorkspaceFrame>
        <DocumentColumn>
          <WorkspaceHeader eyebrow={section.title} icon={SECTION_ICON.plugins} title={plugin.id} />
          <div className="flex flex-col gap-lg">
            <p className="typo-paragraph-default">{tool.purpose}</p>
            <Install plugin={plugin} />
            <PluginContents plugin={plugin} />
          </div>
          <PluginSurfaces plugin={plugin} />
        </DocumentColumn>
      </WorkspaceFrame>
      <Inspector>
        <PluginInspector plugin={plugin} tool={tool} siblings={section.entities} />
      </Inspector>
    </>
  );
};
