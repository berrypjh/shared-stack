/** Command 01 dataset과 같은 canonical platform class. */
export const PLATFORM_CLASSES = ['web', 'react-native', 'both', 'none'] as const;
export type PlatformClass = (typeof PLATFORM_CLASSES)[number];

/**
 * Runtime diagnostic class. canonical class에 `ambiguous`가 하나 더 있다.
 * `ambiguous`는 eval class가 아니므로 canonical로 매핑하지 않고 `null`로 남긴다 —
 * resolver가 추측하는 대신 라우팅을 거부한다는 뜻이다.
 */
export type PlatformDiagnosis = PlatformClass | 'ambiguous';

export const toCanonical = (diagnosis: PlatformDiagnosis): PlatformClass | null =>
  diagnosis === 'ambiguous' ? null : diagnosis;

/** 보정되지 않은 확률 대신 근거 기반 enum만 쓴다. */
export type Confidence = 'high' | 'medium' | 'low';

export type EvidenceKind =
  | 'prompt'
  | 'dependency'
  | 'dependency-absent'
  | 'target-file'
  | 'project-file'
  | 'conflict';

export type PlatformEvidence = {
  kind: EvidenceKind;
  /** 실제로 관측된 것 — 매칭된 표현, 의존성 이름, 파일 경로. */
  value: string;
  /** 그 관측을 신호로 만든 규칙 이름. 규칙이 자명하면 생략. */
  via?: string;
  /** 이 근거가 가리키는 플랫폼. 근거가 부재/충돌을 뜻하면 null. */
  signals: 'web' | 'react-native' | null;
};
