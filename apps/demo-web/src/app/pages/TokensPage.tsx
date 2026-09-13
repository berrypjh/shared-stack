import { useMemo, useState } from 'react';

import { Checkbox, Chip, SearchField, Table, TableScroll, Web } from '@berrypjh/react-ui';

import { cssVarOf } from '../presentation/tokenCatalog';
import { Mono, Page, Section } from '../shell/ui';

import { TokenPreview } from './TokenPreview';

/**
 * 토큰 탐색.
 *
 * 수백 개 swatch 를 나열하면 찾을 수 없다. 검색과 카테고리 필터를 앞에 두고,
 * 행은 이름 · 값 · CSS 변수 · 미리보기만 담아 조밀하게 만든다.
 * 세 열은 각각 끄고 켤 수 있다 — 값만 대조할 때와 눈으로 훑을 때 필요한 열이 다르다.
 */

/** `cssVar` 는 catalog 에 없으면 undefined 다 — 이름 규칙으로 지어내지 않는다. */
type Row = { path: string; value: string; cssVar: string | undefined; category: string };

type ColumnId = 'preview' | 'value' | 'cssVar';

const COLUMNS: { id: ColumnId; label: string; width: string }[] = [
  { id: 'value', label: '값', width: 'w-[160px]' },
  { id: 'cssVar', label: 'CSS 변수', width: 'w-[280px]' },
  { id: 'preview', label: '미리보기', width: 'w-[140px]' },
];

/**
 * 토큰 트리를 평탄한 행으로. `Web.Light.tokens` 는 ui-core 패스스루로 노출된다.
 *
 * CSS 변수는 **공개 token catalog 에서 읽는다.** 이전에는 경로에서 이름 규칙으로 유도했는데
 * 첫 세그먼트를 항상 떼는 방식이라 565개 중 281개가 실제 변수와 달랐다
 * (`spacing.md` → `--ds-md`, 실제는 `--ds-spacing-md`). 유도 규칙을 고치는 대신 생성된
 * artifact 를 믿는다 — Designer Token Inspector 와 같은 source 다.
 */
const flatten = (node: unknown, path: string[] = []): Row[] => {
  if (node === null || typeof node !== 'object') {
    const category = path[0] ?? '';
    const id = path.join('.');
    return [
      {
        path: id,
        value: String(node),
        cssVar: cssVarOf(id),
        category,
      },
    ];
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, [...path, k]),
  );
};

/** 정렬 가능한 값의 크기. 같은 차원끼리만 비교하려고 차원을 함께 돌려준다. */
const magnitude = (value: string): [dimension: string, size: number] | null => {
  const v = value.trim();
  const length = /^(-?[\d.]+)(rem|em|px)$/.exec(v);
  if (length) return ['length', Number(length[1]) / (length[2] === 'px' ? 16 : 1)];
  const time = /^([\d.]+)(ms|s)$/.exec(v);
  if (time) return ['time', Number(time[1]) * (time[2] === 's' ? 1000 : 1)];
  if (/^-?[\d.]+$/.test(v)) return ['number', Number(v)];
  return null;
};

const parentOf = (path: string) => path.slice(0, path.lastIndexOf('.'));

/**
 * 스케일 토큰을 작은 값에서 큰 값 순으로 놓는다.
 *
 * 이름 순으로 두면 `spacing.2xl` 이 `spacing.2xs` 앞에 와서 스케일이 읽히지 않는다.
 * 한 부모 아래 형제 값이 모두 같은 차원의 수치일 때만 정렬하고, 색처럼 비교할 수 없는
 * 값은 원래 순서를 지킨다 — `pr100 → pr900` 은 이미 맞는 순서다.
 */
const sortScales = (rows: Row[]): Row[] => {
  const out: Row[] = [];
  for (let i = 0; i < rows.length; ) {
    let j = i;
    while (j < rows.length && parentOf(rows[j].path) === parentOf(rows[i].path)) j += 1;
    const group = rows.slice(i, j).map((row) => ({ row, size: magnitude(row.value) }));
    const dimensions = new Set(group.map((g) => g.size?.[0]));
    const comparable = group.length > 1 && !dimensions.has(undefined) && dimensions.size === 1;
    if (comparable) group.sort((a, b) => (a.size?.[1] ?? 0) - (b.size?.[1] ?? 0));
    out.push(...group.map((g) => g.row));
    i = j;
  }
  return out;
};

