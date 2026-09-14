import type { ConsumerEvalTask, Trace } from '../runner/schema';

export type RoutingGrade = {
  platformCorrect: boolean | null;
  packageCorrect: boolean | null;
  forbiddenPackagesUsed: string[];
  /** platform 'none' task에서만 의미가 있다. 그 외에는 null. */
  unnecessaryUiRouting: boolean | null;
};

const sameSet = (a: string[], b: string[]): boolean => {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((x) => right.has(x));
};

const touchesUiSurface = (trace: Trace): boolean =>
  (trace.selectedPackages ?? []).length > 0 ||
  trace.retrieved.some((id) => id.startsWith('package:') || id.startsWith('component:'));

/** expected platform/package 대비 실제 선택을 채점한다. 선택이 기록되지 않으면 null. */
export const gradeRouting = (task: ConsumerEvalTask, trace: Trace): RoutingGrade => {
  const selected = trace.selectedPackages;
  const forbidden = new Set(task.expected.forbiddenPackages);

  return {
    platformCorrect:
      trace.selectedPlatform === null ? null : trace.selectedPlatform === task.expected.platform,
    packageCorrect: selected === null ? null : sameSet(selected, task.expected.packages),
    forbiddenPackagesUsed:
      selected === null ? [] : [...new Set(selected.filter((p) => forbidden.has(p)))].sort(),
    unnecessaryUiRouting:
      task.expected.platform !== 'none' ? null : selected === null ? null : touchesUiSurface(trace),
  };
};
