import {
  type CapabilityBase,
  combine,
  isCount,
  isText,
  isTextList,
  listen,
  readCapability,
  type SyncProbe,
} from './capability';
import { peek } from './safe';

const base = (
  id: string,
  label: string,
  group: 'viewport' | 'locale',
  unit: CapabilityBase['unit'],
  limitation: string | null = null,
): CapabilityBase => ({ id, group, label, unit, approximate: false, limitation });

/** viewport·screen·DPR·orientation·locale·timezone. */
export const environmentProbe: SyncProbe = {
  id: 'environment',
  detect: (env) => (peek(() => env.window) ? 'supported' : 'unsupported'),
  sample: (env) => [
    readCapability(
      base(
        'viewport.width',
        'viewport 너비 (innerWidth)',
        'viewport',
        'css-px',
        'scrollbar 를 포함한 창 안쪽 너비',
      ),
      () => env.window?.innerWidth,
      env,
      isCount,
    ),
    readCapability(
      base('viewport.height', 'viewport 높이 (innerHeight)', 'viewport', 'css-px'),
      () => env.window?.innerHeight,
      env,
      isCount,
    ),
    readCapability(
      base(
        'viewport.dpr',
        'device pixel ratio',
        'viewport',
        'ratio',
        '브라우저 zoom 으로도 바뀝니다',
      ),
      () => env.window?.devicePixelRatio,
      env,
      isCount,
    ),
    readCapability(
      base(
        'screen.width',
        'screen 너비',
        'viewport',
        'css-px',
        '화면 전체 크기 — 창 크기가 아닙니다',
      ),
      () => env.screen?.width,
      env,
      isCount,
    ),
    readCapability(
      base(
        'screen.height',
        'screen 높이',
        'viewport',
        'css-px',
        '화면 전체 크기 — 창 크기가 아닙니다',
      ),
      () => env.screen?.height,
      env,
      isCount,
    ),
    readCapability(
      base('screen.orientation', '화면 방향', 'viewport', null),
      () => env.screen?.orientation?.type,
      env,
      isText,
    ),
    readCapability(
      base('locale.language', '선호 언어', 'locale', null),
      () => env.navigator?.language,
      env,
      isText,
    ),
    readCapability(
      base('locale.languages', '선호 언어 목록', 'locale', null),
      () => env.navigator?.languages,
      env,
      isTextList,
    ),
    readCapability(
      base('locale.timezone', 'time zone', 'locale', null),
      () => env.timeZone?.(),
      env,
      isText,
    ),
  ],
  subscribe: (env, onChange) =>
    combine([
      listen(() => env.window, 'resize', onChange),
      listen(() => env.screen?.orientation, 'change', onChange),
      listen(() => env.window, 'languagechange', onChange),
    ]),
};
