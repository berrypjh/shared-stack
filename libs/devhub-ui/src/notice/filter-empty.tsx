'use client';

import { useDevHubLink } from '../provider/devhub-provider';

/** 필터가 아무것도 남기지 않았을 때. 무엇이 없는지와 필터를 푸는 링크를 준다. */
export const FilterEmpty = ({
  message,
  clearHref,
  clearLabel = '필터 모두 해제',
}: {
  message: string;
  clearHref: string;
  clearLabel?: string;
}) => {
  const Link = useDevHubLink();
  return (
    <div
      role="status"
      className="flex flex-col gap-sm rounded-lg border border-dashed border-stroke-default p-xl typo-body-small"
    >
      <p>{message}</p>
      <Link to={clearHref} className="self-start text-text-link underline-offset-2 hover:underline">
        {clearLabel}
      </Link>
    </div>
  );
};
