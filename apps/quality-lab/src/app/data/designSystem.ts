/**
 * design-system 근거를 격자로. 셀의 근거 종류는 수집기의 `observationKind` 그대로이고,
 * source 참조만으로 tested 를 붙이지 않는다.
 */
import {
  type DesignSystem,
  type DesignSystemSignal,
  DS_PLATFORMS,
  OBSERVATION_KINDS,
  SIGNAL_STATES,
} from '@berrypjh/observability-contracts';

export const SIGNAL_KIND_LABEL: Record<(typeof OBSERVATION_KINDS)[number], string> = {
  declared: '선언만 확인 · 소비 근거 없음',
  consumed: '소비 확인 · test 근거 없음',
  tested: 'test 위치 있음 · 실행 안 함',
  unknown: '근거를 찾지 못함',
  'not-applicable': '해당 없음',
};

export type StateColumn = {
  state: DesignSystemSignal['state'];
  platform: DesignSystemSignal['platform'];
};

/**
 * 열은 상태 어휘 × 플랫폼 중 신호가 있는 것만, 행은 수집 순서의 component 다.
 * 셀이 null 이면 수집기가 그 조합을 정의하지 않은 것이고, unknown 과 다르다.
 */
export const stateMatrix = (signals: DesignSystemSignal[]) => {
  const find = (component: string, { state, platform }: StateColumn) =>
    signals.find(
      (signal) =>
        signal.component === component && signal.state === state && signal.platform === platform,
    ) ?? null;
  const columns = SIGNAL_STATES.flatMap((state) =>
    DS_PLATFORMS.map((platform) => ({ state, platform })),
  ).filter((column) =>
    signals.some((signal) => signal.state === column.state && signal.platform === column.platform),
  );
  const components = [...new Set(signals.map((signal) => signal.component))];
  return {
    columns,
    rows: components.map((component) => ({
      component,
      cells: columns.map((column) => find(component, column)),
    })),
  };
};

type Artifact = DesignSystem['artifacts'][number];

export const ARTIFACT_KINDS: Artifact['kind'][] = ['web-tokens', 'rn-tokens', 'css'];

/** registry 테마 순서 × 산출물 종류. 산출물 행이 없으면 null 이다. */
export const artifactMatrix = (designSystem: DesignSystem) =>
  designSystem.registry.themes.map((theme) => ({
    theme: theme.name,
    cells: ARTIFACT_KINDS.map(
      (kind) =>
        designSystem.artifacts.find(
          (artifact) => artifact.theme === theme.name && artifact.kind === kind,
        ) ?? null,
    ),
  }));
