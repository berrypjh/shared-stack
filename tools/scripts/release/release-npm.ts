import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';

import { hasBreakingChange, hasReleaseFeature, toReleaseScopes } from './release-bump';

/**
 * 직전 release tag 이후 commit log를 주어진 format으로 가져옵니다. tag가 없으면 빈 문자열입니다.
 */
const getLogSinceLastTag = (format: string): string => {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 --match="v*"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!lastTag) return '';
    return execSync(`git log ${lastTag}..HEAD --format=${format}`, { encoding: 'utf8' });
  } catch {
    return '';
  }
};

/**
 * 직전 release tag 이후 commit에 breaking change(`!` 또는 BREAKING CHANGE footer)가 있는지 확인합니다.
 *
 * nx release의 conventionalCommits scope 매칭은 full npm name(@scope/pkg)을 요구하지만,
 * 현재 프로젝트 commit scope는 short name(react-ui 등)이라 자동 매칭이 안 되므로, 여기서 직접 감지해 major 강제 여부를 결정합니다.
 */
const hasBreakingChangeSinceLastTag = (): boolean =>
  hasBreakingChange(getLogSinceLastTag('%B%x00').split('\0'));

/**
 * 직전 release tag 이후 릴리즈 대상 scope의 feat commit이 있는지 확인합니다.
 *
 * scope가 매칭되지 않은 commit을 nx는 type과 무관하게 patch로 계산하므로, 여기서 직접 감지해 minor 여부를 결정합니다.
 */
const hasFeatureSinceLastTag = (): boolean => {
  const { release } = JSON.parse(readFileSync('nx.json', 'utf8'));
  const subjects = getLogSinceLastTag('%s').split('\n');
  return hasReleaseFeature(subjects, toReleaseScopes(release.projects));
};

const main = async () => {
  const isFirstRelease = process.argv.includes('--first-release');
  const isBeta = process.argv.includes('--beta') || process.argv.includes('--preid=beta');
  const hasBreaking = !isBeta && hasBreakingChangeSinceLastTag();
  const hasFeature = !isBeta && !hasBreaking && hasFeatureSinceLastTag();

  if (hasBreaking) {
    console.log('직전 tag 이후 BREAKING CHANGE 감지 — major bump를 강제합니다.');
  } else if (hasFeature) {
    console.log('직전 tag 이후 릴리즈 대상 feat commit 감지 — minor bump를 강제합니다.');
  }

  const specifier = isBeta
    ? 'prerelease'
    : hasBreaking
      ? 'major'
      : hasFeature
        ? 'minor'
        : undefined;

  const { workspaceVersion, projectsVersionData, releaseGraph } = await releaseVersion({
    firstRelease: isFirstRelease,
    specifier,
    preid: isBeta ? 'beta' : undefined,
  });

  // publish 를 먼저 한다. changelog 단계가 tag · push · GitHub Release 를 만들기 때문에, 그 뒤에 publish 가
  // 실패하면 다시 돌려도 "직전 tag 이후 변경 없음" 이라 배포할 길이 없다. 이미 나간 버전은 publish 가 건너뛴다.
  const publishResult = await releasePublish({
    releaseGraph,
    registry: 'https://npm.pkg.github.com',
    access: 'public',
    firstRelease: isFirstRelease,
    tag: isBeta ? 'beta' : undefined,
  });

  const allOk = Object.values(publishResult).every((result) => result.code === 0);
  if (!allOk) {
    console.error('publish 실패 — tag · changelog 를 push 하지 않습니다. 고친 뒤 다시 실행하세요.');
    process.exit(1);
  }

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    releaseGraph,
    firstRelease: isFirstRelease,
  });

  process.exit(0);
};

main().catch((error) => {
  console.error('예상치 못한 오류 발생 (npm 배포):', error);
  process.exit(1);
});
