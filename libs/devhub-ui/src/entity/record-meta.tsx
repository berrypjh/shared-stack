import { Icon } from '../ui/icon';

const CHIP = 'inline-flex items-center gap-2xs rounded-sm bg-background-default px-xs py-2xs';

/** 기록의 날짜와 종류. 목록과 기록 머리가 같은 모양을 쓴다. 종류 글자는 앱의 어휘가 정한다. */
export const RecordMeta = ({ date, kind }: { date: string; kind: string }) => (
  <p className="flex flex-wrap items-center gap-xs typo-caption-small text-text-light">
    <span className={CHIP}>
      <Icon name="calendar" />
      <time dateTime={date}>{date}</time>
    </span>
    <span className={CHIP}>{kind}</span>
  </p>
);
