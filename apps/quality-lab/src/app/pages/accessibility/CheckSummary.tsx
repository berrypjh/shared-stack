import type { AccessibilitySummary } from '@berrypjh/observability-contracts';

import { DataTable } from '../../components/DataTable';
import { Mono } from '../../components/Mono';
import { StatusLabel } from '../../components/StatusLabel';
import {
  casesText,
  CHECK_KIND_LABEL,
  CHECK_STATUS_LABEL,
  CHECK_TONE,
  SOURCE_SCOPE_LABEL,
  thresholdText,
} from '../../data/accessibility';

/** token pair·CSS 텍스트·UI test 결과. case 결과만 옮기고 새 판정을 만들지 않는다. */
export const CheckSummary = ({ summary }: { summary: AccessibilitySummary }) => (
  <DataTable
    caption={`${SOURCE_SCOPE_LABEL[summary.sourceScope]} 결과`}
    headers={['검사', '종류', '상태', '기준', 'case', '근거', '이유']}
  >
    {summary.checks.map((check) => (
      <tr key={check.id}>
        <th scope="row">
          {check.label}
          <span className="block">
            <Mono>{check.id}</Mono>
          </span>
        </th>
        <td>{CHECK_KIND_LABEL[check.kind]}</td>
        <td>
          <StatusLabel tone={CHECK_TONE[check.status]} label={CHECK_STATUS_LABEL[check.status]} />
        </td>
        <td>{thresholdText(check.threshold)}</td>
        <td>{casesText(check.cases)}</td>
        <td>
          {check.evidence.map((location) => (
            <span key={`${location.path}:${location.line}`} className="block">
              <Mono>{location.line ? `${location.path}:${location.line}` : location.path}</Mono>
            </span>
          ))}
        </td>
        <td>{check.reason ?? '없음'}</td>
      </tr>
    ))}
  </DataTable>
);
