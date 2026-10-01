import { DataTable, DocumentSection } from '@berrypjh/devhub-ui';
import { Chip, List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Code, ROWS } from '@/components/entity/entity-detail';
import { FileRow } from '@/components/source/file-row';
import { LINK } from '@/components/ui/entity-link';
import { catalog } from '@/data';
import type {
  Plugin,
  PluginHook,
  PluginHookPolicy,
  PluginMcpServer,
  PluginSkill,
  SourceRef,
} from '@/domain/model';
import { RULE_SCOPE } from '@/lib/catalog/labels';
import { documentHref, pluginSkillAnchor, pluginToolAnchor } from '@/lib/catalog/routes';
import { titleText } from '@/lib/markdown/documents';

const STACK =
  'flex flex-col divide-y divide-stroke-light [&>*]:py-xl [&>*:first-child]:pt-0 [&>*:last-child]:pb-0';

export const Files = ({ refs }: { refs: readonly SourceRef[] }) => (
  <ul className="flex flex-col gap-xs">
    {refs.map((ref) => (
      <FileRow key={`${ref.path}#${ref.symbol ?? ''}`} source={ref} />
    ))}
  </ul>
);

/** 제목에 쓰는 명령 · 이름. `Code` 는 작은 글자라 제목 크기를 그대로 따르는 monospace 로 쓴다. */
const Command = ({ children }: { children: string }) => (
  <span className="font-mono">{children}</span>
);

/**
 * 접어 둔 부가 정보. 모양은 문서 화면의 "이 페이지에서" 접이와 같고, 펼치면 선 아래에 항목마다 이름 · 내용을 둔다.
 * 제목은 기본으로 근거 파일 개수다.
 */
const FileDetails = ({
  refs,
  summary = `근거 파일 ${refs.length}개`,
  condition,
}: {
  refs: readonly SourceRef[];
  summary?: string;
  /** skill 의 호출 조건. 있으면 파일 앞에 둔다. */
  condition?: string;
}) => (
  <details className="rounded-md border border-stroke-light bg-background-surface">
    <summary className="cursor-pointer px-md py-sm typo-body-small text-text-light">
      {summary}
    </summary>
    <dl className="flex flex-col gap-lg border-t border-stroke-light p-lg">
      {condition && (
        <div className="flex flex-col gap-xs">
          <dt className="typo-caption-small text-text-light">호출 조건</dt>
          <dd className="typo-body-small">{condition}</dd>
        </div>
      )}
      <div className="flex flex-col gap-sm">
        <dt className="typo-caption-small text-text-light">파일</dt>
        <dd>
          <ul className="flex flex-col gap-md">
            {refs.map((ref) => (
              <FileRow key={`${ref.path}#${ref.symbol ?? ''}`} source={ref} />
            ))}
          </ul>
        </dd>
      </div>
    </dl>
  </details>
);

/** 목록 한 줄씩(키워드처럼 코드 글자인 것). */
export const Keywords = ({ items }: { items: readonly string[] }) => (
  <List className="flex flex-wrap gap-x-md gap-y-xs">
    {items.map((item) => (
      <ListItem key={item}>
        <Code>{item}</Code>
      </ListItem>
    ))}
  </List>
);

/** skill 하나. 플러그인 skill 은 `/<플러그인>:<skill>` 로 부른다. `#` 로 오면 포커스를 받는다. */
const Skill = ({ plugin, skill }: { plugin: string; skill: PluginSkill }) => {
  const id = pluginSkillAnchor(skill.name);
  return (
    <article id={id} tabIndex={-1} aria-labelledby={`${id}-name`} className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        <h3 id={`${id}-name`} className="typo-body-medium-strong">
          <Command>{`/${plugin}:${skill.name}`}</Command>
        </h3>
        <Chip size="sm">{skill.userOnly ? '사용자만 호출' : '모델도 호출'}</Chip>
      </div>
      <p className="typo-paragraph-default">{skill.description}</p>
      {skill.argumentHint && (
        <p className="typo-body-small text-text-light">
          인자 <Code>{skill.argumentHint}</Code>
        </p>
      )}
      <FileDetails
        summary={skill.whenToUseKo ? '호출 조건 · 파일' : '파일'}
        condition={skill.whenToUseKo}
        refs={[skill.source, ...skill.resources]}
      />
    </article>
  );
};

