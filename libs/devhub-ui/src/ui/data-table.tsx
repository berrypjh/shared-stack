import { Table, TableScroll } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

/**
 * 머리 행이 있는 데이터 표. caption 이 표의 이름이고, `TableScroll` 의 label 이 키보드로
 * 스크롤하는 영역의 이름이다. 행 머리는 호출자가 `<th scope="row">` 로 준다.
 * caption 은 기본으로 시각만 숨긴다 — 표 위의 제목이 이미 표를 부르고, 이름은 보조기술에 남는다.
 * 보이게 하려면 `hiddenCaption={false}`.
 */
export const DataTable = ({
  caption,
  headers,
  hiddenCaption = true,
  children,
}: {
  caption: string;
  headers: string[];
  hiddenCaption?: boolean;
  children: ReactNode;
}) => (
  <TableScroll label={`${caption} 표`} className="rounded-md border border-stroke-light">
    {/* 테두리가 caption 까지 감싸므로 caption 을 셀 글자와 같은 여백에 둔다 — 없으면 둥근 모서리에 붙는다. */}
    <Table hiddenCaption={hiddenCaption} className="[&>caption]:px-md [&>caption]:pt-sm">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </Table>
  </TableScroll>
);
