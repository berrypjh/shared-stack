import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { queryString } from '@/lib/evaluation/query';
import { type ScreenId, screenPath } from '@/lib/evaluation/screens';

import { LINK } from '../ui/entity-link';

/**
 * 이 영역을 가진 다른 실행으로 가는 링크. 같은 화면을 그 실행으로 연다.
 * `runs` 가 null(요약을 아직 받지 않음)이거나 비어 있으면 아무것도 그리지 않는다.
 */
export const AlternativeRuns = ({
  screen,
  runs,
  panel,
}: {
  screen: ScreenId;
  runs: readonly string[] | null;
  /** 그 화면에서 열 panel. 영역이 panel 에 따라 나뉘는 화면(AI 평가의 context)만 쓴다. */
  panel?: string;
}) =>
  runs && runs.length > 0 ? (
    <List className="flex flex-wrap gap-sm typo-body-small">
      {runs.map((id) => (
        <ListItem key={id}>
          <Link className={LINK} to={`${screenPath(screen)}${queryString({ run: id, panel })}`}>
            {id}
          </Link>
        </ListItem>
      ))}
    </List>
  ) : null;