const ALL: Row[] = sortScales(flatten(Web.Light.tokens));
const CATEGORIES = [...new Set(ALL.map((r) => r.category))].sort();

export const TokensPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [shown, setShown] = useState<ColumnId[]>(['preview', 'value', 'cssVar']);

  const isOn = (id: ColumnId) => shown.includes(id);
  const toggle = (id: ColumnId) =>
    setShown((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter(
      (r) =>
        (category === 'all' || r.category === category) &&
        (q === '' || r.path.toLowerCase().includes(q) || (r.cssVar ?? '').includes(q)),
    );
  }, [query, category]);

  return (
    <Page
      testId="tokens-page"
      title="Tokens"
      lead="이름이나 CSS 변수로 찾습니다. 값은 현재 테마 기준입니다."
    >
      <Section title="검색" note={`${rows.length} / ${ALL.length}개`}>
        <div className="flex flex-wrap gap-lg items-center mb-lg">
          <div className="flex-1 min-w-[240px]">
            {/*
              이름은 `inputProps` 로 준다. SearchField 의 나머지 prop 은 래퍼로 가고
              `inputProps` 만 native `<input>` 에 닿는다 — 보이는 라벨 없이 이름을 줄 곳이 거기다.
            */}
            <SearchField
              variant="boxed"
              fullWidth
              value={query}
              onValueChange={setQuery}
              clearable
              clearAriaLabel="검색어 지우기"
              placeholder="이름 또는 CSS 변수로 검색"
              inputProps={{ 'aria-label': '토큰 검색', 'data-testid': 'token-search' }}
            />
          </div>
          <div role="group" aria-label="카테고리" className="flex flex-wrap gap-xs">
            {['all', ...CATEGORIES].map((c) => (
              <Chip key={c} size="sm" selected={category === c} onClick={() => setCategory(c)}>
                {c === 'all' ? '전체' : c}
              </Chip>
            ))}
          </div>
        </div>

        <div
          role="group"
          aria-label="열 표시"
          data-testid="token-columns"
          className="flex flex-wrap gap-xs items-center mb-lg"
        >
          <span className="text-text-light text-xxsm mr-xs">표시</span>
          {/* 열은 서로 독립이라 checkbox 다. 카테고리(상호배타)와 컨트롤이 갈리는 것이 의도다. */}
          {COLUMNS.map((c) => (
            <Checkbox
              key={c.id}
              checked={isOn(c.id)}
              onChange={() => toggle(c.id)}
              data-testid={`token-column-${c.id}`}
            >
              {c.label}
            </Checkbox>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-text-light text-xsm py-2xl text-center">
            일치하는 토큰이 없습니다. 다른 이름으로 찾아보세요.
          </p>
        ) : (
          <TableScroll label="토큰 목록 표">
            <Table hiddenCaption>
              <caption>현재 테마 기준 토큰 이름 · 값 · CSS 변수 목록</caption>
              <thead>
                <tr className="text-text-light text-xxsm">
                  <th scope="col" className="text-left font-semiBold pb-md pr-lg">
                    토큰
                  </th>
                  {COLUMNS.filter((c) => isOn(c.id)).map((c) => (
                    <th
                      key={c.id}
                      scope="col"
                      className={`text-left font-semiBold pb-md pr-lg ${c.width}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 300).map((r) => (
                  <tr key={r.path} className="border-t border-stroke-light">
                    <td className="py-md pr-lg text-text-default align-middle">{r.path}</td>
                    {isOn('value') && (
                      <td className="py-md pr-lg align-middle font-mono text-xxsm text-text-light">
                        {r.value}
                      </td>
                    )}
                    {isOn('cssVar') && (
                      <td className="py-md pr-lg align-middle">
                        {/* catalog 에 없으면 지어내지 않고 없음을 표시한다. */}
                        <Mono>{r.cssVar ?? '—'}</Mono>
                      </td>
                    )}
                    {isOn('preview') && (
                      <td className="py-md pr-lg align-middle">
                        <TokenPreview path={r.path} value={r.value} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
        {rows.length > 300 && (
          <p className="text-text-light text-xxsm mt-lg">
            상위 300개만 보여줍니다. 검색어를 좁혀 주세요.
          </p>
        )}
      </Section>
    </Page>
  );
};

export default TokensPage;
