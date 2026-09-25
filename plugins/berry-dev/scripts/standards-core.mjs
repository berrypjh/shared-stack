/**
 * standards registry 검증과 결정적 renderer.
 *
 * 순수 경계: validatePlugin · validateManifest · validateConfig · renderRule · buildExpectedFiles 는
 * 값만 받고 값만 돌려준다. 파일을 읽는 것은 plugin 자신의 source 를 읽는 loadSource 하나이고,
 * 소비 저장소의 파일을 읽거나 쓰는 API 는 없다. 계약은 docs/claude-harness/contracts.md.
 */
import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GENERATOR = 'berry-dev/standards';
export const FORMAT = 1;
export const SYNC_COMMAND = 'pnpm harness:sync';

const PLUGIN_NAME = 'berry-dev';
const PLUGIN_ROOT = fileURLToPath(new URL('..', import.meta.url));
const RULE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SCOPES = ['core', 'optional'];
// eslint-disable-next-line no-control-regex -- YAML 한 줄을 깨는 제어 문자를 path 에서 거절한다
const UNSAFE_PATH_CHAR = /[\u0000-\u001f\u007f\u2028\u2029]/;

/** 설정 · source · IO 오류. `kind` 는 `source` · `config` 중 하나이고 CLI 는 모두 exit 2 로 낸다. */
export class StandardsError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'StandardsError';
    this.kind = kind;
  }
}

const fail = (kind, message) => {
  throw new StandardsError(kind, message);
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const expectFields = (kind, label, value, allowed) => {
  if (!isObject(value)) fail(kind, `${label} must be an object`);
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) fail(kind, `${label} has unknown field(s): ${unknown.join(', ')}`);
};

/** locale 과 무관한 code unit 순서. */
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compare)
      .map((key) => [key, sortKeys(value[key])]),
  );
};

const stableJson = (value, indent) => JSON.stringify(sortKeys(value), null, indent);

const digest = (text) => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;

/** BOM 제거 · CRLF → LF · 끝 개행 제거. 끝 개행 하나는 renderer 가 붙인다. */
const normalizeBody = (text) =>
  text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n+$/, '');

/** `.claude-plugin/plugin.json` 에서 name · version 만 꺼낸다. version 의 유일한 출처다. */
export const validatePlugin = (value) => {
  if (!isObject(value)) fail('source', 'plugin.json must be an object');
  if (value.name !== PLUGIN_NAME) fail('source', `plugin.json name must be "${PLUGIN_NAME}"`);
  if (typeof value.version !== 'string' || !SEMVER.test(value.version)) {
    fail('source', 'plugin.json version must be semver');
  }
  return { name: value.name, version: value.version };
};

/** `standards/manifest.json` 검증. rule 은 id 순으로 정렬해 돌려준다. */
export const validateManifest = (value) => {
  expectFields('source', 'standards/manifest.json', value, ['schemaVersion', 'rules']);
  if (value.schemaVersion !== 1) fail('source', 'standards/manifest.json schemaVersion must be 1');
  if (!Array.isArray(value.rules) || value.rules.length === 0) {
    fail('source', 'standards/manifest.json rules must be a non-empty array');
  }
  const seen = new Set();
  const rules = value.rules.map((rule, index) => {
    const label = `standards/manifest.json rules[${index}]`;
    expectFields('source', label, rule, ['id', 'source', 'scope']);
    const { id, source, scope } = rule;
    if (typeof id !== 'string' || !RULE_ID.test(id)) {
      fail('source', `${label}.id ${JSON.stringify(id)} must match ${RULE_ID}`);
    }
    if (seen.has(id)) fail('source', `${label}.id "${id}" is registered twice`);
    seen.add(id);
    if (source !== `rules/${id}.md`) fail('source', `${label}.source must be "rules/${id}.md"`);
    if (!SCOPES.includes(scope)) {
      fail('source', `${label}.scope must be one of ${SCOPES.join(', ')}`);
    }
    return { id, source, scope };
  });
  return { schemaVersion: 1, rules: rules.sort((a, b) => compare(a.id, b.id)) };
};

const validatePaths = (id, choice) => {
  const label = `.claude/standards.json rules.${id}`;
  expectFields('config', label, choice, ['paths']);
  const { paths } = choice;
  if (!Array.isArray(paths) || paths.length === 0) {
    fail('config', `${label}.paths must be a non-empty array`);
  }
  paths.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '' || UNSAFE_PATH_CHAR.test(entry)) {
      fail(
        'config',
        `${label}.paths[${index}] must be a non-blank string without control characters`,
      );
    }
  });
  return [...paths];
};

const unknownId = (id, manifest) => {
  const lower = typeof id === 'string' ? id.toLowerCase() : id;
  const hint = manifest.rules.some((rule) => rule.id === lower && lower !== id)
    ? ` (rule ids are lowercase: did you mean "${lower}"?)`
    : '';
  fail('config', `unknown rule id ${JSON.stringify(id)}${hint}`);
};

/**
 * `.claude/standards.json` 을 manifest 에 대조해 생성할 rule 목록을 id 순으로 돌려준다.
 * core 는 항상 들어가고(`paths: null`), optional 은 적은 것만 `paths` 와 함께 들어간다.
 */
