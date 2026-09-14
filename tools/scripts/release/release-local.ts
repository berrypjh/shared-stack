import { readFileSync, writeFileSync } from 'node:fs';

import { execSync } from 'child_process';
import { ReleaseClient } from 'nx/release';

const LOCAL_REGISTRY = 'http://localhost:4873';

const checkRegistry = () => {
  try {
    execSync(`curl -sf ${LOCAL_REGISTRY} > /dev/null`, { stdio: 'pipe' });
  } catch {
    console.error(`Local registry is not running at ${LOCAL_REGISTRY}`);
    console.error('Run "pnpm local-registry" in another terminal first.');
    process.exit(1);
  }
};

/** `libs/` 아래에서 현재 dirty한 package.json 목록. */
const changedManifests = (): string[] =>
  execSync('git diff --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter((f) => f.endsWith('package.json') && f.startsWith('libs/'));

/**
 * release 실행 전 manifest 상태를 찍어 둔다.
 *
 * Nx release는 version을 쓰기 위해 manifest를 수정하므로 끝나고 되돌려야 한다.
 * 그런데 release 전부터 dirty했던 파일은 **작업자의 변경**이다 — `git checkout`으로
 * 되돌리면 커밋되지 않은 작업이 사라진다. 그래서 내용을 기억해 두었다가 그대로 복원한다.
 */
const snapshotManifests = (): Map<string, string> =>
  new Map(changedManifests().map((f) => [f, readFileSync(f, 'utf-8')]));

/** release가 새로 건드린 manifest만 되돌리고, 원래 dirty였던 파일은 내용을 복원한다. */
const restorePackageJsonFiles = (before: Map<string, string>) => {
  try {
    const bumped = changedManifests().filter((f) => !before.has(f));
    if (bumped.length > 0) {
      execSync(`git checkout -- ${bumped.join(' ')}`, { stdio: 'pipe' });
    }
    for (const [file, content] of before) {
      if (readFileSync(file, 'utf-8') !== content) writeFileSync(file, content);
    }
  } catch {
    console.warn('Could not restore package.json files. Check `git diff -- libs`.');
  }
};

const client = new ReleaseClient({
  version: {
    preserveMatchingDependencyRanges: false,
  },
});

let manifestsBefore = new Map<string, string>();

const main = async () => {
  checkRegistry();
  manifestsBefore = snapshotManifests();

  const { releaseGraph } = await client.releaseVersion({
    specifier: '0.0.0-e2e',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    versionActionsOptionsOverrides: {
      skipLockFileUpdate: true,
    },
  });

  const publishResult = await client.releasePublish({
    releaseGraph,
    tag: 'e2e',
    firstRelease: true,
    registry: LOCAL_REGISTRY,
  });

  restorePackageJsonFiles(manifestsBefore);

  const allOk = Object.values(publishResult).every((result) => result.code === 0);
  process.exit(allOk ? 0 : 1);
};

main().catch((error) => {
  restorePackageJsonFiles(manifestsBefore);
  console.error('Local registry 배포 실패:', error);
  process.exit(1);
});
