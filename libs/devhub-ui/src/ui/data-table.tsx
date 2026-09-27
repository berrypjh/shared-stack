import { Table, TableScroll } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

/**
 * 머리 행이 있는 데이터 표. caption 이 표의 이름이고, `TableScroll` 의 label 이 키보드로
 * 스크롤하는 영역의 이름이다. 행 머리는 호출자가 `<th scope="row">` 로 준다.
 */
export const DataTable = ({
  caption,
  headers,
  children,
}: {
  caption: string;
  headers: string[];
  children: ReactNode;
}) => (
  <TableScroll label={`${caption} 표`} className="rounded-md border border-stroke-light">
    <Table>
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
