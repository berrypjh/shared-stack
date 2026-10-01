import { DataTable, Mono } from '@berrypjh/devhub-ui';
import {
  CONFUSION_PREDICTED,
  type ConfusionMatrix,
  type EvalRun,
} from '@berrypjh/observability-contracts';

import { type ConfusionCell, confusionGrid, routingMatrix } from '@/lib/evaluation/ai';
import { attemptName, failureTerm, PLATFORM_TERMS } from '@/lib/evaluation/glossary';

import { Section } from '../section';

const cellTone = (cell: ConfusionCell) =>
  cell.count === 0 ? '' : cell.diagonal ? 'bg-background-success/15' : 'bg-background-error/15';

const correctText = (value: boolean | null) =>
  value === null ? '보고 안 함' : value ? '맞음' : '틀림';

const platform = (value: string) => PLATFORM_TERMS[value] ?? value;

/** 정답 플랫폼(행) × 고른 플랫폼(열). 칸의 글이 곧 값이라 표와 차트가 같은 요소다. */
const ConfusionTable = ({ caption, matrix }: { caption: string; matrix: ConfusionMatrix }) => (
  <div className="flex flex-col gap-xs">
    <DataTable
      caption={caption}
      headers={['정답 ↓ · 고른 것 →', ...CONFUSION_PREDICTED.map(platform)]}
    >
      {confusionGrid(matrix).map((row) => (
        <tr key={row.expected}>
          <th scope="row">{platform(row.expected)}</th>
          {row.cells.map((cell) => (
            <td key={cell.predicted} data-count={cell.count} className={cellTone(cell)}>
              {cell.count}
              {cell.count > 0 && (
                <span className="typo-caption-small text-text-light">
                  {cell.diagonal ? ' 맞음' : ' 틀림'}
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </DataTable>
    <p className="typo-body-small text-text-default">
      {`${matrix.total}번 중 ${matrix.correct}번 맞음 · 보고 안 함 ${matrix.unreported}번 · 정확도 ${
        matrix.accuracy === null ? '계산할 수 없음' : `${(matrix.accuracy * 100).toFixed(1)}%`
      }`}
    </p>
  </div>
);

/**
 * variant 마다 정답 플랫폼과 고른 플랫폼을 맞대 본 표, 규칙 기반 판정기의 같은 표(있을 때만),
 * 그리고 틀렸거나 보고하지 않은 시도.
 */
export const Routing = ({ evalRun, variant }: { evalRun: EvalRun; variant?: string }) => {
  const variants = evalRun.variants.filter((item) => !variant || item.variant === variant);
  const resolver = routingMatrix(evalRun, 'deterministic-resolver', null);
  const failures = evalRun.traces.filter(
    (trace) => (!variant || trace.variant === variant) && trace.routing.platformCorrect !== true,
  );
  const labels = new Map(evalRun.variants.map((item) => [item.variant, item.label]));

  return (
    <Section title="variant 별 플랫폼 선택" anchor="routing">
      <p className="typo-body-small break-keep text-text-light">
        행은 과제의 정답 플랫폼, 열은 에이전트가 고른 플랫폼이다. 대각선(초록)이 맞은 시도,
        나머지(빨강)가 틀린 시도다. "보고 안 함" 은 끝낼 때 고른 플랫폼을 말하지 않은 시도다.
      </p>
      {variants.map((item) => {
        const matrix = routingMatrix(evalRun, 'trace-grades', item.variant);
        return (
          <Section key={item.variant} title={item.label} level={3}>
            {matrix ? (
              <ConfusionTable caption={`플랫폼 선택 — ${item.label}`} matrix={matrix} />
            ) : (
              <p className="typo-body-small text-text-default">
                이 variant 의 플랫폼 선택 결과가 없음.
              </p>
            )}
          </Section>
        );
      })}

      <Section title="틀렸거나 보고하지 않은 시도" level={3}>
        {failures.length === 0 ? (
          <p className="typo-body-small text-text-default">모든 시도가 플랫폼을 맞게 골랐음.</p>
        ) : (
          <DataTable
            caption="플랫폼을 틀렸거나 보고하지 않은 시도"
            headers={['시도', 'variant', '정답', '고른 플랫폼', '플랫폼', '패키지', '실패 원인']}
          >
            {failures.map((trace) => (
              <tr key={trace.id}>
                <th scope="row">{attemptName(trace)}</th>
                <td>{labels.get(trace.variant) ?? trace.variant}</td>
                <td>{platform(trace.expectedPlatform)}</td>
                <td>{trace.selectedPlatform ? platform(trace.selectedPlatform) : '보고 안 함'}</td>
                <td>{correctText(trace.routing.platformCorrect)}</td>
                <td>{correctText(trace.routing.packageCorrect)}</td>
                <td>
                  {trace.success.failureCategory
                    ? failureTerm(trace.success.failureCategory).label
                    : '없음'}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="비교용: 규칙 기반 판정기" level={3}>
        <p className="typo-body-small break-keep text-text-light">
          모델 없이 과제 문장과 프로젝트 의존성만 보고 플랫폼을 정하는 판정기다. 에이전트가 이보다
          못하면 자료나 안내가 부족하다는 뜻이다.
        </p>
        {resolver ? (
          <ConfusionTable caption="플랫폼 선택 — 규칙 기반 판정기" matrix={resolver} />
        ) : (
          <p className="typo-body-small break-keep text-text-default">
            이 실행에는 판정기 결과가 없음 — 판정기 결과(<Mono>routing.json</Mono>)를 평가 산출물
            폴더에 함께 둘 때만 생김.
          </p>
        )}
      </Section>
    </Section>
  );
};
