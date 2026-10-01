import { createElement, useMemo } from 'react';

import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import { useParams } from 'react-router-dom';

import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { EvaluationInspector } from '@/components/evaluation/evaluation-inspector';
import { HAS_AREA, MEASURES } from '@/components/evaluation/measures';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useHashFocus } from '@/components/evaluation/use-hash-focus';
import { runsWith, useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { SECTION_ICON } from '@/components/ui/view-icons';
import type { Evaluation } from '@/domain/model';
import { findEntity, findSection } from '@/lib/catalog/entities';
import { loadingState, partialState, staleState } from '@/lib/evaluation/status';

/** partial · stale 실행은 값 위에 그 상태를 먼저 말해 성공처럼 두지 않는다. */
const EvaluationView = ({ evaluation }: { evaluation: Evaluation }) => {
  const section = findSection('evaluation');
  const measure = MEASURES[evaluation.id];
  const area = useMemo(
    () => ({
      has: HAS_AREA[evaluation.kind],
      section: evaluation.title,
      collectProfile: evaluation.collectProfile,
    }),
    [evaluation],
  );
  const data = useRunData(measure.spec, area);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  const alternatives = runsWith(summaries, HAS_AREA[evaluation.kind], data.run?.metadata.runId);
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={section.title}
          icon={SECTION_ICON[section.id]}
          title={evaluation.title}
        />
        <p className="typo-body-small break-keep text-text-light">{evaluation.summary}</p>
        <RunBar data={data} />
        {data.view && <StatusNotice state={data.view} />}
        {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
        {data.run && data.run.metadata.state !== 'complete' && (
          <StatusNotice state={partialState(data.run.metadata.runId)} />
        )}
        {data.run && data.freshness && data.freshness.status !== 'fresh' && (
          <StatusNotice state={staleState(data.freshness, evaluation.collectProfile)} />
        )}
        {measure.intro && createElement(measure.intro)}
        {data.run && createElement(measure.render, { run: data.run, data, alternatives })}
      </WorkspaceFrame>
      <Inspector>
        <EvaluationInspector evaluation={evaluation} data={data} terms={measure.terms} />
      </Inspector>
    </>
  );
};

/**
 * `/evaluation/<id>`: 평가 항목 하나. 값은 고른 실행(`?run=`)의 공개 JSON 을 계약으로 검증해 그리고,
 * 옆 칸은 무엇을 재는지 · 고른 실행 · 측정을 정의하는 파일이다.
 */
export const EvaluationPage = () => {
  const { id = '' } = useParams();
  const section = findSection('evaluation');
  const entity = findEntity('evaluation', id);
  useDocumentTitle(entity ? `${entity.label} · ${section.title}` : `${section.title}에 없는 항목`);
  if (!entity || entity.section !== 'evaluation') {
    return <EntityNotFound section={placeOf(section)} id={id} />;
  }
  return <EvaluationView key={entity.id} evaluation={entity.record} />;
};
