import type { CommandRef } from './model';

/** 저장소 root 에서 사람이 치는 한 줄. 저장소 문서의 표기(`pnpm nx <target> <project>`)를 따른다. */
export const commandLine = ({ source }: CommandRef): string =>
  source.kind === 'package-script'
    ? `pnpm ${source.script}`
    : `pnpm nx ${source.target} ${source.project}`;
