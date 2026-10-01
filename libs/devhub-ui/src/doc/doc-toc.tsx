'use client';

import { useEffect, useState } from 'react';

import type { OutlineItem } from '../markdown/outline';

/**
 * "이 페이지에서" 목록. 절 제목으로 가는 페이지 안 링크다. 스크롤하면 읽고 있는 절(화면 위 1/4 에
 * 들어온 제목)을 `aria-current="location"` 으로 표시한다.
 */
export const DocToc = ({ items }: { items: OutlineItem[] }) => {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '0px 0px -75% 0px' },
    );
    for (const { id } of items) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <ol className="flex flex-col border-l border-stroke-light">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={item.id === active ? 'location' : undefined}
            className="-ml-px block border-l-2 border-transparent py-xs pl-md typo-caption-small text-text-light hover:text-text-default aria-[current=location]:border-stroke-primary aria-[current=location]:typo-body-small-strong aria-[current=location]:text-text-default"
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
};
