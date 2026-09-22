'use client';

import { useState } from 'react';

import { Button, VisuallyHidden } from '@berrypjh/react-ui';

import { Icon } from '../ui/icon';

type Result = 'idle' | 'copied' | 'failed';

const MESSAGE: Record<Result, string> = {
  idle: '',
  copied: '복사했습니다',
  failed: '복사하지 못했습니다',
};

/**
 * 글 한 조각(경로 · 코드)을 클립보드로. 결과는 보조 기술에도 알린다(`role="status"`).
 * 클립보드는 보안 문맥에서만 되므로 실패하면 그렇다고 말한다.
 */
export const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [result, setResult] = useState<Result>('idle');
  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => setResult('copied'),
      () => setResult('failed'),
    );
  return (
    <span className="inline-flex items-center">
      <Button
        size="sm"
        variant="text"
        color="secondary"
        aria-label={label}
        title={label}
        onClick={copy}
      >
        <Icon name="copy" />
      </Button>
      <VisuallyHidden role="status">{MESSAGE[result]}</VisuallyHidden>
    </span>
  );
};
