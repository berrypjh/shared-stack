import { DataTable } from '@berrypjh/devhub-ui';
import type { AxeRule } from '@berrypjh/observability-contracts';

import { LINK } from '@/components/ui/entity-link';
import { IMPACT_LABEL } from '@/lib/evaluation/accessibility';

import { NodeToggle } from './node-toggle';

/** axe rule 표. 비어 있으면 0개라는 것을 글로 쓴다. */
export const RuleTable = ({
  caption,
  rules,
  empty,
}: {
  caption: string;
  rules: AxeRule[];
  empty: string;
}) =>
  rules.length === 0 ? (
    <p className="typo-body-small text-text-default">{empty}</p>
  ) : (
    <DataTable caption={caption} headers={['rule', 'impact', 'node 수', '설명', 'tag', '노드']}>
      {rules.map((rule) => (
        <tr key={rule.id}>
          <th scope="row">{rule.id}</th>
          <td>{IMPACT_LABEL[rule.impact]}</td>
          <td>{rule.nodeCount}</td>
          <td>
            {rule.help}
            {rule.helpUrl && (
              <a className={`block ${LINK}`} href={rule.helpUrl}>
                {`${rule.id} 규칙 설명`}
              </a>
            )}
          </td>
          <td>{rule.tags.join(', ')}</td>
          <td>
            <NodeToggle rule={rule} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
