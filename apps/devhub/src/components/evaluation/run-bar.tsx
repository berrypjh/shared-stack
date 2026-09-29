import { Button } from '@berrypjh/react-ui';

import { VIEW_STATE_LABEL } from '@/lib/evaluation/status';

import { LabeledSelect } from './labeled-select';
import type { RunData } from './use-run-data';

/**
 * 모든 실행 화면 머리의 실행 선택. 데이터를 다시 읽는 동안에도 자리를 지켜 포커스를 잃지 않고,
 * 결과는 polite 상태로 알린다.
 */
export const RunBar = ({ data }: { data: RunData }) => {
  const message = data.loading
    ? '실행을 불러오는 중'
    : data.view
      ? `${VIEW_STATE_LABEL[data.view.kind]}: ${data.view.title}`
      : data.selectedRunId
        ? `${data.selectedRunId} 실행을 불러왔음`
        : '';

  return (
    <div className="flex flex-wrap items-end gap-md" aria-busy={data.loading}>
      {data.runIds.length > 0 && data.selectedRunId && (
        <LabeledSelect
          label="실행"
          value={data.selectedRunId}
          options={data.runIds.map((id) => ({ value: id, label: id }))}
          onChange={data.selectRun}
        />
      )}
      <Button variant="outlined" size="sm" onClick={data.reload} disabled={data.loading}>
        다시 불러오기
      </Button>
      <p role="status" aria-live="polite" className="typo-caption-small text-text-light">
        {message}
      </p>
    </div>
  );
};
