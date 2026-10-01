import { List, ListItem } from '@berrypjh/react-ui';

/**
 * 화면 머리의 안내. 이 화면이 답하는 질문 하나와 읽는 법 몇 줄 — 용어의 정확한 뜻은 상세 칸이 갖는다.
 * `label` 이 영역의 이름이다.
 */
export const QuestionGuide = ({
  question,
  points,
  label = '이 화면이 답하는 질문',
}: {
  question: string;
  points: string[];
  label?: string;
}) => (
  <section
    aria-label={label}
    className="flex flex-col gap-sm rounded-md border border-stroke-light bg-background-default p-md"
  >
    <p className="typo-body-small-strong break-keep text-text-default">{question}</p>
    <List className="flex flex-col gap-xs typo-body-small break-keep text-text-default">
      {points.map((point) => (
        <ListItem key={point}>{point}</ListItem>
      ))}
    </List>
  </section>
);
