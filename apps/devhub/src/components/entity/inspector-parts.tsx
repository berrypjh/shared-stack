import { Empty } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { catalog } from '@/data';
import type { DocumentRef, SourceRef, TestSuite } from '@/domain/model';
import { groupByOwner } from '@/lib/catalog/reference-groups';

import { FileRow } from '../source/file-row';

/** 상세 정보 칸의 조각. 항목 상세와 흐름 단계 상세가 같은 모양으로 근거를 보인다. */

export const TestRows = ({ items, empty }: { items: TestSuite[]; empty: string }) =>
  items.length ? (
    <List className="flex flex-col gap-md">
      {items.map((suite) => (
        <ListItem key={suite.id} className="flex flex-col gap-xs">
          <span className="typo-body-small-strong">
            {suite.id} <span className="typo-caption-small text-text-light">· {suite.runner}</span>
          </span>
          <ul className="flex flex-col gap-sm">
            <FileRow source={suite.config} label="설정" />
            {suite.files?.map((file) => (
              <FileRow key={file.path} source={file} label="파일" />
            ))}
          </ul>
        </ListItem>
      ))}
    </List>
  ) : (
    <Empty reason={empty} />
  );

/** 경로를 품은 항목별로 묶은 파일 줄. */
export const SourceGroups = ({ refs, empty }: { refs: readonly SourceRef[]; empty?: string }) => {
  const groups = groupByOwner(catalog, refs);
  if (!groups.length && empty) return <Empty reason={empty} />;
  return groups.map((group) => (
    <div key={group.owner} className="flex flex-col gap-xs">
      <h4 className="typo-caption-small text-text-light">{group.owner}</h4>
      <ul className="flex flex-col gap-sm border-l border-stroke-light pl-md">
        {group.refs.map((ref) => (
          <FileRow key={ref.path} source={ref} />
        ))}
      </ul>
    </div>
  ));
};

export const DocumentRows = ({ items, empty }: { items: DocumentRef[]; empty: string }) =>
  items.length ? (
    <ul className="flex flex-col gap-sm">
      {items.map((doc) => (
        <FileRow key={doc.id} source={{ path: doc.path }} label={doc.title} />
      ))}
    </ul>
  ) : (
    <Empty reason={empty} />
  );
