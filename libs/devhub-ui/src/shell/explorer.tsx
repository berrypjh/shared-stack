'use client';

import { useEffect, useState } from 'react';

import { IconButton, List, ListItem } from '@berrypjh/react-ui';

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

export type ExplorerGroup = {
  title?: string;
  items: ExplorerItem[];
  /** 제목이 있는 묶음을 접힌 채로 시작한다. 현재 항목이 든 묶음은 늘 펼친다. */
  collapsed?: boolean;
};

export type ExplorerSection = {
  id: string;
  title: string;
  href: string;
  icon: IconName;
  /** 묶음이 없으면 하나만. 순서는 앱의 카탈로그가 정한다. */
  groups: ExplorerGroup[];
};

export type ExplorerView = { id: string; label: string; href: string; icon: IconName };

/** 항목 주소의 경로 부분. 항목이 query(예: 고른 실행 `?run=`)를 이어 가도 현재 항목은 경로로 정한다. */
const pathOf = (href: string) => href.split(/[?#]/)[0];

const useCurrent = () => {
  const { pathname } = useDevHub().router.location;
  return (href: string) => (pathname === pathOf(href) ? ('page' as const) : undefined);
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

type TitledGroup = ExplorerGroup & { title: string };

/** 제목이 있는 묶음. 제목을 눌러 접고 편다. 열림 상태는 섹션이 갖는다. */
const Group = ({
  group,
  open,
  onToggle,
}: {
  group: TitledGroup;
  open: boolean;
  onToggle: (open: boolean) => void;
}) => (
  <details
    open={open}
    onToggle={(event) => onToggle(event.currentTarget.open)}
    className="group/explorer-group"
  >
    <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2xs rounded-md px-sm typo-caption-small text-text-light hover:bg-background-default [&::-webkit-details-marker]:hidden">
      <Icon
        name="chevron-right"
        className="transition-transform group-open/explorer-group:rotate-90 motion-reduce:transition-none"
      />
      <span className="min-w-0 flex-1">{group.title}</span>
      <span>{group.items.length}</span>
    </summary>
    <div className="pt-xs">
      <Items items={group.items} />
    </div>
  </details>
);

/**
 * 섹션 안 묶음들의 열림 상태. `collapsed` 묶음은 접힌 채로 시작하고,
 * 현재 항목이 든 묶음은 이동할 때마다 펼친다. 한 번 편 묶음은 이동해도 접지 않는다.
 */
const useGroupsOpen = (groups: TitledGroup[]) => {
  const { pathname } = useDevHub().router.location;
  const current = groups.find((group) =>
    group.items.some((item) => pathOf(item.href) === pathname),
  );
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.title, !group.collapsed || group === current])),
  );
  const currentTitle = current?.title;
  useEffect(() => {
    if (currentTitle) setOpen((state) => ({ ...state, [currentTitle]: true }));
  }, [currentTitle]);
  const set = (title: string, value: boolean) =>
    setOpen((state) => (state[title] === value ? state : { ...state, [title]: value }));
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(groups.map((group) => [group.title, value])));
  return { open, set, setAll };
};

/**
 * 섹션 묶음을 한꺼번에 여닫는 토글 하나. 모두 펼쳐져 있으면 모두 접고, 하나라도 접혀 있으면 모두 편다.
 * 이름은 `aria-label`, 마우스에는 `title` 로 보인다.
 */
const GroupsToggle = ({
  title,
  allOpen,
  onToggle,
}: {
  title: string;
  allOpen: boolean;
  onToggle: () => void;
}) => {
  const label = `${title} 묶음 모두 ${allOpen ? '닫기' : '열기'}`;
  return (
    <IconButton size="sm" color="secondary" aria-label={label} title={label} onClick={onToggle}>
      <Icon name={allOpen ? 'fold' : 'unfold'} />
    </IconButton>
  );
};

const Section = ({ section }: { section: ExplorerSection }) => {
  const { Link } = useDevHub().router;
  const current = useCurrent();
  const headingId = `explorer-${section.id}`;
  const count = section.groups.reduce((n, group) => n + group.items.length, 0);
  const titled = section.groups.filter((group): group is TitledGroup => Boolean(group.title));
  const { open, set, setAll } = useGroupsOpen(titled);
  const allOpen = titled.every((group) => open[group.title] ?? true);
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-xs py-lg">
      <div className="flex items-center gap-2xs px-sm">
        <h2 id={headingId} className="flex flex-1 items-center justify-between">
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
        {titled.length > 1 && (
          <GroupsToggle title={section.title} allOpen={allOpen} onToggle={() => setAll(!allOpen)} />
        )}
      </div>
      {section.groups.map((group, index) =>
        group.title ? (
          <Group
            key={group.title}
            group={{ ...group, title: group.title }}
            open={open[group.title] ?? true}
            onToggle={(value) => set(group.title as string, value)}
          />
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
