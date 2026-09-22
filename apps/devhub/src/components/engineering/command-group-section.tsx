import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import { commandLine } from '@/domain/commands';
import type { CommandGroup } from '@/domain/model';
import { commandsIn } from '@/lib/catalog/command-related';

import { journeyHref } from '../flow/presentation';
import { EntityLink, LINK } from '../ui/entity-link';

import { CommandCard } from './command-card';

export const groupAnchor = (id: string) => `commands-${id}`;

/**
 * 소비자 평가: executor 없이 결정적으로 도는 것과 외부 executor 가 필요한 것을 가른다.
 * 후자는 성공처럼 보이지 않는다 — executor 가 없으면 실행을 거부한다는 사실만 적는다.
 */
const EvalSplit = () => {
  const evals = commandsIn(catalog, 'consumer-eval');
  const external = (c: (typeof evals)[number]) =>
    c.constraints.some((k) => k.kind === 'external-executor');
  const rows = [
    ['결정적 — executor 없음', evals.filter((c) => !external(c))],
    ['외부 executor 필요 — 지금은 없다', evals.filter(external)],
  ] as const;
  return (
    <dl className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] gap-x-md gap-y-xs typo-body-small">
      {rows.map(([label, list]) => (
        <div key={label} className="contents">
          <dt className="text-text-light">{label}</dt>
          <dd className="flex flex-wrap gap-x-md">
            {list.map((c) => (
              <code key={c.id} className="font-mono">
                {commandLine(c)}
              </code>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
};

/** 품질 관측: 결과는 quality-lab 이 보여 준다. 여기서는 그리로 가는 길만 둔다 — metric 을 싣지 않는다. */
const QualityLabLinks = () => (
  <p className="typo-body-small">
    결과 화면과 metric 은 <EntityLink id="quality-lab" /> 에 있다. 수집에서 화면까지의 흐름은{' '}
    <Link to={journeyHref('quality-observability')} className={LINK}>
      품질 관측 흐름
    </Link>
    에서 단계별로 본다.
  </p>
);

export const CommandGroupSection = ({ group }: { group: CommandGroup }) => {
  const commands = commandsIn(catalog, group.id);
  const docs = group.docs.flatMap((id) => catalog.documents.find((doc) => doc.id === id) ?? []);
  return (
    <WorkspaceSection
      id={groupAnchor(group.id)}
      title={`${group.title} · 명령 ${commands.length}개`}
    >
      <p className="typo-body-small text-text-light">{group.summary}</p>
      {group.id === 'consumer-eval' && <EvalSplit />}
      {group.id === 'observability' && <QualityLabLinks />}
      {docs.length > 0 && (
        <List className="flex flex-wrap gap-x-md typo-caption-small">
          {docs.map((doc) => (
            <ListItem key={doc.id}>
              <Link to={`/documents/${doc.id}`} className={LINK}>
                {doc.path}
              </Link>
            </ListItem>
          ))}
        </List>
      )}
      <div className="flex flex-col divide-y divide-stroke-light">
        {commands.map((command) => (
          <CommandCard key={command.id} command={command} />
        ))}
      </div>
    </WorkspaceSection>
  );
};
