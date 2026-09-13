import { useState } from 'react';

import { Button } from '@berrypjh/react-ui';

import { Mono } from './Mono';

/** 로컬에서 실행할 명령. 버튼은 클립보드에 복사만 한다 — 브라우저가 명령을 실행하지 않는다. */
export const CopyCommand = ({ command }: { command: string }) => {
  const [result, setResult] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setResult('copied');
    } catch {
      setResult('failed');
    }
  };

  return (
    <span className="flex flex-wrap items-center gap-sm">
      <Mono>{command}</Mono>
      <Button variant="text" size="sm" aria-label={`명령 복사: ${command}`} onClick={copy}>
        복사
      </Button>
      <span role="status" aria-live="polite" className="text-text-light text-xxsm">
        {result === 'copied'
          ? '복사했습니다'
          : result === 'failed'
            ? '복사할 수 없습니다 — 명령을 직접 선택하세요'
            : ''}
      </span>
    </span>
  );
};
