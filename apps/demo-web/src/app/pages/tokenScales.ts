import { resolveToken, tokenIdsInCategory } from '../presentation/tokenCatalog';

/**
 * 색 밖의 토큰을 문서 카드로 읽는 규칙.
 *
 * 색은 모양이 한 가지라 계열을 키에서 유도한다(`colorPalette.ts`). 여기는 종류마다 "본다"의
 * 뜻이 달라 — 간격은 길이, 반경은 모서리, 글자는 실제 글자, 그림자는 떠 있음 — 미리보기를 고를
 * 기준이 필요하다. 그래서 계열 prefix 와 미리보기 종류를 적는다. 목록이 낡는 것은 테스트가
 * 막는다: 색이 아닌 모든 토큰이 정확히 한 카드에 담기는지 확인한다.
 */

export type PreviewKind =
  | 'length'
  | 'radius'
  | 'borderWidth'
  | 'border'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'fontFamily'
  | 'textStyle'
  | 'shadow'
  | 'duration'
  | 'easing';

export type ScaleFamily = {
  /** 이 prefix 바로 아래 한 단계가 카드 하나다. */
  prefix: string;
  /** 섹션에 계열이 여럿일 때 붙이는 제목. */
  label?: string;
  preview: PreviewKind;
  /** 카드 하나가 잎 여러 개로 된 합성 토큰인지. 합성 토큰은 catalog 에 단일 CSS 변수가 없다. */
  composite?: boolean;
  /** 합성 카드를 정렬할 잎 이름. 없으면 artifact 순서를 지킨다. */
  sortBy?: string;
};

export type ScaleSection = { title: string; note: string; families: readonly ScaleFamily[] };

export type ScaleMember = { key: string; ids: readonly string[] };

export const SCALE_SECTIONS: readonly ScaleSection[] = [
  {
    title: 'Spacing',
    note: '여백과 간격. 막대 길이가 실제 값이다',
    families: [{ prefix: 'spacing', preview: 'length' }],
  },
  {
    title: 'Radius',
    note: '모서리 반경',
    families: [{ prefix: 'radius', preview: 'radius' }],
  },
  {
    title: 'Border',
    note: '테두리 두께 스케일과 역할별 테두리',
    families: [
      { prefix: 'borderWidth.primitive', label: 'primitive', preview: 'borderWidth' },
      { prefix: 'borderWidth.semantic', label: 'semantic', preview: 'borderWidth' },
      { prefix: 'border', label: 'role', preview: 'border', composite: true },
    ],
  },
  {
    title: 'Typography',
    note: '글자 스케일과 그것을 조합한 글자 스타일. 스타일은 합성 토큰이라 단일 변수가 없다',
    families: [
      { prefix: 'typography.fontSize', label: 'fontSize', preview: 'fontSize' },
      { prefix: 'typography.fontWeight', label: 'fontWeight', preview: 'fontWeight' },
      { prefix: 'typography.lineHeight', label: 'lineHeight', preview: 'lineHeight' },
      { prefix: 'typography.letterSpacing', label: 'letterSpacing', preview: 'letterSpacing' },
      { prefix: 'typography.fontFamilies', label: 'fontFamilies', preview: 'fontFamily' },
      ...['display', 'heading', 'paragraph', 'body', 'caption'].map((group) => ({
        prefix: `typography.${group}`,
        label: group,
        preview: 'textStyle' as const,
        composite: true,
        sortBy: 'fontSize',
      })),
    ],
  },
  {
    title: 'Elevation',
    note: '층을 합성한 그림자. 합성 토큰이라 단일 변수가 없다',
    families: [
      { prefix: 'shadow', label: 'shadow', preview: 'shadow', composite: true, sortBy: 'blur' },
      {
        prefix: 'elevation',
        label: 'elevation',
        preview: 'shadow',
        composite: true,
        sortBy: 'blur',
      },
    ],
  },
  {
    title: 'Motion',
    note: '움직임의 길이와 가속',
    families: [
      { prefix: 'motion.duration', label: 'duration', preview: 'duration' },
      { prefix: 'motion.easing', label: 'easing', preview: 'easing' },
    ],
  },
  {
    title: 'Component',
    note: '시맨틱으로 표현하지 못해 컴포넌트 층에 올린 값',
    families: [
      { prefix: 'component', label: 'component', preview: 'length' },
      { prefix: 'component.field', label: 'field', preview: 'length' },
      { prefix: 'component.field.height', label: 'field.height', preview: 'length' },
    ],
  },
];

