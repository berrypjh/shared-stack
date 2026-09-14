import { useId } from 'react';

import { List, ListItem } from '@berrypjh/react-ui';

export type Bar = {
  key: string;
  label: string;
  value: number | null;
  /** 막대 100% 의 값. 호출자가 같은 조건 안에서만 정한다. */
  scale: number | null;
  /** 한도 같은 기준선. */
  marker?: number | null;
  tone?: 'default' | 'over';
  /** 막대 옆에 늘 보이는 값 글. hover 없이 읽힌다. */
  text: string;
};

export type BarGroup = { label: string; bars: Bar[] };

const percent = (value: number, scale: number) => ((value / scale) * 100).toFixed(2);

const BarRow = ({ bar }: { bar: Bar }) => {
  const { value, scale, marker } = bar;
  const drawable = value !== null && scale !== null && scale > 0;
  return (
    <ListItem
      data-key={bar.key}
      data-value={value ?? 'null'}
      className="grid grid-cols-1 sm:grid-cols-[minmax(8rem,16rem)_minmax(6rem,1fr)_auto] items-center gap-x-sm gap-y-xs"
    >
      <span className="text-text-default text-xsm break-all">{bar.label}</span>
      {drawable ? (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="w-full h-[10px] overflow-visible"
        >
          <rect x="0" y="0" width="100" height="10" className="fill-background-default" />
          <rect
            data-fill
            data-tone={bar.tone ?? 'default'}
            x="0"
            y="0"
            width={percent(value, scale)}
            height="10"
            className={bar.tone === 'over' ? 'fill-text-error' : 'fill-text-link'}
          />
          {marker !== null && marker !== undefined && (
            <line
              data-marker
              x1={percent(marker, scale)}
              x2={percent(marker, scale)}
              y1="-2"
              y2="12"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="stroke-text-default"
            />
          )}
        </svg>
      ) : (
        <span aria-hidden="true" className="text-text-light text-xxsm">
          막대 없음
        </span>
      )}
      <span className="text-text-default text-xsm font-mono break-keep">{bar.text}</span>
    </ListItem>
  );
};

/**
 * 가로 막대. 막대마다 이름과 값 글이 보이고, 값이 없으면 0 막대나 빈 track 을 그리지 않는다.
 * 같은 데이터의 표는 호출자가 둔다 — SVG 는 장식이라 보조기술에 숨긴다.
 */
export const BarChart = ({
  title,
  description,
  unit,
  groups,
}: {
  title: string;
  description: string;
  unit: string;
  groups: BarGroup[];
}) => {
  const id = useId();
  return (
    <figure
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="m-0 flex flex-col gap-sm"
    >
      <figcaption className="flex flex-col gap-xs">
        <span id={`${id}-title`} className="text-text-default text-sm leading-sm font-semiBold">
          {title}
        </span>
        <span
          id={`${id}-description`}
          className="text-text-light text-xsm leading-xsm break-keep"
        >{`${description} · 단위 ${unit}`}</span>
      </figcaption>
      {groups.map((group) => (
        <div
          key={group.label}
          role="group"
          aria-label={group.label}
          className="flex flex-col gap-xs"
        >
          <span aria-hidden="true" className="text-text-light text-xxsm font-semiBold">
            {group.label}
          </span>
          <List className="flex flex-col gap-xs">
            {group.bars.map((bar) => (
              <BarRow key={bar.key} bar={bar} />
            ))}
          </List>
        </div>
      ))}
    </figure>
  );
};
