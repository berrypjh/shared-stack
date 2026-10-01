import type { ReactNode } from 'react';

import { INSPECTOR_ID } from './workspace';

/**
 * 오른쪽 칸: 고른 대상의 근거. `lg` 미만에서는 본문 뒤에 쌓인다.
 * 내용은 page 가 채운다. 고른 것이 없으면 무엇이 올지 한 줄로 말한다.
 */
export const Inspector = ({ children }: { children?: ReactNode }) => (
  <aside
    id={INSPECTOR_ID}
    tabIndex={-1}
    aria-label="상세 정보"
    className="relative border-t border-stroke-light bg-background-surface lg:overflow-y-auto lg:border-t-0 lg:border-l"
  >
    <div className="p-lg pb-4xl">
      {children ?? (
        <p className="typo-body-small text-text-light">
          탐색기에서 항목을 고르면 근거가 여기에 나옵니다.
        </p>
      )}
    </div>
  </aside>
);
