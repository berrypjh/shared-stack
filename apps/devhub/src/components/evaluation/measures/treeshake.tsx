import { LabeledSelect } from '@berrypjh/devhub-ui';

import { treeshakeGroups } from '@/lib/evaluation/bundles';

import { TreeshakeSection } from '../bundles/treeshake-section';
import { Section } from '../section';

import type { MeasureProps } from './types';

/** 트리셰이킹 진단: 심볼 하나만 import 한 번들의 raw · gzip 크기. package 필터는 표시만 바꾼다. */
export const Treeshake = ({ run, data, alternatives }: MeasureProps) => {
  const { query, setQuery } = data;
  const rows = run.bundles.filter((row) => row.method === 'treeshake-esbuild');
  const packages = [...new Set(rows.map((row) => row.package))];
  const inPackage = run.bundles.filter((row) => !query.package || row.package === query.package);
  return (
    <>
      {packages.length > 1 && (
        <Section title="비교 조건">
          <LabeledSelect
            label="패키지"
            value={query.package ?? ''}
            options={[
              { value: '', label: '전체' },
              ...packages.map((name) => ({ value: name, label: name })),
            ]}
            onChange={(value) => setQuery({ ...query, package: value || undefined })}
          />
        </Section>
      )}
      <TreeshakeSection
        run={run}
        groups={treeshakeGroups(inPackage)}
        filtered={query.package}
        alternatives={alternatives}
      />
    </>
  );
};
