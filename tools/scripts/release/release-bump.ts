/**
 * nx.json `release.projects`의 npm 이름(@scope/pkg)을 commit scope로 쓰는 short name(pkg)으로 바꿉니다.
 */
export const toReleaseScopes = (projects: string[]): string[] =>
  projects.map((project) => project.replace(/^@[^/]+\//, ''));

/**
 * commit subject 중 릴리즈 대상 scope를 가진 feat commit이 있는지 확인합니다. `feat(scope)!:`도 포함합니다.
 */
export const hasReleaseFeature = (subjects: string[], scopes: string[]): boolean =>
  subjects.some((subject) => {
    const commitScopes = subject.match(/^feat\(([^)]+)\)!?:/)?.[1].split(',') ?? [];
    return commitScopes.some((scope) => scopes.includes(scope.trim()));
  });

/**
 * commit message(subject + body) 중 breaking change가 있는지 확인합니다.
 * Conventional Commits의 두 표기 — subject의 `!`(`feat(scope)!:`)와 `BREAKING CHANGE:` · `BREAKING-CHANGE:` footer — 를 모두 봅니다.
 */
export const hasBreakingChange = (messages: string[]): boolean =>
  messages.some(
    (message) => /^\w+(\([^)]*\))?!:/.test(message.trim()) || /^BREAKING[ -]CHANGE:/m.test(message),
  );
