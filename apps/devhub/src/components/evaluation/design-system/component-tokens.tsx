import { DataTable } from '@berrypjh/devhub-ui';
import type { DesignSystem } from '@berrypjh/observability-contracts';

import { refText } from '@/lib/evaluation/design-system';

import { Mono } from '../mono';
import { Section } from '../section';

import { SourceRefLines } from './source-ref';

type Token = DesignSystem['componentTokens'][number];

const lineageText = ({ lineage }: Token) =>
  lineage.status === 'alias'
    ? `alias → ${lineage.references.join(', ')}`
    : lineage.status === 'unavailable'
      ? `unavailable — ${lineage.reason}`
      : 'literal';

const emittedText = ({ emitted }: Token) =>
  `catalog ${emitted.catalog ? '있음' : '없음'} · web ${emitted.web ?? '없음'} · rn ${emitted.rn ?? '없음'}`;

const TokenRow = ({ token }: { token: Token }) => (
  <tr>
    <th scope="row">
      <Mono>{token.path}</Mono>
    </th>
    <td>{token.cssVar ? <Mono>{token.cssVar}</Mono> : 'catalog 가 valid 가 아니라 없음'}</td>
    <td>
      {token.authored ? (
        <>
          {`${token.authored.rawValue} (${token.authored.type})`}
          <span className="block">
            <Mono>{refText(token.authored.source)}</Mono>
          </span>
        </>
      ) : (
        'authoring 원문 없음'
      )}
    </td>
    <td>{lineageText(token)}</td>
    <td>{emittedText(token)}</td>
    <td>{token.platformComparison}</td>
    <td>
      {token.documentedPolicy.policy}
      {token.documentedPolicy.source && (
        <span className="block">
          <Mono>{refText(token.documentedPolicy.source)}</Mono>
        </span>
      )}
    </td>
    <td>
      {token.consumers.length === 0 ? '소비 위치 없음' : <SourceRefLines refs={token.consumers} />}
    </td>
  </tr>
);

/** component token 의 authoring · lineage · 산출물 · 소비 위치. */
export const ComponentTokens = ({ ds }: { ds: DesignSystem }) => (
  <Section title="Component token">
    <DataTable
      caption="Component token 출처"
      headers={[
        'token',
        'cssVar',
        'authored',
        'lineage',
        'emitted (web · rn)',
        '플랫폼 비교',
        '문서 정책',
        '소비 위치',
      ]}
    >
      {ds.componentTokens.map((token) => (
        <TokenRow key={token.path} token={token} />
      ))}
    </DataTable>
  </Section>
);
