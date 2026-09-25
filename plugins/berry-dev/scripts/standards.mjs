/**
 * berry-dev standards CLI — `.claude/rules/_generated/` 만 다룬다.
 *
 *   node <berry-dev>/scripts/standards.mjs sync  --project <root> [--overwrite-generated]
 *   node <berry-dev>/scripts/standards.mjs check --project <root>
 *
 * expected 는 매번 plugin source 와 `.claude/standards.json` 으로 다시 만든다. 이전 manifest 는
 * "무엇을 썼는가"(소유)를 판정할 때만 쓴다. check 는 아무것도 쓰지 않는다.
 * 여러 파일 쓰기는 transaction 이 아니다 — 파일 하나씩 temp → rename 이고 manifest 가 마지막이다.
 * 계약은 docs/claude-harness/contracts.md.
 */
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';

import { buildExpectedFiles, GENERATOR, loadSource, StandardsError } from './standards-core.mjs';
import {
  createGeneratedDir,
  GENERATED_PATH,
  locateGenerated,
  readConfig,
  removeGenerated,
  resolveProject,
  scanGenerated,
  withLock,
  writeGenerated,
} from './standards-fs.mjs';

const USAGE = `Usage: node <berry-dev>/scripts/standards.mjs <sync|check> --project <root> [options]

  sync    write ${GENERATED_PATH}/ from the plugin source and .claude/standards.json
  check   compare the same result with the disk without writing anything

Options:
  --project <root>         consumer repository root (required)
  --overwrite-generated    sync only: restore generated files that were edited by hand
  -h, --help               show this help

Exit codes: 0 ok, 1 drift (check), 2 usage, config, IO or ownership error
`;

const MANIFEST = 'manifest.json';
const RULE_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const HEADER = `<!-- ${GENERATOR} format `;

const sha256 = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** 이전 manifest. 모양이 틀리면 소유를 판정할 수 없으므로 이유만 돌려준다. */
const parseRecorded = (entry) => {
  if (entry.kind !== 'file') return { error: 'is not a regular file' };
  let value;
  try {
    value = JSON.parse(entry.bytes.toString('utf8'));
  } catch {
    return { error: 'is not valid JSON' };
  }
  if (!isObject(value) || value.generator !== GENERATOR || !isObject(value.files)) {
    return { error: `is not a ${GENERATOR} manifest` };
  }
  const valid = Object.entries(value.files).every(
    ([name, hash]) => RULE_FILE.test(name) && typeof hash === 'string' && SHA256.test(hash),
  );
  return valid ? { manifest: value } : { error: 'lists a file outside the generated names' };
};

/** 이전 · 새 manifest 의 차이를 사람이 읽는 말로. 본문은 담지 않는다. */
const describeManifest = (recorded, expected) => {
  const notes = [];
  if (recorded.pluginVersion !== expected.pluginVersion) {
    notes.push(`plugin ${recorded.pluginVersion} -> ${expected.pluginVersion}`);
  }
  if (recorded.format !== expected.format) notes.push('format changed');
  if (recorded.sourceDigest !== expected.sourceDigest) notes.push('source changed');
  if (recorded.configDigest !== expected.configDigest) notes.push('config changed');
  if (JSON.stringify(recorded.files) !== JSON.stringify(expected.files)) {
    notes.push('files changed');
  }
  return notes.join(', ') || 'formatting changed';
};

const hasHeader = (bytes) =>
  bytes
    .toString('utf8')
    .split('\n', 12)
    .some((line) => line.startsWith(HEADER));

/**
 * 디스크 항목 · expected · 이전 manifest 로 할 일을 정한다. 순수 함수다.
 * `blocking` 이 하나라도 있으면 sync 는 아무것도 쓰지 않는다.
 */
