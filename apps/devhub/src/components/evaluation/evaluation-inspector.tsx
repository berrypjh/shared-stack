import {
  Empty,
  Facts,
  InspectorHeader,
  InspectorSection,
  Pager,
  TermList,
} from '@berrypjh/devhub-ui';

import type { Evaluation } from '@/domain/model';
import { findSection } from '@/lib/catalog/entities';
import { EVALUATION_KIND } from '@/lib/catalog/labels';
import { shortSha } from '@/lib/evaluation/format';
import {
  FRESHNESS_LABEL,
  modelText,
  SOURCE_KIND_LABEL,
  STATE_LABEL,
} from '@/lib/evaluation/labels';
import { queryString } from '@/lib/evaluation/query';

import { SourceGroups, sourceSummary } from '../entity/inspector-parts';

import type { Terms } from './measures/types';
import type { RunData } from './use-run-data';

const OVERVIEW = { id: 'evaluation-overview', title: '개요', icon: 'overview' } as const;
const RUN = { id: 'evaluation-run', title: '고른 실행', icon: 'test' } as const;
const SOURCE = { id: 'evaluation-source', title: '소스', icon: 'source' } as const;

/** 실행 정보가 없을 때의 이유. 불러오는 중과 화면 상태를 섞지 않는다. */
const reasonOf = (data: RunData) => {
  if (data.loading) return '실행을 불러오는 중';
  if (data.view) return data.view.title;
  return '고른 실행이 없음';
};

/**
 * 평가 항목의 근거 칸: 무엇을 재는지, 고른 실행이 어디서 · 언제 · 무엇으로 수집됐는지와 build 스냅샷
 * 커밋과 같은 source 인지, 측정을 정의하는 파일. 이전 · 다음은 같은 묶음일 때만 고른 실행을 이어 간다.
 */
export const EvaluationInspector = ({
  evaluation,
  data,
  terms,
}: {
  evaluation: Evaluation;
  data: RunData;
  /** 본문 표의 컬럼 · 용어 뜻. 작업 흐름 단계의 "출력 컬럼"처럼 개요 아래에 둔다. */
  terms?: Terms;
}) => {
  const suffix = queryString({ run: data.query.run });
  const siblings = findSection('evaluation').entities.map((entity) => ({
    id: entity.id,
    label: entity.label,
    href:
      entity.section === 'evaluation' && entity.record.kind === evaluation.kind
        ? `${entity.href}${suffix}`
        : entity.href,
  }));
  const metadata = data.run?.metadata ?? null;
  // 평가 실행이 부른 모델. 모델 없이 채점한 실행(smoke 등)은 비어 있다.
  const models = [
    ...new Set((data.run?.evals ?? []).flatMap((evalRun) => modelText(evalRun.origin) ?? [])),
  ];
  return (
    <div className="flex flex-col divide-y divide-stroke-light">
      <InspectorHeader
        kind="평가"
        title={evaluation.title}
        pager={<Pager entities={siblings} current={evaluation.id} unit="평가 항목" />}
        sections={[OVERVIEW, RUN, SOURCE]}
        contentsLabel="평가 상세 목차"
      />

      <InspectorSection {...OVERVIEW}>
        <Facts
          facts={[
            { term: '묶음', detail: EVALUATION_KIND[evaluation.kind] },
            {
              term: '수집 profile',
              detail: <span className="devhub-code">{evaluation.collectProfile}</span>,
            },
            { term: '요약', detail: evaluation.summary },
          ]}
        />
        {terms && (
          <div className="mt-md flex flex-col gap-xs">
            <p className="typo-caption-small text-text-light">{terms.title}</p>
            <TermList items={terms.items} label={terms.title} />
          </div>
        )}
      </InspectorSection>

      <InspectorSection {...RUN} summary={metadata?.runId ?? data.selectedRunId ?? undefined}>
        {metadata ? (
          <Facts
            facts={[
              { term: '실행', detail: <span className="devhub-code">{metadata.runId}</span> },
              { term: '상태', detail: STATE_LABEL[metadata.state] ?? metadata.state },
              {
                term: 'profile',
                detail: <span className="devhub-code">{metadata.profile}</span>,
              },
              { term: '범위', detail: metadata.scope.join(' · ') },
              ...(models.length > 0
                ? [
                    {
                      term: '모델',
                      detail: <span className="devhub-code">{models.join(' · ')}</span>,
                    },
                  ]
                : []),
              {
                term: 'source',
                detail: (
                  <>
                    {SOURCE_KIND_LABEL[metadata.source.kind] ?? metadata.source.kind} ·{' '}
                    <span className="devhub-code">{shortSha(metadata.source.sha)}</span>
                    {metadata.source.dirty === true && ' · 커밋 안 된 변경 있음'}
                  </>
                ),
              },
              { term: '수집 끝', detail: metadata.collection.finishedAt ?? '수집 중' },
              ...(data.freshness
                ? [
                    {
                      term: '스냅샷 비교',
                      detail: (
                        <>
                          {FRESHNESS_LABEL[data.freshness.status]}
                          <span className="block typo-caption-small text-text-light">
                            {data.freshness.reason}
                          </span>
                        </>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        ) : (
          <Empty reason={reasonOf(data)} />
        )}
      </InspectorSection>

      <InspectorSection
        {...SOURCE}
        count={evaluation.sources.length}
        summary={sourceSummary(evaluation.sources)}
      >
        <SourceGroups refs={evaluation.sources} />
      </InspectorSection>
    </div>
  );
};
