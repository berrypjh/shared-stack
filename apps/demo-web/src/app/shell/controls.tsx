import { ReactNode } from 'react';

import { VisuallyHidden } from '@berrypjh/react-ui';

/**
 * 선택지가 많거나 늘어나는 축은 select 로 받는다.
 *
 * 테마는 `themes.ts`에 줄을 더하면 늘어난다 — 개수가 고정이 아니므로 segmented control 이
 * 맞지 않는다. 네이티브 select 는 개수와 무관하게 폭이 일정하고 모바일에서도 그대로 쓴다.
 *
 * 라벨은 폭에 따라 **표시 방식만** 갈린다 — md 이상에서는 보이는 글자, 그 아래에서는
 * `VisuallyHidden` 이다. 어느 쪽이든 select 의 접근 가능한 이름은 남는다.
 *
 * 예전에는 Tailwind `sr-only` 로 직접 숨겼다. 라이브러리에 같은 일을 하는 컴포넌트가 생긴
 * 뒤로는 그쪽을 쓴다 — 이 앱의 규칙("라이브러리에 있는 것을 손으로 다시 만들지 않는다")이
 * 접근성 기법에도 그대로 적용된다.
 */
export const SelectControl = <T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  testId: string;
}) => (
  <label className="flex items-center gap-md">
    <span className="hidden md:inline text-text-light text-xxsm whitespace-nowrap">{label}</span>
    <VisuallyHidden className="md:hidden">{label}</VisuallyHidden>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      data-testid={testId}
      className="px-md py-xs text-xxsm rounded-sm border border-stroke-default bg-background-surface text-text-default cursor-pointer focus:outline-none focus:border-stroke-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

/** 상태 한 줄. 색만으로 의미를 전달하지 않도록 점 + 텍스트를 함께 쓴다. */
export const StatusDot = ({ tone }: { tone: 'ok' | 'warn' | 'error' | 'idle' }) => {
  const color = {
    ok: 'bg-success-su600',
    warn: 'bg-warning-wa600',
    error: 'bg-error-er600',
    idle: 'bg-neutral-ne400',
  }[tone];
  return <span className={`inline-block w-1.5 h-1.5 rounded-xs shrink-0 ${color}`} aria-hidden />;
};

export const StatusRow = ({
  name,
  tone,
  status,
  detail,
  testId,
}: {
  name: ReactNode;
  tone: 'ok' | 'warn' | 'error' | 'idle';
  status: string;
  detail?: ReactNode;
  testId?: string;
}) => (
  // 결론(status)이 항상 오른쪽 끝 같은 자리에 오도록 폭을 고정한다. 보조 설명은 그 앞에 둔다.
  <div
    data-testid={testId}
    data-status={tone}
    className="flex items-baseline gap-md py-md border-t border-stroke-light first:border-t-0"
  >
    <span className="flex items-center gap-sm min-w-0 flex-1">
      <StatusDot tone={tone} />
      <span className="text-text-default text-xsm truncate">{name}</span>
    </span>
    {detail}
    <span className="text-text-light text-xxsm shrink-0 w-[72px] text-right">{status}</span>
  </div>
);
