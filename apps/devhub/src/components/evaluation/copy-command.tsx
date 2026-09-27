import { CopyButton } from '@berrypjh/devhub-ui';

import { Mono } from './mono';

/** 로컬에서 실행할 명령. 버튼은 클립보드에 복사만 한다 — 브라우저가 명령을 실행하지 않는다. */
export const CopyCommand = ({ command }: { command: string }) => (
  <span className="flex flex-wrap items-center gap-sm">
    <Mono>{command}</Mono>
    <CopyButton text={command} label={`명령 복사: ${command}`} />
  </span>
);
