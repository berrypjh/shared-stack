'use client';

import { List, ListItem } from '@berrypjh/react-ui';

import { useDevHub } from '../provider/devhub-provider';
import { Icon, type IconName } from '../ui/icon';

import { ExplorerPane } from './explorer-drawer';

/** 탐색기 항목 한 줄. 현재 항목은 배경과 굵기로, `aria-current` 로 알린다. */
const ITEM =
  'flex min-h-8 items-center gap-sm rounded-md px-sm py-xs typo-body-small text-text-default hover:bg-background-default aria-[current=page]:bg-(--ds-background-selected) aria-[current=page]:typo-body-small-strong';

export type ExplorerItem = {
  id: string;
  label: string;
  href: string;
  /** 경로처럼 글자 그대로 읽어야 하는 이름. */
  code?: boolean;
};

export type ExplorerGroup = { title?: string; items: ExplorerItem[] };

export type ExplorerSection = {
  id: string;
  title: string;
  href: string;
  icon: IconName;
  /** 묶음이 없으면 하나만. 순서는 앱의 카탈로그가 정한다. */
  groups: ExplorerGroup[];
};

export type ExplorerView = { id: string; label: string; href: string; icon: IconName };

const useCurrent = () => {
  const { pathname } = useDevHub().router.location;
  return (href: string) => (pathname === href ? ('page' as const) : undefined);
};

const Items = ({ items }: { items: ExplorerItem[] }) => {
  const { Link } = useDevHub().router;
  const current = useCurrent();
  return (
    <List className="flex flex-col gap-2xs">
      {items.map((item) => (
        <ListItem key={item.id}>
          <Link to={item.href} aria-current={current(item.href)} className={ITEM}>
            <span className={item.code ? 'min-w-0 font-mono text-xsm' : 'min-w-0'}>
              {item.label}
            </span>
          </Link>
        </ListItem>
      ))}
    </List>
  );
};

const Section = ({ section }: { section: ExplorerSection }) => {
  const { Link } = useDevHub().router;
  const current = useCurrent();
  const headingId = `explorer-${section.id}`;
  const count = section.groups.reduce((n, group) => n + group.items.length, 0);
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-xs py-lg">
      <h2 id={headingId} className="flex items-center justify-between px-sm">
        <Link
          to={section.href}
          aria-current={current(section.href)}
          className="inline-flex items-center gap-sm typo-body-small-strong text-text-default hover:underline aria-[current=page]:underline"
        >
          <Icon name={section.icon} className="text-text-light" />
          {section.title}
        </Link>
        <span className="typo-caption-small text-text-light">{count}</span>
      </h2>
      {section.groups.map((group, index) =>
        group.title ? (
          <div key={group.title} className="flex flex-col gap-xs">
            <h3 className="px-sm typo-caption-small text-text-light">{group.title}</h3>
            <Items items={group.items} />
          </div>
        ) : (
          <Items key={index} items={group.items} />
        ),
      )}
    </section>
  );
};

/**
 * 왼쪽 칸: 섹션이 없는 보기(개요 · 아키텍처), 그 아래 카탈로그 섹션과 항목 전부.
 * `lg` 미만에서는 상단 바에서 여는 서랍이며, 상단 바의 보기와 같은 목록을 앱이 넘긴다.
 */
export const Explorer = ({
  views,
  sections,
}: {
  views: ExplorerView[];
  sections: ExplorerSection[];
}) => {
  const { Link } = useDevHub().router;
  const current = useCurrent();
  return (
    <ExplorerPane>
      <nav
        aria-label="저장소 항목"
        className="flex flex-col divide-y divide-stroke-light p-md pb-4xl"
      >
        <List className="flex flex-col gap-2xs pb-lg">
          {views.map((view) => (
            <ListItem key={view.id}>
              <Link to={view.href} aria-current={current(view.href)} className={ITEM}>
                <Icon name={view.icon} className="text-text-light" />
                {view.label}
              </Link>
            </ListItem>
          ))}
        </List>
        {sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </nav>
    </ExplorerPane>
  );
};