export const validateConfig = (value, manifest) => {
  expectFields('config', '.claude/standards.json', value, ['schemaVersion', 'rules']);
  if (value.schemaVersion !== 1) fail('config', '.claude/standards.json schemaVersion must be 1');
  if (!isObject(value.rules)) fail('config', '.claude/standards.json rules must be an object');
  const byId = new Map(manifest.rules.map((rule) => [rule.id, rule]));
  const chosen = new Map();
  for (const [id, choice] of Object.entries(value.rules)) {
    const rule = byId.get(id);
    if (!rule) unknownId(id, manifest);
    if (rule.scope === 'core') {
      if (choice !== true) fail('config', `core rule "${id}" takes true and cannot be narrowed`);
      continue;
    }
    chosen.set(id, validatePaths(id, choice));
  }
  return manifest.rules
    .filter((rule) => rule.scope === 'core' || chosen.has(rule.id))
    .map((rule) => ({ id: rule.id, paths: rule.scope === 'core' ? null : chosen.get(rule.id) }));
};

const metadataComment = (rule, plugin) =>
  `<!-- ${GENERATOR} format ${FORMAT} | Source: ${plugin.name}/standards/${rule.source} | ` +
  `Plugin: ${plugin.name}@${plugin.version} | Do not edit. Run: ${SYNC_COMMAND} -->`;

/**
 * rule 하나를 생성 파일 내용으로 만든다. paths 가 있으면 YAML frontmatter 가 첫 줄이고
 * metadata comment 가 그 다음이다. path 는 JSON 문자열(YAML 큰따옴표 scalar)로 쓴다.
 */
export const renderRule = ({ rule, body, paths, plugin }) => {
  const text = normalizeBody(body);
  if (text.trim() === '') fail('source', `${rule.source} is empty`);
  if (/^---[ \t]*(\n|$)/.test(text)) {
    fail(
      'source',
      `${rule.source} must not have frontmatter; paths come from .claude/standards.json`,
    );
  }
  const frontmatter = paths
    ? ['---', 'paths:', ...paths.map((entry) => `  - ${JSON.stringify(entry)}`), '---']
    : [];
  return [...frontmatter, metadataComment(rule, plugin), '', text].join('\n') + '\n';
};

const sourceDigest = (manifest, bodies) =>
  digest(
    [
      `standards/manifest.json\0${digest(stableJson(manifest))}`,
      ...manifest.rules.map(
        (rule) => `standards/${rule.source}\0${digest(normalizeBody(bodies[rule.id]))}`,
      ),
    ]
      .sort(compare)
      .join('\n'),
  );

/**
 * source + config 로 `.claude/rules/_generated/` 에 있어야 할 파일 전체를 경로 순으로 만든다.
 * 생성 manifest(`manifest.json`)도 포함한다. 같은 입력이면 byte 단위로 같다.
 */
export const buildExpectedFiles = ({ plugin, manifest, bodies, config }) => {
  for (const rule of manifest.rules) {
    if (typeof bodies[rule.id] !== 'string') fail('source', `${rule.source} has no body`);
  }
  const byId = new Map(manifest.rules.map((rule) => [rule.id, rule]));
  const files = validateConfig(config, manifest).map(({ id, paths }) => ({
    path: `${id}.md`,
    content: renderRule({ rule: byId.get(id), body: bodies[id], paths, plugin }),
  }));
  const generated = {
    configDigest: digest(stableJson(config)),
    files: Object.fromEntries(files.map((file) => [file.path, digest(file.content)])),
    format: FORMAT,
    generator: GENERATOR,
    plugin: plugin.name,
    pluginVersion: plugin.version,
    schemaVersion: 1,
    sourceDigest: sourceDigest(manifest, bodies),
  };
  return [...files, { path: 'manifest.json', content: `${stableJson(generated, 2)}\n` }].sort(
    (a, b) => compare(a.path, b.path),
  );
};

/** plugin 안 상대 경로를 읽는다. 경로의 어느 segment 도 symlink 일 수 없다. */
const readPluginFile = async (pluginRoot, relative) => {
  let current = pluginRoot;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    const stat = await lstat(current).catch(() => fail('source', `${relative} does not exist`));
    if (stat.isSymbolicLink()) fail('source', `${relative} passes through a symlink`);
  }
  return readFile(current, 'utf8');
};

const parseJson = (relative, text) => {
  try {
    return JSON.parse(text);
  } catch {
    return fail('source', `${relative} is not valid JSON`);
  }
};

/** CLI 자신의 위치에서 plugin source 를 읽는다. 캐시 탐색 · 환경 변수 · network 가 없다. */
export const loadSource = async (pluginRoot = PLUGIN_ROOT) => {
  const read = (relative) => readPluginFile(pluginRoot, relative);
  const plugin = validatePlugin(parseJson('plugin.json', await read('.claude-plugin/plugin.json')));
  const manifest = validateManifest(
    parseJson('standards/manifest.json', await read('standards/manifest.json')),
  );
  const registered = manifest.rules.map((rule) => `${rule.id}.md`);
  const onDisk = (await readdir(path.join(pluginRoot, 'standards/rules'))).sort(compare);
  if (stableJson(onDisk) !== stableJson(registered)) {
    fail('source', `standards/rules must match the manifest: ${registered.join(', ')}`);
  }
  const bodies = {};
  for (const rule of manifest.rules) bodies[rule.id] = await read(`standards/${rule.source}`);
  return { plugin, manifest, bodies };
};
