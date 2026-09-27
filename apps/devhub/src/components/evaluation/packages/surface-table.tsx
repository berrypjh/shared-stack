import { DataTable } from '@berrypjh/devhub-ui';
import type { PackageSurface } from '@berrypjh/observability-contracts';

import { Mono } from '@/components/evaluation/mono';
import {
  binText,
  catalogText,
  presentText,
  SURFACE_HEADERS,
  tokensCopyText,
} from '@/lib/evaluation/packages';

/** 패키지 표면 요약 표. 선언한 exports 와 실제 산출물 수를 나눠 쓴다. */
export const SurfaceTable = ({ surfaces }: { surfaces: PackageSurface[] }) => (
  <DataTable caption="패키지 표면" headers={SURFACE_HEADERS}>
    {surfaces.map((surface) => (
      <tr key={surface.name}>
        <th scope="row">
          <Mono>{surface.name}</Mono>
        </th>
        <td>{surface.private ? '비공개 (private)' : '공개'}</td>
        <td>{surface.build}</td>
        <td>{presentText(surface.emitted)}</td>
        <td>{binText(surface.emittedBin)}</td>
        <td>{tokensCopyText(surface.tokensCopy)}</td>
        <td>{catalogText(surface.catalog)}</td>
        <td>{`${surface.tests.length}개 위치 · 실행 안 함`}</td>
      </tr>
    ))}
  </DataTable>
);
