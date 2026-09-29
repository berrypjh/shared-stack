import type { ExecutionContext } from '../../domain/model';

/** 흐름 단계가 도는 곳. 순서가 그림의 레인 순서다. */
export const contexts: ExecutionContext[] = [
  { id: 'ci', name: 'GitHub Actions', summary: '.github/workflows 의 job' },
  { id: 'registry', name: 'GitHub Packages', summary: 'npm.pkg.github.com registry' },
];
