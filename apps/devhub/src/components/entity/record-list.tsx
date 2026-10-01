import { RecordMeta, WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { RECORDS_NEWEST_FIRST } from '@/lib/catalog/entities';
import { RECORD_KIND } from '@/lib/catalog/labels';
import { recordHref } from '@/lib/catalog/routes';

import { LINK } from '../ui/entity-link';

/**
 * 개발 기록을 최신순 목록으로. 언제 · 어떤 종류 · 무엇으로 결론 났는지 한 줄씩 보여서 무엇을
 * 열지 고르게 한다.
 */
export const RecordList = () => (
  <WorkspaceSection id="section-list" title={`${RECORDS_NEWEST_FIRST.length}개`}>
    <List className="flex flex-col divide-y divide-stroke-light">
      {RECORDS_NEWEST_FIRST.map((record) => (
        <ListItem key={record.id} className="flex flex-col gap-2xs py-sm">
          <RecordMeta date={record.date} kind={RECORD_KIND[record.kind]} />
          <Link to={recordHref(record.id)} className={`typo-body-small-strong ${LINK}`}>
            {record.title}
          </Link>
          <p className="typo-body-small text-text-light">{record.summary}</p>
        </ListItem>
      ))}
    </List>
  </WorkspaceSection>
);
