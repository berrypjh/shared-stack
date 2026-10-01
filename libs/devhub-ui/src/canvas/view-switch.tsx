'use client';

import { type ReactNode, useState } from 'react';

import { SegmentControl } from '@berrypjh/react-ui';

type Mode = 'canvas' | 'list';

const OPTIONS = [
  { value: 'canvas', label: '그림' },
  { value: 'list', label: '목록' },
] as const;

/**
 * 그림과 목록 중 하나를 고른다. 둘은 같은 정보를 담고, 고른 쪽만 그린다(그림이 돌아오면 다시 맞춘다).
 * 선택은 이 화면의 상태다 — 항목을 골라도 화면이 남아 있어 유지된다. `tools`(필터)는 같은 줄 왼쪽에 선다.
 */
export const ViewSwitch = ({
  label,
  canvas,
  list,
  tools,
}: {
  label: string;
  canvas: ReactNode;
  list: ReactNode;
  tools?: ReactNode;
}) => {
  const [mode, setMode] = useState<Mode>('canvas');
  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-end justify-between gap-md">
        {tools}
        <SegmentControl
          aria-label={`${label} 보기 방식`}
          value={mode}
          onChange={setMode}
          options={OPTIONS}
          className="max-w-48"
        />
      </div>
      {mode === 'canvas' ? canvas : list}
    </div>
  );
};
