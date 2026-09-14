import { discover, getApi, packageSummary } from './catalog';
import { resolvePackages } from './packages';
import { resolvePlatform } from './platform';
import { loadCatalogs, loadTokenSource } from './repo-source';
import { lookupTokens } from './tokens';

/**
 * Progressive retrieval의 CLI 표면. MCP 없이 Bash에서 바로 쓴다.
 *
 *   pnpm ui:lookup --platform --prompt="RN 화면에 Box 추가" --deps=@berrypjh/react-native-ui
 *   pnpm ui:lookup --summary --package=@berrypjh/react-ui
 *   pnpm ui:lookup --discover=search --package=@berrypjh/react-ui
 *   pnpm ui:lookup --symbol=Button --package=@berrypjh/react-ui [--detail=signature]
 *   pnpm ui:lookup --token=color.primary [--limit=10]
 *
 * 출력은 항상 JSON 한 덩어리 — 파싱해서 쓰라는 뜻이다.
 */

type Args = Record<string, string | true>;

const parseArgs = (argv: string[]): Args =>
  Object.fromEntries(
    argv.map((a) => {
      const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
      if (!m) throw new Error(`unrecognised argument "${a}"`);
      return [m[1], m[2] ?? true] as const;
    }),
  );

const str = (args: Args, key: string): string | null =>
  typeof args[key] === 'string' ? (args[key] as string) : null;

const USAGE = [
  'usage:',
  '  --platform --prompt=<text> [--deps=<pkg,pkg>] [--files=<path,path>]',
  '  --summary --package=<name>',
  '  --discover=<query> [--package=<name>] [--kind=<kind>] [--limit=<n>]',
  '  --symbol=<name> --package=<name> [--detail=signature|full]',
  '  --token=<path|prefix|category> [--limit=<n>]',
].join('\n');

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const emit = (value: unknown) => console.log(JSON.stringify(value, null, 2));

  const prompt = str(args, 'prompt');
  if (args.platform && prompt !== null) {
    const deps = str(args, 'deps');
    const decision = resolvePlatform({
      prompt,
      dependencies:
        deps === null
          ? undefined
          : Object.fromEntries(
              deps
                .split(',')
                .filter(Boolean)
                .map((d) => [d, '*']),
            ),
      targetFiles: str(args, 'files')?.split(',').filter(Boolean),
    });
    emit({ ...decision, packages: resolvePackages(decision.canonical) });
    return;
  }

  const token = str(args, 'token');
  if (token !== null) {
    const limit = str(args, 'limit');
    emit(
      lookupTokens(await loadTokenSource(), token, {
        ...(limit ? { limit: Number(limit) } : {}),
      }),
    );
    return;
  }

  const packageName = str(args, 'package');
  const catalogs = await loadCatalogs();

  if (args.summary) {
    const catalog = packageName ? catalogs[packageName] : null;
    if (!catalog) throw new Error(`--summary needs --package=<${Object.keys(catalogs).join('|')}>`);
    emit(packageSummary(catalog));
    return;
  }

  const query = str(args, 'discover');
  if (query !== null) {
    const limit = str(args, 'limit');
    const kind = str(args, 'kind');
    emit(
      discover(catalogs, query, {
        packages: packageName ? [packageName] : undefined,
        kinds: kind ? [kind as never] : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    );
    return;
  }

  const symbol = str(args, 'symbol');
  if (symbol !== null) {
    if (!packageName) throw new Error('--symbol needs --package=<name>');
    emit(
      getApi(
        catalogs,
        packageName,
        symbol,
        str(args, 'detail') === 'signature' ? 'signature' : 'full',
      ),
    );
    return;
  }

  throw new Error(USAGE);
};

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
