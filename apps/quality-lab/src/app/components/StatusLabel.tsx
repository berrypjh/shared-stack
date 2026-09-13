import { Chip } from '@berrypjh/react-ui';

const ICON: Record<string, string> = {
  passed: '✓',
  pass: '✓',
  failed: '✕',
  fail: '✕',
  timeout: '⏱',
  'not-run': '–',
  unsupported: '⊘',
  skipped: '↷',
  todo: '…',
};

/** 상태 글과 장식 아이콘. 아이콘은 `Chip.leading` 이라 이름에 섞이지 않는다. */
export const StatusLabel = ({ tone, label }: { tone: string; label: string }) => (
  <Chip leading={<span aria-hidden>{ICON[tone] ?? '•'}</span>}>{label}</Chip>
);
