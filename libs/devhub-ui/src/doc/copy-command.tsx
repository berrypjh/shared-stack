import { Mono } from '../ui/mono';

import { CopyButton } from './copy-button';

/**
 * 로컬에서 실행할 명령 한 줄과 복사 버튼. 버튼은 클립보드에 복사만 한다 — 브라우저가 명령을 실행하지
 * 않는다. 여러 명령을 한 덩어리로 보일 때는 `CommandList` 를 쓴다.
 */
export const CopyCommand = ({
  command,
  copyLabel = `명령 복사: ${command}`,
}: {
  command: string;
  copyLabel?: string;
}) => (
  <span className="flex flex-wrap items-center gap-sm">
    <Mono>{command}</Mono>
    <CopyButton text={command} label={copyLabel} />
  </span>
);
