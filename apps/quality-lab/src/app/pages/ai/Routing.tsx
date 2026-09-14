import {
  CONFUSION_PREDICTED,
  type ConfusionMatrix,
  type EvalRun,
} from '@berrypjh/observability-contracts';

import { DataTable } from '../../components/DataTable';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { type ConfusionCell, confusionGrid, routingMatrix } from '../../data/ai';
import { notRunState } from '../../data/status';

const cellTone = (cell: ConfusionCell) =>
  cell.count === 0 ? '' : cell.diagonal ? 'bg-background-success/15' : 'bg-background-error/15';

const correctText = (value: boolean | null) =>
  value === null ? '판정 없음' : value ? '일치' : '불일치';

/** expected 행 × predicted 열 heatmap. 칸의 글이 곧 값이라 표와 차트가 같은 요소다. */
const ConfusionTable = ({ caption, matrix }: { caption: string; matrix: ConfusionMatrix }) => (
  <div className="flex flex-col gap-xs">
    <DataTable caption={caption} headers={['expected \\ predicted', ...CONFUSION_PREDICTED]}>
      {confusionGrid(matrix).map((row) => (
        <tr key={row.expected}>
          <th scope="row">{row.expected}</th>
          {row.cells.map((cell) => (
            <td key={cell.predicted} data-count={cell.count} className={cellTone(cell)}>
              {cell.count}
              {cell.count > 0 && (
                <span className="text-text-light text-xxsm">
                  {cell.diagonal ? ' 일치' : ' 불일치'}
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </DataTable>
    <p className="text-text-default text-xsm leading-xsm">
      {`total ${matrix.total} · correct ${matrix.correct} · unreported ${matrix.unreported} · accuracy ${
        matrix.accuracy === null ? 'N/A' : `${(matrix.accuracy * 100).toFixed(1)}%`
      }`}
    </p>
  </div>
);

export const Routing = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => {
  const variants = evalRun.variants.filter((item) => !variant || item.variant === variant);
  const resolver = routingMatrix(evalRun, 'deterministic-resolver', null);
  const failures = evalRun.traces.filter(
    (trace) => (!variant || trace.variant === variant) && trace.routing.platformCorrect !== true,
  );
  const routingImport = evalRun.import.routing;

  return (
    <Section title="Routing" anchor="routing">
      <p className="text-text-light text-xsm leading-xsm break-keep">
        행은 기대 platform, 열은 예측 platform 입니다. 순서는 고정이고 both·unreported 를 숨기지
        않습니다. 칸의 0 은 관측한 0 이고, 결과 자체가 없는 matrix 는 표 대신 따로 알립니다.
      </p>
      {resolver ? (
        <ConfusionTable caption="Routing — deterministic-resolver" matrix={resolver} />
      ) : (
        <StatusNotice
          level={3}
          state={notRunState({
            section: 'deterministic resolver routing',
            runId: evalRun.sourceId,
            reason: `routing report import ${routingImport.status}${
              routingImport.reason ? ` — ${routingImport.reason}` : ''
            }`,
            collectProfile: 'eval',
            alternatives: null,
          })}
        />
      )}
      {variants.map((item) => {
        const matrix = routingMatrix(evalRun, 'trace-grades', item.variant);
        return matrix ? (
          <ConfusionTable
            key={item.variant}
            caption={`Routing — trace-grades · ${item.variant}`}
            matrix={matrix}
          />
        ) : (
          <StatusNotice
            key={item.variant}
            level={3}
            state={notRunState({
              section: `${item.variant} 의 trace-grades routing`,
              runId: evalRun.sourceId,
              reason: '이 variant 의 채점한 trace routing 결과가 없습니다',
              collectProfile: 'eval',
              alternatives: null,
            })}
          />
        );
      })}
      {failures.length === 0 ? (
        <p className="text-text-light text-xsm">routing 이 틀리거나 미보고인 trace 가 없습니다.</p>
      ) : (
        <DataTable
          caption="Routing 실패·미보고 trace"
          headers={['trace', 'expected', 'selected', 'platform', 'package', 'failure category']}
        >
          {failures.map((trace) => (
            <tr key={trace.id}>
              <th scope="row">{trace.id}</th>
              <td>{trace.expectedPlatform}</td>
              <td>{trace.selectedPlatform ?? '미보고 (unreported)'}</td>
              <td>{correctText(trace.routing.platformCorrect)}</td>
              <td>{correctText(trace.routing.packageCorrect)}</td>
              <td>{trace.success.failureCategory ?? '없음'}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Section>
  );
};
