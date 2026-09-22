import type { Catalog } from '../../domain/model';

export type StepCitation = {
  journeyId: string;
  journeyTitle: string;
  stepId: string;
  order: number;
  intent: string;
};

/** 문서를 근거로 드는 곳: 앱 · 패키지 · 도구, 그리고 흐름의 단계. 카탈로그의 `docs` 에서만 유도한다. */
export const citationsOf = (catalog: Catalog, documentId: string) => ({
  entities: [...catalog.applications, ...catalog.packages, ...catalog.tools]
    .filter((item) => item.docs.includes(documentId))
    .map((item) => item.id),
  steps: catalog.journeys.flatMap((journey) =>
    journey.steps.flatMap((step, index): StepCitation[] =>
      step.docs.includes(documentId)
        ? [
            {
              journeyId: journey.id,
              journeyTitle: journey.title,
              stepId: step.id,
              order: index + 1,
              intent: step.intent,
            },
          ]
        : [],
    ),
  ),
});
