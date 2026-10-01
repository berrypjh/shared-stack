import { Empty, FileList } from '@berrypjh/devhub-ui';

import { catalog } from '@/data';
import type { DocumentRef, SourceRef, TestSuite } from '@/domain/model';
import { countByOwner, groupByOwner } from '@/lib/catalog/reference-groups';

import { FileRow } from '../source/file-row';

/** 상세 정보 칸의 조각. 항목 · 흐름 단계 · 기록 · 플러그인 상세가 같은 모양으로 근거를 보인다. */

/** 소스 섹션 머리의 요약 줄. 묶음이 둘 이상일 때만 있다. */
export const sourceSummary = (refs: readonly SourceRef[]) => {
  const groups = groupByOwner(catalog, refs);
  return groups.length > 1 ? countByOwner(groups) : undefined;
};

/** 경로를 품은 항목별로 묶은 파일 줄. 폴더는 항목 루트 아래만, 같은 파일의 symbol 은 한 줄에. */
export const SourceGroups = ({ refs, empty }: { refs: readonly SourceRef[]; empty?: string }) => {
  const groups = groupByOwner(catalog, refs);
  if (!groups.length && empty) return <Empty reason={empty} />;
  const symbolsOf = (path: string) =>
    refs.flatMap((ref) => (ref.path === path && ref.symbol ? [ref.symbol] : []));
  return (
    <div className="flex flex-col gap-md">
      {groups.map((group) => (
        <FileList key={group.owner} title={group.owner}>
          {group.refs.map((ref) => (
            <FileRow
              key={ref.path}
              source={ref}
              base={group.root}
              symbols={[...new Set(symbolsOf(ref.path))]}
            />
          ))}
        </FileList>
      ))}
    </div>
  );
};

/** 문서 한 편에 한 줄. 파일 이름 아래에 문서 제목을 둔다. */
export const DocumentRows = ({ items, empty }: { items: DocumentRef[]; empty: string }) =>
  items.length ? (
    <ul className="flex flex-col gap-md">
      {items.map((doc) => (
        <FileRow key={doc.id} source={{ path: doc.path }}>
          <p className="typo-caption-small">{doc.title}</p>
        </FileRow>
      ))}
    </ul>
  ) : (
    <Empty reason={empty} />
  );

/** `vitest 3 · playwright 1`: 러너마다 테스트 묶음이 몇 개인지. */
export const countByRunner = (suites: readonly TestSuite[]) => {
  const counts = new Map<string, number>();
  for (const suite of suites) counts.set(suite.runner, (counts.get(suite.runner) ?? 0) + 1);
  return [...counts].map(([runner, count]) => `${runner} ${count}`).join(' · ') || undefined;
};

/** 테스트 묶음마다 이름 · 러너, 그 아래 설정과 파일. */
export const TestRows = ({ items, empty }: { items: TestSuite[]; empty: string }) =>
  items.length ? (
    <div className="flex flex-col gap-md">
      {items.map((suite) => (
        <FileList
          key={suite.id}
          title={
            <>
              <span className="typo-body-small-strong text-text-default">{suite.id}</span>
              {suite.runner}
            </>
          }
        >
          <FileRow source={suite.config} label="설정" />
          {suite.files?.map((file) => (
            <FileRow key={file.path} source={file} label="파일" />
          ))}
        </FileList>
      ))}
    </div>
  ) : (
    <Empty reason={empty} />
  );
