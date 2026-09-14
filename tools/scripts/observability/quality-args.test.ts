import { describe, expect, it } from 'vitest';

import { QualityArgsError } from './audit';
import { parseQualityCommand } from './quality-args';

const now = () => new Date('2026-09-13T12:00:00.000Z');

describe('parseQualityCommand — pnpm quality 의 두 가지 일', () => {
  it('--run-id 만 있으면 baseline 포인터를 만든다', () => {
    expect(parseQualityCommand(['--run-id=local-quality-01'], now)).toEqual({
      mode: 'baseline',
      runId: 'local-quality-01',
      replace: false,
    });
    expect(parseQualityCommand(['--run-id=local-quality-01', '--replace-baseline'], now)).toEqual({
      mode: 'baseline',
      runId: 'local-quality-01',
      replace: true,
    });
  });

  it('--base-url 이 있으면 localhost 접근성 audit 이다', () => {
    expect(parseQualityCommand(['--base-url=http://localhost:4300'], now)).toEqual({
      mode: 'audit',
      baseUrl: 'http://localhost:4300',
      runId: 'a11y-20260913-1200',
    });
  });

  it('섞이거나 빠진 인자는 거부한다', () => {
    for (const argv of [
      [],
      ['--replace-baseline'],
      ['--run-id=../x'],
      ['--base-url=http://localhost:4300', '--replace-baseline'],
      ['--run-id=a', '--run-id=b'],
    ]) {
      expect(() => parseQualityCommand(argv, now)).toThrow(QualityArgsError);
    }
  });
});
