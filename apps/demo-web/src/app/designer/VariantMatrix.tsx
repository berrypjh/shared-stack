import { Table, TableScroll } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import type { ScenarioOverrides, VariantMatrixMeta } from '../presentation/model';
import { Section } from '../shell/ui';

/**
 * Variant Matrix.
 *
 * definition 이 선언한 **명시적인 축**만 쓴다. 축은 최대 둘이고, 곱해서 조합을 만들어 내지
 * 않는다 — 지원되지 않는 조합은 애초에 data 에 없다.
 *
 * cell 은 Canvas 와 **같은 preview adapter** 를 부른다. 비교 전용 renderer 를 따로 만들면
 * 같은 컴포넌트가 두 방식으로 그려져 갈린다.
 *
 * 실제 표라서 `Table` 을 쓴다 — row/column header 시맨틱이 필요하고, 좁은 화면에서는
 * `TableScroll` 이 키보드로 스크롤되는 영역을 준다 (WCAG 2.1.1). cell 을 찌그러뜨리지 않는다.
 */
export const VariantMatrix = ({
  componentLabel,
  matrix,
  renderScenario,
}: {
  componentLabel: string;
  matrix: VariantMatrixMeta;
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides) => ReactNode;
}) => {
  const { columns, rows, baseScenarioId } = matrix;

  const caption = rows
    ? `${componentLabel} — 열은 ${columns.label}, 행은 ${rows.label}`
    : `${componentLabel} — 열은 ${columns.label}`;

  return (
    <Section
      title="Variant Matrix"
      note={`${baseScenarioId} scenario 를 기준으로 ${
        rows ? `${columns.label} × ${rows.label}` : columns.label
      } 를 비교한다`}
    >
      <TableScroll label={`${componentLabel} variant 비교 표`}>
        <Table hiddenCaption data-testid="variant-matrix">
          <caption>{caption}</caption>
          <thead>
            <tr className="text-text-light text-xxsm">
              {/* 행 머리 열의 빈 칸. 행 축 이름을 여기 둔다. */}
              <th scope="col" className="text-left font-semiBold p-md whitespace-nowrap">
                {rows ? `${rows.label} ↓` : ''}
              </th>
              {columns.options.map((option) => (
                <th
                  key={option.id}
                  scope="col"
                  className="text-left font-semiBold p-md whitespace-nowrap"
                >
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows ? (
              rows.options.map((row) => (
                <tr key={row.id} className="border-t border-stroke-light">
                  <th
                    scope="row"
                    className="text-left text-text-light text-xxsm font-semiBold p-md whitespace-nowrap"
                  >
                    {row.label}
                  </th>
                  {columns.options.map((column) => (
                    // 두 축의 값만 덮어쓴다. 세 번째 축을 끼워 넣지 않는다.
                    <td key={column.id} className="p-md align-middle">
                      {renderScenario(baseScenarioId, {
                        [rows.prop]: row.value,
                        [columns.prop]: column.value,
                      })}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-stroke-light">
                <th scope="row" className="p-md" />
                {columns.options.map((column) => (
                  <td key={column.id} className="p-md align-middle">
                    {renderScenario(baseScenarioId, { [columns.prop]: column.value })}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </Table>
      </TableScroll>
    </Section>
  );
};
