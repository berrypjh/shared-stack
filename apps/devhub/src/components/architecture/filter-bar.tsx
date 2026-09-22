import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import {
  type ArchitectureFilters,
  FILTER_VALUES,
  filterQuery,
} from '@/lib/catalog/architecture-filters';
import { PLATFORM, VISIBILITY } from '@/lib/catalog/labels';

type Param = keyof ArchitectureFilters;

const GROUPS: { param: Param; label: string; option: (value: string) => string }[] = [
  {
    param: 'kind',
    label: '종류',
    option: (value) =>
      ({ application: '애플리케이션', package: '패키지', tool: '도구' })[value] ?? value,
  },
  {
    param: 'visibility',
    label: '공개 여부',
    option: (value) => VISIBILITY[value as keyof typeof VISIBILITY],
  },
  {
    param: 'platform',
    label: '플랫폼',
    option: (value) => PLATFORM[value as keyof typeof PLATFORM],
  },
];

const OPTION =
  'inline-flex min-h-8 items-center rounded-md px-sm typo-caption-small text-text-link hover:bg-background-default aria-[current=true]:bg-(--ds-background-selected) aria-[current=true]:text-text-default aria-[current=true]:typo-body-small-strong';

/**
 * 필터는 링크다: JavaScript 없이도 되고, 다른 필터와 고른 노드를 유지한다. 현재 값은
 * `aria-current` 와 ✓ · 굵기로 알린다 — 색만이 아니다. 공개 여부는 패키지에만 있는 사실이다.
 */
export const FilterBar = ({
  basePath,
  active,
}: {
  basePath: string;
  active: ArchitectureFilters;
}) => {
  const hrefWith = (param: Param, value: string | undefined) =>
    `${basePath}${filterQuery({ ...active, [param]: value })}`;
  return (
    <nav aria-label="필터" className="flex flex-col gap-sm">
      {GROUPS.map((group) => (
        <div
          key={group.param}
          role="group"
          aria-labelledby={`filter-${group.param}`}
          className="flex flex-wrap items-center gap-sm"
        >
          <span id={`filter-${group.param}`} className="w-16 typo-caption-small text-text-light">
            {group.label}
          </span>
          <List className="flex flex-wrap gap-xs">
            {[undefined, ...FILTER_VALUES[group.param]].map((value) => {
              const current = active[group.param] === value;
              return (
                <ListItem key={value ?? 'all'}>
                  <Link
                    to={hrefWith(group.param, value)}
                    aria-current={current ? 'true' : undefined}
                    className={OPTION}
                  >
                    {current && <span aria-hidden="true">✓&nbsp;</span>}
                    {value ? group.option(value) : '전체'}
                  </Link>
                </ListItem>
              );
            })}
          </List>
        </div>
      ))}
    </nav>
  );
};
