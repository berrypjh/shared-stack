/**
 * 색 토큰을 팔레트로 읽는 규칙.
 *
 * primitive 램프와 시맨틱 역할은 **키 모양으로 구분한다** — 계열 이름 목록을 손으로 적으면
 * 토큰에 계열이 늘 때 이 파일만 낡는다. 램프 단계는 `ne100` 처럼 두 글자 + 세 자리이고,
 * 시맨틱 역할은 `default` · `surface` 처럼 단어다.
 *
 * 순서는 artifact 가 정한 id 순서를 그대로 쓴다. 램프 단계는 자릿수가 같아 사전순이 곧
 * 단계순이다 (`ne100` → `ne900`).
 */

const RAMP_STEP = /^[a-z]{2}\d{3}$/;

export type PaletteFamilyKind = 'ramp' | 'semantic';

export type PaletteEntry = {
  /** 전체 token id. 복사·조회의 기준이다. */
  id: string;
  /** 계열 안에서의 키 (`ne100`, `default`). 화면에 보이는 이름이다. */
  key: string;
};

export type PaletteFamily = {
  name: string;
  kind: PaletteFamilyKind;
  entries: readonly PaletteEntry[];
};

/**
 * `color.<family>.<...key>` id 목록을 계열별로 묶는다.
 *
 * 키가 두 단계 이상인 경우(`color.field.focusRingPrimary` 는 한 단계)에도 첫 세그먼트를
 * 계열로 보고 나머지를 키로 합친다 — 지금 색 토큰은 모두 두 단계지만 규칙을 좁히지 않는다.
 */
export const colorFamilies = (tokenIds: readonly string[]): readonly PaletteFamily[] => {
  const byFamily = new Map<string, PaletteEntry[]>();

  for (const id of tokenIds) {
    const [, family, ...rest] = id.split('.');
    if (family === undefined || rest.length === 0) continue;
    const entries = byFamily.get(family) ?? [];
    entries.push({ id, key: rest.join('.') });
    byFamily.set(family, entries);
  }

  return [...byFamily].map(([name, entries]) => ({
    name,
    kind: entries.every((e) => RAMP_STEP.test(e.key)) ? 'ramp' : 'semantic',
    entries,
  }));
};

export const rampsOf = (families: readonly PaletteFamily[]): readonly PaletteFamily[] =>
  families.filter((f) => f.kind === 'ramp');

export const semanticOf = (families: readonly PaletteFamily[]): readonly PaletteFamily[] =>
  families.filter((f) => f.kind === 'semantic');
