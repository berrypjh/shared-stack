/**
 * nx.json `release.projects`의 npm 이름(@scope/pkg)을 commit scope로 쓰는 short name(pkg)으로 바꿉니다.
 */
export const toReleaseScopes = (projects: string[]): string[] =>
  projects.map((project) => project.replace(/^@[^/]+\//, ''));

/**
 * commit subject 중 릴리즈 대상 scope를 가진 feat commit이 있는지 확인합니다.
 */
export const hasReleaseFeature = (subjects: string[], scopes: string[]): boolean =>
  subjects.some((subject) => {
    const commitScopes = subject.match(/^feat\(([^)]+)\):/)?.[1].split(',') ?? [];
    return commitScopes.some((scope) => scopes.includes(scope.trim()));
  });
