import type { AccessibilitySummary } from '@berrypjh/observability-contracts';

import { DataTable } from '../../components/DataTable';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { MANUAL_AREA_LABEL, manualStatusText } from '../../data/accessibility';

import { SourceFacts } from './SourceFacts';

/** 사람의 관찰. 자동 측정 결과와 다른 section 에 두고, 확인하지 않은 항목은 통과가 아니다. */
export const ManualSummary = ({ summary }: { summary: AccessibilitySummary | null }) => (
  <Section title="수동 확인 — 측정값 아님" anchor="manual">
    <p className="text-text-light text-xsm leading-xsm break-keep">
      keyboard 흐름·포커스 가시성·스크린리더·읽기 순서·복합 대비·Windows 고대비는 자동 검사로
      판정하지 않습니다. 아래는 사람이 남긴 관찰이고 위의 측정 결과와 섞지 않습니다.
    </p>
    {summary ? (
      <>
        <SourceFacts summary={summary} />
        <DataTable
          caption="수동 확인 기록"
          headers={['항목', '영역', '관찰', '메모', '환경', '관찰 시각']}
        >
          {summary.manual.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.label}</th>
              <td>{MANUAL_AREA_LABEL[item.area]}</td>
              <td>{manualStatusText(item.status)}</td>
              <td>{item.note ?? '없음'}</td>
              <td>{item.environment ?? '없음'}</td>
              <td>{item.checkedAt ?? '없음'}</td>
            </tr>
          ))}
        </DataTable>
      </>
    ) : (
      <StatusNotice
        level={3}
        state={{
          kind: 'unsupported',
          title: '이 실행에 수동 확인 기록이 없습니다',
          cause: '수동 확인 목록을 수집하지 않은 실행입니다. 기록이 없는 항목은 통과가 아닙니다.',
          commands: ['pnpm quality --base-url=http://localhost:4300'],
        }}
      />
    )}
  </Section>
);
