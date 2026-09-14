import { type ReactNode, useId } from 'react';

/** heading 으로 이름을 갖는 도메인 section. `anchor` 는 다른 화면의 링크가 가리키는 id 다. */
export const Section = ({
  title,
  level = 2,
  anchor,
  card = false,
  children,
}: {
  title: string;
  level?: 2 | 3;
  anchor?: string;
  card?: boolean;
  children: ReactNode;
}) => {
  const headingId = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section
      id={anchor}
      aria-labelledby={headingId}
      className={[
        'flex flex-col gap-md scroll-mt-[64px]',
        card ? 'bg-background-surface border border-stroke-default rounded-md p-lg' : '',
      ].join(' ')}
    >
      <Heading
        id={headingId}
        className={
          level === 2
            ? 'text-text-default text-lg leading-lg font-semiBold'
            : 'text-text-default text-sm leading-sm font-semiBold'
        }
      >
        {title}
      </Heading>
      {children}
    </section>
  );
};
