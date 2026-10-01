/** 용어 하나와 그 뜻 한 줄. 명령 옵션(`--split`) · 출력 컬럼(`raw`) 같은 코드 이름을 쓴다. */
export type TermItem = { term: string; meaning: string };

/**
 * 코드 이름과 뜻의 목록. 좁은 칸에서도 읽히게 이름 아래에 뜻을 둔다. `label` 은 목록 전체의 이름이다
 * (`dl` 은 이름을 받는 role 이 없고 role 을 덮으면 `dt` · `dd` 가 목록에서 떨어져, 감싸는 `group` 이 이름을 갖는다).
 * `CommandList` 와 같은 테두리 · 구분선이라 둘을 나란히 두면 한 묶음으로 읽힌다.
 */
export const TermList = ({ items, label }: { items: readonly TermItem[]; label: string }) => (
  <div
    role="group"
    aria-label={label}
    className="rounded-sm border border-stroke-light bg-background-default"
  >
    <dl className="divide-y divide-stroke-light">
      {items.map((item) => (
        <div key={item.term} className="px-sm py-xs">
          <dt className="devhub-code">{item.term}</dt>
          <dd className="typo-caption-small text-text-light">{item.meaning}</dd>
        </div>
      ))}
    </dl>
  </div>
);
