/** 표시용 문장. 색만으로 상태를 전하지 않도록 모든 상태·값을 글로 만든다. */

const AVAILABILITY_LABELS: Record<string, string> = {
  available: '측정됨',
  'not-run': '실행 안 함',
  unsupported: '지원 안 함',
  unavailable: '값 없음',
  'permission-required': '권한 필요',
  'not-measured': '측정 안 함',
  'not-applicable': '해당 없음',
  invalid: '검증 실패',
};

export const availabilityLabel = (availability: string) =>
  AVAILABILITY_LABELS[availability] ?? availability;

const integer = new Intl.NumberFormat('en-US');

/** 바이트와 십진 KB. size-limit 의 한도(`'11 KB'` = 11000 B)와 같은 단위다. */
export const formatBytes = (bytes: number) =>
  bytes === 0 ? '0 B' : `${integer.format(bytes)} B (${(bytes / 1000).toFixed(2)} KB)`;

/** limit − current 를 글로. 음수는 초과다. */
export const headroomText = (headroomBytes: number | null) => {
  if (headroomBytes === null) return '판정 없음';
  if (headroomBytes === 0) return '0 B 남음 (한도와 같음)';
  return headroomBytes > 0
    ? `${integer.format(headroomBytes)} B 남음`
    : `${integer.format(-headroomBytes)} B 초과`;
};

type ValueLike = {
  availability: string;
  unit: string;
  value: number | null;
  denominator: number | null;
  reason: string | null;
};

const withReason = (label: string, reason: string | null) =>
  reason ? `${label} — ${reason}` : label;

/** 값이 있으면 단위와 함께, 없으면 dash 대신 상태 이름과 이유를 준다. */
export const observationValueText = ({
  availability,
  unit,
  value,
  denominator,
  reason,
}: ValueLike) => {
  if (availability !== 'available' || value === null)
    return withReason(availabilityLabel(availability), reason);
  switch (unit) {
    case 'ratio':
      return `${(value * 100).toFixed(1)}% (${integer.format(denominator ?? 0)} 중)`;
    case 'bytes':
    case 'bytes-delta':
      return formatBytes(value);
    case 'tokens':
    case 'tokens-delta':
      return `${integer.format(value)} tokens`;
    case 'ms':
      return `${value} ms`;
    default:
      return integer.format(value);
  }
};

/** 출처가 붙은 count. 0 은 0 이고 null 은 이유다. */
export const countText = ({ value, reason }: { value: number | null; reason: string | null }) =>
  value === null ? withReason('측정 안 됨', reason) : integer.format(value);

export const bundleRoleLabel = (role: string) =>
  role === 'budget' ? 'budget' : '진단 (보고 전용)';

export const shortSha = (sha: string) => (/^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : sha);