/** MCP 서버 하나 — 실행 명령 · 선언 · 구현과 서버가 등록하는 도구. */
const McpServer = ({ server }: { server: PluginMcpServer }) => (
  <article aria-labelledby={`plugin-mcp-${server.name}`} className="flex flex-col gap-md">
    <h3 id={`plugin-mcp-${server.name}`} className="typo-body-medium-strong">
      <Command>{server.name}</Command>
    </h3>
    <p className="typo-body-small text-text-light">
      실행 <Code>{server.command}</Code>
    </p>
    <DataTable caption={`${server.name} 도구`} headers={['도구', '제목']}>
      {server.tools.map((tool) => (
        <tr key={tool.name} id={pluginToolAnchor(tool.name)} tabIndex={-1}>
          <th scope="row">
            <Code>{tool.name}</Code>
          </th>
          <td>{tool.title}</td>
        </tr>
      ))}
    </DataTable>
    <FileDetails refs={[server.config, server.implementation]} />
  </article>
);

/** hook 의 판정 규칙 — 막는 조건 · 대상 · 우회 수단 · 한계. */
const HookPolicy = ({ policy }: { policy: PluginHookPolicy }) => (
  <section
    aria-label="판정 규칙"
    className="flex flex-col gap-md rounded-md border border-stroke-light bg-background-default p-lg"
  >
    <h4 className="typo-body-medium-strong">판정 규칙</h4>
    <p className="typo-paragraph-default">{policy.decision}</p>
    <dl className={ROWS}>
      <dt className="text-text-light">대상 파일</dt>
      <dd>
        <Keywords items={policy.targets} />
      </dd>
      <dt className="text-text-light">제외</dt>
      <dd>
        <Keywords items={policy.exceptions} />
      </dd>
    </dl>
    <DataTable caption="우회 수단" headers={['우회 수단', '해당 명령']}>
      {policy.bypasses.map((bypass) => (
        <tr key={bypass.what}>
          <th scope="row">{bypass.what}</th>
          <td>
            <Code>{bypass.examples}</Code>
          </td>
        </tr>
      ))}
    </DataTable>
    <p className="typo-body-small text-text-light">한계 — {policy.limits}</p>
  </section>
);

/** hook 하나 — 어떤 도구 호출 전에 무엇을 실행하는지 한 줄 흐름으로, 그 아래 판정 규칙과 근거. */
const Hook = ({ hook }: { hook: PluginHook }) => (
  <article aria-label={`${hook.event} hook`} className="flex flex-col gap-md">
    <div className="flex flex-wrap items-baseline justify-between gap-sm">
      <h3 className="typo-body-medium-strong">
        <Command>{hook.event}</Command>
      </h3>
      <span className="typo-body-small text-text-light">
        제한 {hook.timeoutSeconds ? `${hook.timeoutSeconds}초` : '기본값'}
      </span>
    </div>
    <p className="typo-paragraph-default">{hook.summary}</p>
    <p className="flex flex-wrap items-center gap-xs typo-body-small">
      {hook.matcher ? <Code>{hook.matcher}</Code> : '모든 도구'}
      <span>호출 전</span>
      <span aria-hidden="true" className="text-text-light">
        →
      </span>
      <Code>{hook.command}</Code>
    </p>
    {hook.policy && <HookPolicy policy={hook.policy} />}
    <FileDetails
      refs={[hook.config, ...(hook.policy ? [hook.policy.source, ...hook.policy.evidence] : [])]}
    />
  </article>
);

/**
 * 작업 규칙 — 제목은 앱 안의 문서 화면으로 간다(원본이 카탈로그 문서로 등록돼 있다, 테스트가 막는다).
 * 늘 켜지는 것과 소비 저장소가 고르는 것을 적용 칸이 나눈다.
 */