/** 정렬 가능한 값의 크기. 같은 차원끼리만 비교하려고 차원을 함께 돌려준다. */
export const magnitude = (value: string): [dimension: string, size: number] | null => {
  const v = value.trim();
  const length = /^(-?[\d.]+)(rem|em|px)$/.exec(v);
  if (length) return ['length', Number(length[1]) / (length[2] === 'px' ? 16 : 1)];
  const time = /^([\d.]+)(ms|s)$/.exec(v);
  if (time) return ['time', Number(time[1]) * (time[2] === 's' ? 1000 : 1)];
  if (/^-?[\d.]+$/.test(v)) return ['number', Number(v)];
  return null;
};

export const valueOf = (id: string, theme: string): string | undefined => {
  const resolved = resolveToken(id, theme);
  return resolved.ok ? resolved.token.value : undefined;
};

const leafName = (id: string) => id.slice(id.lastIndexOf('.') + 1);

/** 모든 크기가 같은 차원일 때만 작은 값에서 큰 값 순으로. 비교할 수 없으면 원래 순서를 지킨다. */
const sortBySize = (
  members: ScaleMember[],
  sizeOf: (member: ScaleMember) => [string, number] | null,
): ScaleMember[] => {
  const sized = members.map((member) => ({ member, size: sizeOf(member) }));
  const dimensions = new Set(sized.map((s) => s.size?.[0]));
  if (dimensions.has(undefined) || dimensions.size !== 1) return members;
  return sized.sort((a, b) => (a.size?.[1] ?? 0) - (b.size?.[1] ?? 0)).map((s) => s.member);
};

const leafMembers = (ids: readonly string[], prefix: string, theme: string) =>
  sortBySize(
    ids
      .filter((id) => !id.slice(prefix.length + 1).includes('.'))
      .map((id) => ({ key: leafName(id), ids: [id] })),
    (member) => magnitude(valueOf(member.ids[0], theme) ?? ''),
  );

const compositeMembers = (
  ids: readonly string[],
  prefix: string,
  theme: string,
  sortBy: string | undefined,
) => {
  const byKey = new Map<string, string[]>();
  for (const id of ids) {
    const [key, ...rest] = id.slice(prefix.length + 1).split('.');
    if (rest.length === 0) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), id]);
  }
  const members = [...byKey].map(([key, memberIds]) => ({ key, ids: memberIds }));
  if (sortBy === undefined) return members;

  return sortBySize(members, (member) => {
    const sizes = member.ids
      .filter((id) => leafName(id) === sortBy)
      .map((id) => magnitude(valueOf(id, theme) ?? ''));
    if (sizes.length === 0 || sizes.some((s) => s === null)) return null;
    return [sizes[0]?.[0] ?? '', sizes.reduce((sum, s) => sum + (s?.[1] ?? 0), 0)];
  });
};

/** 계열의 카드 목록. 잎 계열은 토큰 하나가, 합성 계열은 prefix 아래 한 단계 묶음이 카드 하나다. */
export const membersOf = (family: ScaleFamily, theme: string): readonly ScaleMember[] => {
  const category = family.prefix.split('.')[0] ?? '';
  const ids = tokenIdsInCategory(category).filter((id) => id.startsWith(`${family.prefix}.`));
  return family.composite
    ? compositeMembers(ids, family.prefix, theme, family.sortBy)
    : leafMembers(ids, family.prefix, theme);
};

/** 합성 토큰의 잎을 이름으로 (`fontSize` → `2.25rem`). 글자 스타일은 이것이 곧 CSS 속성이다. */
export const leavesOf = (ids: readonly string[], theme: string): Record<string, string> =>
  Object.fromEntries(ids.map((id) => [leafName(id), valueOf(id, theme) ?? '']));

/**
 * 그림자 층을 `box-shadow` 값으로. 층 key 는 잎 바로 위 경로다 — `shadow.xs.1.blur` 는
 * `shadow.xs.1` 층, 층이 하나뿐인 `shadow.inner.blur` 는 `shadow.inner` 층이다.
 */
export const shadowLayers = (ids: readonly string[], theme: string): readonly string[] => {
  const layers = new Map<string, string[]>();
  for (const id of ids) {
    const layer = id.slice(0, id.lastIndexOf('.'));
    layers.set(layer, [...(layers.get(layer) ?? []), id]);
  }
  return [...layers.values()].map((layerIds) => {
    const p = leavesOf(layerIds, theme);
    const inset = p.type === 'innerShadow' ? 'inset ' : '';
    return `${inset}${p.offsetX} ${p.offsetY} ${p.blur} ${p.spread} ${p.color}`;
  });
};
