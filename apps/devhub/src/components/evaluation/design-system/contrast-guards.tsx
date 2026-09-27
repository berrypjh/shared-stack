import { DataTable } from '@berrypjh/devhub-ui';
import type { DesignSystem } from '@berrypjh/observability-contracts';

import { refText } from '@/lib/evaluation/design-system';
import { CONTRAST_BASIS_LABEL } from '@/lib/evaluation/labels';

import { Mono } from '../mono';
import { Section } from '../section';

import { SourceRefLines } from './source-ref';

/** 대비 기준(WCAG 와 프로젝트 가드를 나눠 쓴다)과 source 와 어긋난 문서. */
export const ContrastGuards = ({ ds }: { ds: DesignSystem }) => (
  <Section title="대비 기준 · 문서 불일치">
    <DataTable caption="Contrast guard" headers={['guard', '설명', '기준', 'ratio', 'source']}>
      {ds.contrastGuards.map((guard) => (
        <tr key={guard.id}>
          <th scope="row">{guard.id}</th>
          <td>{guard.label}</td>
          <td>{CONTRAST_BASIS_LABEL[guard.basis]}</td>
          <td>{`${guard.ratio}:1`}</td>
          <td>
            <Mono>{refText(guard.source)}</Mono>
          </td>
        </tr>
      ))}
    </DataTable>
    {ds.findings.length === 0 ? (
      <p className="typo-body-small text-text-light">
        source 와 어긋난 문서를 찾지 못했다 (findings 0).
      </p>
    ) : (
      <DataTable caption="source 와 어긋난 문서" headers={['code', '내용', '문서', '근거']}>
        {ds.findings.map((finding) => (
          <tr key={finding.code + refText(finding.doc)}>
            <th scope="row">{finding.code}</th>
            <td>{finding.message}</td>
            <td>
              <Mono>{refText(finding.doc)}</Mono>
            </td>
            <td>
              <SourceRefLines refs={finding.evidence} />
            </td>
          </tr>
        ))}
      </DataTable>
    )}
  </Section>
);