const Rules = ({ plugin }: { plugin: Plugin }) => (
  <DataTable caption="작업 규칙" headers={['규칙', 'id', '적용']}>
    {plugin.rules.map((rule) => {
      const doc = catalog.documents.find((candidate) => candidate.path === rule.source.path);
      return (
        <tr key={rule.id}>
          <th scope="row">
            {doc ? (
              <Link to={documentHref(doc.id)} className={LINK}>
                {titleText(doc)}
              </Link>
            ) : (
              <Files refs={[rule.source]} />
            )}
          </th>
          <td>
            <Code>{rule.id}</Code>
          </td>
          <td>{RULE_SCOPE[rule.scope]}</td>
        </tr>
      );
    })}
  </DataTable>
);

type Surface = {
  id: string;
  title: string;
  count: (plugin: Plugin) => number;
  render: (plugin: Plugin) => ReactNode;
};

/** 플러그인이 소비 저장소에 주는 것의 종류. 화면 순서이기도 하다. */
const SURFACES: Surface[] = [
  {
    id: 'plugin-skills',
    title: 'Skill',
    count: (plugin) => plugin.skills.length,
    render: (plugin) => (
      <div className={STACK}>
        {plugin.skills.map((skill) => (
          <Skill key={skill.name} plugin={plugin.id} skill={skill} />
        ))}
      </div>
    ),
  },
  {
    id: 'plugin-mcp',
    title: 'MCP 서버',
    count: (plugin) => plugin.mcpServers.length,
    render: (plugin) => (
      <div className={STACK}>
        {plugin.mcpServers.map((server) => (
          <McpServer key={server.name} server={server} />
        ))}
      </div>
    ),
  },
  {
    id: 'plugin-hooks',
    title: 'Hook',
    count: (plugin) => plugin.hooks.length,
    render: (plugin) => (
      <div className={STACK}>
        {plugin.hooks.map((hook, index) => (
          <Hook key={`${hook.event}-${index}`} hook={hook} />
        ))}
      </div>
    ),
  },
  {
    id: 'plugin-rules',
    title: '작업 규칙',
    count: (plugin) => plugin.rules.length,
    render: (plugin) => <Rules plugin={plugin} />,
  },
];

/**
 * 무엇을 몇 개 주는지 한눈에. 각 항목은 아래 절로 간다. 주지 않는 것은 한 줄로 모은다.
 * 화면 머리에 두므로 절이 아니라 이름 있는 nav 다.
 */
export const PluginContents = ({ plugin }: { plugin: Plugin }) => {
  const provided = SURFACES.filter((surface) => surface.count(plugin) > 0);
  const missing = SURFACES.filter((surface) => surface.count(plugin) === 0);
  return (
    <nav aria-label="제공하는 것" className="flex flex-col gap-sm">
      <List className="grid grid-cols-2 gap-md sm:grid-cols-4">
        {provided.map((surface) => (
          <ListItem key={surface.id}>
            <a
              href={`#${surface.id}`}
              className="flex flex-col gap-xs rounded-md border border-stroke-light px-lg py-md hover:border-stroke-default"
            >
              <span className="typo-body-small text-text-light">{surface.title}</span>{' '}
              <span className="typo-heading-h5">{surface.count(plugin)}</span>
            </a>
          </ListItem>
        ))}
      </List>
      {missing.length > 0 && (
        <p className="typo-body-small text-text-light">
          배포하지 않음 — {missing.map((surface) => surface.title).join(' · ')}
        </p>
      )}
    </nav>
  );
};

/**
 * 플러그인이 소비 저장소에 주는 것: skill · MCP 서버 · hook · 작업 규칙 중 실제로 주는 것만 문서의 절로 그린다.
 * 값은 카탈로그(`data/plugins.ts`)이고, 테스트가 플러그인 파일과 대조한다.
 */
export const PluginSurfaces = ({ plugin }: { plugin: Plugin }) => (
  <>
    {SURFACES.filter((surface) => surface.count(plugin) > 0).map((surface) => (
      <DocumentSection key={surface.id} id={surface.id} title={surface.title}>
        {surface.render(plugin)}
      </DocumentSection>
    ))}
  </>
);
