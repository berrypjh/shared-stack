import { type ReactNode, useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import { StatusNotice } from './components/StatusNotice';
import { emptyState } from './data/status';
import { navItem, type NavPath } from './nav';

export { Mono } from './components/Mono';

/**
 * 한 화면. h1 과 설명은 NAV 에서 읽는다. 다른 화면에서 이동해 왔을 때만 h1 으로 포커스를 옮긴다 —
 * 첫 진입이나 같은 화면의 필터 변경은 포커스를 건드리지 않는다.
 */
export const Page = ({ path, children }: { path: NavPath; children: ReactNode }) => {
  const item = navItem(path);
  const heading = useRef<HTMLHeadingElement>(null);
  const location = useLocation();
  const arrivedByNavigation = useRef(location.key !== 'default');

  useEffect(() => {
    if (arrivedByNavigation.current) heading.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <header className="pb-lg mb-xl border-b border-stroke-light">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-text-default text-xxl leading-xxl font-bold tracking-tight"
        >
          {item.label}
        </h1>
        <p className="text-text-light text-sm leading-sm mt-sm break-keep">{item.lead}</p>
      </header>
      <div className="flex flex-col gap-xl">{children}</div>
    </div>
  );
};

/** 공개된 run 이 없을 때. 숫자 seed 를 두지 않고 수집·export 명령만 안내한다. */
export const EmptyRuns = ({ level = 3 }: { level?: 2 | 3 }) => (
  <StatusNotice state={emptyState()} level={level} />
);
