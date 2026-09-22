import type { OutlineItem } from '../markdown/outline';

/** "이 페이지에서" 목록. 절 제목으로 가는 페이지 안 링크다. */
export const DocToc = ({ items }: { items: OutlineItem[] }) => (
  <ol className="flex flex-col border-l border-stroke-light">
    {items.map((item) => (
      <li key={item.id}>
        <a
          href={`#${item.id}`}
          className="-ml-px block border-l-2 border-transparent py-2xs pl-sm typo-caption-small text-text-light hover:border-stroke-dark hover:text-text-default"
        >
          {item.title}
        </a>
      </li>
    ))}
  </ol>
);
