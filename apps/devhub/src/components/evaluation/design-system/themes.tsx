import { DataTable } from '@berrypjh/devhub-ui';
import type { DesignSystem } from '@berrypjh/observability-contracts';

import { ARTIFACT_KINDS, artifactMatrix } from '@/lib/evaluation/design-system';
import { ARTIFACT_STATUS_LABEL } from '@/lib/evaluation/labels';

import { Mono } from '../mono';
import { Section } from '../section';

import { SourceRef } from './source-ref';

const statusText = (status: string, reason: string | null) =>
  `${ARTIFACT_STATUS_LABEL[status] ?? status}${reason ? ` — ${reason}` : ''}`;

const listText = (items: string[]) => items.join(', ') || '없음';

/** 테마 × 생성 산출물 격자와 테마 등록부 연결. */
export const Themes = ({ ds }: { ds: DesignSystem }) => (
  <Section title="테마 · 생성 산출물">
    <p className="typo-body-small text-text-light">
      등록부 <Mono>{ds.registry.path}</Mono> 의 테마 순서다.
    </p>
    <DataTable caption="Theme × 생성 산출물" headers={['theme', 'selector', ...ARTIFACT_KINDS]}>
      {artifactMatrix(ds).map((row) => {
        const theme = ds.registry.themes.find((item) => item.name === row.theme);
        return (
          <tr key={row.theme}>
            <th scope="row">{row.theme}</th>
            <td>
              <Mono>{theme?.selector ?? ''}</Mono>
            </td>
            {row.cells.map((cell, index) => (
              <td key={ARTIFACT_KINDS[index]}>
                {cell ? (
                  <>
                    {statusText(cell.status, cell.reason)}
                    <span className="block">
                      <Mono>{cell.path}</Mono>
                    </span>
                  </>
                ) : (
                  '행 없음 — 수집기가 정의하지 않은 조합'
                )}
              </td>
            ))}
          </tr>
        );
      })}
    </DataTable>
    <DataTable caption="테마 등록부 연결" headers={['대상', '상태', '근거']}>
      <tr>
        <th scope="row">tokens.json catalog (resolved {ds.catalog.resolvedFor})</th>
        <td>
          {statusText(ds.catalog.status, null)}
          {ds.catalog.rowCount !== null && ` · ${ds.catalog.rowCount}행`}
          {ds.catalog.issues.map((issue) => (
            <span
              key={issue.code + issue.message}
              className="block"
            >{`${issue.code}: ${issue.message}`}</span>
          ))}
        </td>
        <td>
          <Mono>{ds.catalog.path}</Mono>
        </td>
      </tr>
      {ds.namespaces.map((namespace) => (
        <tr key={namespace.platform}>
          <th scope="row">{`${namespace.platform} namespace`}</th>
          <td>{`${statusText(namespace.status, null)} · ${listText(namespace.namespaces)}`}</td>
          <td>
            <Mono>{namespace.path}</Mono>
          </td>
        </tr>
      ))}
      <tr>
        <th scope="row">RN ThemeProvider mode</th>
        <td>
          {`${statusText(ds.rnProvider.status, null)} · ${listText(ds.rnProvider.modes)}`}
          <span className="block">{`빠진 테마: ${listText(ds.rnProvider.missingThemes)} · 등록부에 없는 mode: ${listText(ds.rnProvider.extraModes)}`}</span>
        </td>
        <td>
          <SourceRef value={ds.rnProvider.source} empty="source 위치 없음" />
        </td>
      </tr>
    </DataTable>
  </Section>
);
