/**
 * 토큰 값을 눈으로 알아볼 수 있게 그린다.
 *
 * 종류마다 "본다"의 의미가 다르다 — 색은 면적, 간격은 길이, 반경은 모서리,
 * 크기는 실제 글자, 시간은 움직임이다. 값 문자열만으로는 감이 오지 않는 것을
 * 실제 값 그대로 렌더한다.
 *
 * 판별은 경로 세그먼트로 한다. `typography.body.large.fontSize` 처럼 잎에 붙는 경우와
 * `typography.fontSizes.lg` 처럼 중간에 붙는 경우가 둘 다 있기 때문이다.
 */

const SAMPLE = '가나 Ag';

const isColor = (v: string) => /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
const isLength = (v: string) => /^-?[\d.]+(rem|px|em)$/.test(v.trim());
const isDuration = (v: string) => /^[\d.]+m?s$/.test(v.trim());
const isEasing = (v: string) => /^(linear|ease(-in)?(-out)?|cubic-bezier\(|steps\()/.test(v.trim());
/** `0.375rem 1rem` 같은 padding 축약. 길이 2~4개가 공백으로 이어진 값. */
const isLengthList = (v: string) => {
  const parts = v.trim().split(/\s+/);
  return parts.length > 1 && parts.length <= 4 && parts.every(isLength);
};

const Track = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center h-[24px] w-[120px] bg-background-default rounded-xs px-xs">
    {children}
  </span>
);

const Text = ({ value, style }: { value: string; style: React.CSSProperties }) => (
  <span className="text-text-default leading-none" style={style} title={value}>
    {SAMPLE}
  </span>
);

export const TokenPreview = ({ path, value }: { path: string; value: string }) => {
  const segments = path.split('.');
  const category = segments[0];
  const has = (...names: string[]) => names.some((n) => segments.includes(n));

  if (isColor(value)) {
    return (
      <span
        className="inline-block w-[40px] h-[24px] rounded-xs border border-stroke-light"
        style={{ background: value }}
      />
    );
  }

  if (has('fontSize', 'fontSizes')) return <Text value={value} style={{ fontSize: value }} />;

  if (has('fontWeight', 'fontWeights'))
    return <Text value={value} style={{ fontWeight: value, fontSize: '0.875rem' }} />;

  if (has('fontFamily', 'fontFamilies'))
    return <Text value={value} style={{ fontFamily: value, fontSize: '0.875rem' }} />;

  if (has('letterSpacing', 'letterSpacings'))
    return <Text value={value} style={{ letterSpacing: value, fontSize: '0.75rem' }} />;

  if (has('lineHeight', 'lineHeights')) {
    return (
      <span
        className="inline-block text-text-default text-xxsm w-[120px]"
        style={{ lineHeight: value }}
        title={value}
      >
        가나다라
        <br />
        마바사아
      </span>
    );
  }

  if (category === 'radius' && isLength(value)) {
    return (
      <span
        className="inline-block w-[36px] h-[24px] bg-background-grey"
        style={{ borderRadius: value }}
      />
    );
  }

  if ((category === 'borderWidth' || has('width')) && isLength(value)) {
    return (
      <span
        className="inline-block w-[36px] h-[24px] rounded-xs border-stroke-dark"
        style={{ borderStyle: 'solid', borderWidth: value }}
      />
    );
  }

  if (isDuration(value) || isEasing(value)) {
    return (
      <Track>
        <span
          className="inline-block w-[10px] h-[10px] rounded-xs bg-background-primary token-motion"
          style={
            isEasing(value)
              ? { animationDuration: '1s', animationTimingFunction: value }
              : { animationDuration: value }
          }
        />
      </Track>
    );
  }

  if (isLengthList(value)) {
    // padding 축약은 안쪽 여백이 보여야 읽힌다.
    return (
      <span
        className="inline-block rounded-xs border border-stroke-light bg-background-default"
        style={{ padding: value }}
      >
        <span className="block w-[20px] h-[10px] rounded-xs bg-background-primary" />
      </span>
    );
  }

  if (isLength(value)) {
    // 간격·치수는 실제 길이 그대로 보여 줘야 크기 비교가 된다.
    return (
      <Track>
        <span
          className="inline-block h-[10px] rounded-xs bg-background-primary"
          style={{ width: value }}
        />
      </Track>
    );
  }

  return <span className="text-text-light text-xxsm">—</span>;
};
