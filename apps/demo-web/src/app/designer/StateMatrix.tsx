import { Table, TableScroll } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import type { ScenarioOverrides, StateMatrixMeta } from '../presentation/model';
import { Section } from '../shell/ui';

/**
 * State Matrix.
 *
 * **public prop 으로 재현되는 state 만** cell 이 된다. `hover`·`focus-visible`·`active` 처럼
 * 스타일시트 pseudo-class 로만 존재하는 state 는 강제할 prop 이 없으므로 cell 을 만들지 않고,
 * 한계를 글로 밝힌다 — 가짜 prop 을 넣어 동작하는 척하지 않는다.
 *
 * Canvas · Variant Matrix 와 같은 preview adapter 를 쓴다.
 */
export const StateMatrix = ({
  componentLabel,
  matrix,
  renderScenario,
}: {
  componentLabel: string;
  matrix: StateMatrixMeta;
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides) => ReactNode;
}) => {
  const { states, baseScenarioId, interactiveOnly } = matrix;

  return (
    <Section
      title="State Matrix"
      note={`${baseScenarioId} scenario 를 기준으로 prop 으로 재현되는 상태만 비교한다`}
    >
      <TableScroll label={`${componentLabel} state 비교 표`}>
        <Table hiddenCaption data-testid="state-matrix">
          <caption>{componentLabel} — 열마다 하나의 prop 상태</caption>
          <thead>
            <tr className="text-text-light text-xxsm">
              {states.map((state) => (
                <th
                  key={state.id}
                  scope="col"
                  className="text-left font-semiBold p-md whitespace-nowrap"
                >
                  {state.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-stroke-light">
              {states.map((state) => (
                <td key={state.id} className="p-md align-middle">
                  {renderScenario(baseScenarioId, state.props)}
                </td>
              ))}
            </tr>
          </tbody>
        </Table>
      </TableScroll>

      {interactiveOnly && interactiveOnly.length > 0 && (
        <p className="text-text-light text-xxsm mt-lg break-keep" data-testid="interactive-only">
          Interactive state ({interactiveOnly.join(' · ')}) — 스타일시트 pseudo-class 로만 존재해서
          이 MVP 에서는 고정 preview 로 재현하지 않는다. 실제 컴포넌트에 마우스·키보드로 확인한다.
        </p>
      )}
    </Section>
  );
};