const plan = ({ expected, entries, overwrite }) => {
  const issues = [];
  const writes = [];
  const removals = [];
  const add = (kind, name, blocking, note) => issues.push({ kind, name, blocking, note });
  const want = new Map(expected.map((file) => [file.path, Buffer.from(file.content, 'utf8')]));

  const manifestEntry = entries.get(MANIFEST);
  const recorded = manifestEntry ? parseRecorded(manifestEntry) : { manifest: null };
  if (recorded.error) add('manifest', MANIFEST, true, recorded.error);
  const owned = recorded.manifest?.files ?? {};

  for (const [name, entry] of entries) {
    if (name === MANIFEST) continue;
    if (entry.kind === 'lock') {
      add('locked', name, true, 'another sync is running, or remove it after a crash');
      continue;
    }
    if (entry.kind === 'symlink') {
      add('symlink', name, true);
      continue;
    }
    if (entry.kind !== 'file' || !RULE_FILE.test(name)) {
      add('extra', name, true, 'not created by sync; move it out of _generated');
      continue;
    }
    const expectedBytes = want.get(name);
    if (expectedBytes?.equals(entry.bytes)) continue;
    if (!Object.hasOwn(owned, name)) {
      const kind = expectedBytes ? 'conflict' : 'extra';
      add(kind, name, true, 'not created by sync; move it out of _generated');
      continue;
    }
    const intact = sha256(entry.bytes) === owned[name];
    if (expectedBytes) {
      if (intact) add('outdated', name, false);
      else if (overwrite) add('modified', name, false, 'restoring (--overwrite-generated)');
      else add('modified', name, true, 'edited by hand; use --overwrite-generated to restore');
      if (intact || overwrite) writes.push(name);
    } else if (intact && hasHeader(entry.bytes)) {
      add('stale', name, false);
      removals.push(name);
    } else {
      add('modified', name, true, 'no longer generated and edited by hand; not removing');
    }
  }

  for (const { path: name } of expected) {
    if (name !== MANIFEST && !entries.has(name)) {
      add('missing', name, false);
      writes.push(name);
    }
  }

  const expectedManifest = want.get(MANIFEST);
  if (!manifestEntry) add('missing', MANIFEST, false);
  else if (recorded.manifest && !expectedManifest.equals(manifestEntry.bytes)) {
    const next = JSON.parse(expectedManifest.toString('utf8'));
    add('manifest', MANIFEST, false, describeManifest(recorded.manifest, next));
  }
  const changed = issues.some((issue) => !issue.blocking);
  return {
    issues,
    blocked: issues.some((issue) => issue.blocking),
    writes: changed ? [...writes.sort(), MANIFEST] : [],
    removals: removals.sort(),
  };
};

const report = (issues) => {
  for (const { kind, name, note } of issues) {
    const suffix = note ? ` (${note})` : '';
    process.stdout.write(`${kind.padEnd(9)} ${GENERATED_PATH}/${name}${suffix}\n`);
  }
};

/** lock 안에서 다시 판정한 결과가 처음과 같을 때만 쓴다. rule → 삭제 → manifest 순서다. */
const apply = async ({ dir, first, expected, entries, overwrite }) => {
  const again = plan({ expected, entries, overwrite });
  const same =
    !again.blocked &&
    JSON.stringify([again.writes, again.removals]) ===
      JSON.stringify([first.writes, first.removals]);
  if (!same) {
    throw new StandardsError(
      'ownership',
      `${GENERATED_PATH} changed while syncing; nothing was written`,
    );
  }
  const content = new Map(expected.map((file) => [file.path, file.content]));
  for (const name of first.writes.filter((name) => name !== MANIFEST)) {
    await writeGenerated(dir, name, content.get(name));
  }
  for (const name of first.removals) await removeGenerated(dir, name);
  if (first.writes.includes(MANIFEST)) await writeGenerated(dir, MANIFEST, content.get(MANIFEST));
};

const parse = (argv) => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      project: { type: 'string' },
      'overwrite-generated': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  return { ...values, positionals };
};

const usageError = (message) => {
  process.stderr.write(`standards: ${message}\n\n${USAGE}`);
  return 2;
};

const run = async (argv) => {
  let args;
  try {
    args = parse(argv);
  } catch (error) {
    return usageError(error.message);
  }
  if (args.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  const [command, ...rest] = args.positionals;
  if (!['sync', 'check'].includes(command) || rest.length > 0) {
    return usageError('expected sync or check');
  }
  if (!args.project) return usageError('--project is required');
  const overwrite = Boolean(args['overwrite-generated']);
  if (overwrite && command !== 'sync') return usageError('--overwrite-generated is for sync only');

  const project = await resolveProject(args.project);
  const { dir, exists } = await locateGenerated(project);
  const source = await loadSource();
  const expected = buildExpectedFiles({ ...source, config: await readConfig(project) });
  const scan = (options) => (exists ? scanGenerated(dir, options) : new Map());
  const first = plan({ expected, entries: await scan(), overwrite });
  report(first.issues);

  if (first.blocked) {
    process.stderr.write(`${command}: stopped by the entries above; nothing was written\n`);
    return 2;
  }
  if (first.issues.length === 0) {
    process.stdout.write(`${command}: up to date\n`);
    return 0;
  }
  if (command === 'check') {
    process.stdout.write(`check: drift; run sync\n`);
    return 1;
  }
  if (!exists) await createGeneratedDir(dir);
  await withLock(dir, async () => {
    await locateGenerated(project);
    const entries = await scanGenerated(dir, { holdingLock: true });
    await apply({ dir, first, expected, entries, overwrite });
  });
  process.stdout.write(`sync: wrote ${first.writes.length}, removed ${first.removals.length}\n`);
  return 0;
};

/** 알 수 없는 오류의 메시지에는 머신 경로가 섞일 수 있어 code 만 쓴다. */
const describeError = (error) =>
  error instanceof StandardsError ? error.message : `unexpected ${error.code ?? error.name}`;

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`standards: ${describeError(error)}\n`);
  process.exitCode = 2;
}
