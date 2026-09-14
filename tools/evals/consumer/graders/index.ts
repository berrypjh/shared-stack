import type { ConsumerEvalTask, Trace } from '../runner/schema';

import { gradePublicImport, type PackageSurface, type PublicImportGrade } from './public-import';
import { DEFAULT_K, gradeRetrieval, type RetrievalGrade } from './retrieval';
import { gradeRouting, type RoutingGrade } from './routing';
import { gradeTaskSuccess, type TaskSuccessGrade } from './task-success';
import { gradeVerification, type VerificationGrade } from './verification';

export type TaskGrade = {
  routing: RoutingGrade;
  retrieval: RetrievalGrade;
  publicImport: PublicImportGrade;
  verification: VerificationGrade;
  success: TaskSuccessGrade;
};

export type GradeOptions = { surfaces: PackageSurface[]; k?: number };

/** 모든 deterministic grader를 한 trace에 적용한다. */
export const gradeTask = (
  task: ConsumerEvalTask,
  trace: Trace,
  { surfaces, k = DEFAULT_K }: GradeOptions,
): TaskGrade => {
  const routing = gradeRouting(task, trace);
  const retrieval = gradeRetrieval(task, trace, k);
  const publicImport = gradePublicImport(trace.changedFiles, surfaces);
  const verification = gradeVerification(task, trace);
  const success = gradeTaskSuccess({ trace, routing, retrieval, publicImport, verification });
  return { routing, retrieval, publicImport, verification, success };
};

export * from './public-import';
export * from './retrieval';
export * from './routing';
export * from './task-success';
export * from './verification';
