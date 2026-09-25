import type {
  Catalog,
  ConsumerJourney,
  DocumentRef,
  ExecutionContext,
  JourneyStep,
  TestSuite,
} from '../../domain/model';

/**
 * 한 단계의 상세 정보 모델. 흐름 화면의 요약과 달리 근거(소스 · 테스트 · 문서 · 공백)를 모두 담는다.
 * 비는 섹션은 숨기지 않고 `empty` 에 이유를 둔다.
 */
export type StepInspection = {
  journey: ConsumerJourney;
  step: JourneyStep;
  order: number;
  context: ExecutionContext | undefined;
  next: { id: string; order: number; intent: string }[];
  tests: TestSuite[];
  documents: DocumentRef[];
  empty: { source: string; next: string; tests: string; documents: string };
};

export const inspectStep = (
  catalog: Catalog,
  journeyId: string,
  stepId: string,
): StepInspection | undefined => {
  const journey = catalog.journeys.find((j) => j.id === journeyId);
  const index = journey?.steps.findIndex((s) => s.id === stepId) ?? -1;
  if (!journey || index < 0) return undefined;
  const step = journey.steps[index];

  return {
    journey,
    step,
    order: index + 1,
    context: catalog.contexts.find((context) => context.id === step.context),
    next: step.next.flatMap((id) => {
      const at = journey.steps.findIndex((s) => s.id === id);
      return at < 0 ? [] : [{ id, order: at + 1, intent: journey.steps[at].intent }];
    }),
    tests: step.tests.flatMap((id) => catalog.tests.find((s) => s.id === id) ?? []),
    documents: step.docs.flatMap((id) => catalog.documents.find((doc) => doc.id === id) ?? []),
    empty: {
      source:
        step.status === 'documented-only'
          ? '저장소 밖에서 일어나는 단계라 저장소 소스가 없다 — 문서만 말한다'
          : '이 단계가 인용한 소스가 없다',
      next: '흐름의 끝이다',
      tests: '이 단계를 직접 확인하는 테스트 묶음이 카탈로그에 없다',
      documents: '이 단계를 설명하는 문서가 카탈로그에 없다',
    },
  };
};
