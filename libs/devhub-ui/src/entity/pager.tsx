'use client';

import { Button } from '@berrypjh/react-ui';

import { useDevHubLink } from '../provider/devhub-provider';
import { INSPECTOR_ID } from '../shell/workspace';
import { Icon } from '../ui/icon';

/** 순서가 있는 목록의 한 자리. 항목 · 흐름 단계 · 기록이 같은 모양이다. */
export type PagerItem = { id: string; label: string; href: string };

/**
 * 같은 섹션 안의 이전 · 다음 항목. 링크는 상세 정보로 이어져, 이동한 뒤에도 이 칸에 머문다.
 * 이웃이 없는 쪽은 같은 자리의 비활성 버튼이다.
 */
const Arrow = ({ entity, unit, next }: { entity?: PagerItem; unit: string; next: boolean }) => {
  const Link = useDevHubLink();
  const hint = next ? `다음 ${unit}` : `이전 ${unit}`;
  const icon = <Icon name={next ? 'chevron-right' : 'chevron-left'} />;
  if (!entity) {
    return (
      <Button size="sm" variant="text" color="secondary" disabled aria-label={`${hint} 없음`}>
        {icon}
      </Button>
    );
  }
  return (
    <Button
      component={Link}
      to={`${entity.href}#${INSPECTOR_ID}`}
      size="sm"
      variant="text"
      color="secondary"
      aria-label={`${hint}: ${entity.label}`}
      title={hint}
    >
      {icon}
    </Button>
  );
};

export const Pager = ({
  entities,
  current,
  unit,
}: {
  entities: PagerItem[];
  current: string;
  unit: string;
}) => {
  const index = entities.findIndex((entity) => entity.id === current);
  return (
    <nav aria-label={`${unit} 이동`} className="flex shrink-0 items-center">
      <Arrow entity={entities[index - 1]} unit={unit} next={false} />
      <Arrow entity={entities[index + 1]} unit={unit} next />
    </nav>
  );
};
