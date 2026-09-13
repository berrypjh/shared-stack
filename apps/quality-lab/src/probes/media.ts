import {
  type Capability,
  type CapabilityBase,
  combine,
  type Dispose,
  failed,
  missing,
  NOOP_DISPOSE,
  sampled,
  type SyncProbe,
} from './capability';
import type { BrowserEnv, Listener, MediaQueryListLike } from './env';
import { attempt, peek } from './safe';

/**
 * 읽는 media feature 와 keyword. keyword 하나라도 맞으면 feature 를 해석한 것이고,
 * 전부 false 면 값 false 가 아니라 해석하지 못한 feature 다. any-* 는 여러 개가 맞을 수 있다.
 */
export const MEDIA_FEATURES = [
  {
    feature: 'prefers-color-scheme',
    group: 'preference',
    label: '색 구성 선호',
    values: ['light', 'dark'],
    multiple: false,
  },
  {
    feature: 'prefers-reduced-motion',
    group: 'preference',
    label: '동작 줄이기 선호',
    values: ['no-preference', 'reduce'],
    multiple: false,
  },
  {
    feature: 'prefers-contrast',
    group: 'preference',
    label: '대비 선호',
    values: ['no-preference', 'more', 'less', 'custom'],
    multiple: false,
  },
  {
    feature: 'forced-colors',
    group: 'preference',
    label: '강제 색상 모드',
    values: ['none', 'active'],
    multiple: false,
  },
  {
    feature: 'pointer',
    group: 'input',
    label: '주 입력 포인터 정밀도',
    values: ['none', 'coarse', 'fine'],
    multiple: false,
  },
  {
    feature: 'hover',
    group: 'input',
    label: '주 입력 hover 가능',
    values: ['none', 'hover'],
    multiple: false,
  },
  {
    feature: 'any-pointer',
    group: 'input',
    label: '모든 입력 포인터 정밀도',
    values: ['none', 'coarse', 'fine'],
    multiple: true,
  },
  {
    feature: 'any-hover',
    group: 'input',
    label: '모든 입력 hover 가능',
    values: ['none', 'hover'],
    multiple: true,
  },
] as const;

type Feature = (typeof MEDIA_FEATURES)[number];

const queryOf = (feature: string, value: string) => `(${feature}: ${value})`;

const baseOf = (spec: Feature): CapabilityBase => ({
  id: `media.${spec.feature}`,
  group: spec.group,
  label: spec.label,
  unit: null,
  approximate: false,
  limitation: spec.multiple ? '연결된 입력 장치 여러 개가 동시에 맞을 수 있습니다' : null,
});

const sampleFeature = (env: BrowserEnv, spec: Feature): Capability => {
  const base = baseOf(spec);
  const matchMedia = attempt(() => env.matchMedia);
  if (!matchMedia.ok) return failed(base, `읽는 중 오류 — ${matchMedia.error}`, env.now());
  const query = matchMedia.value;
  if (typeof query !== 'function') return missing(base, 'unsupported', 'matchMedia 가 없습니다');

  const results: { name: string; value: boolean; parsed: boolean }[] = [];
  for (const value of spec.values) {
    const name = queryOf(spec.feature, value);
    const list = attempt(() => {
      const result = query(name);
      return { matches: result.matches === true, media: result.media };
    });
    if (!list.ok) return failed(base, `읽는 중 오류 — ${list.error}`, env.now());
    results.push({ name, value: list.value.matches, parsed: list.value.media !== 'not all' });
  }

  if (results.every((result) => !result.parsed)) {
    return missing(
      base,
      'unsupported',
      `브라우저가 query 를 'not all' 로 바꿨습니다 — ${spec.feature} 를 해석하지 못합니다`,
    );
  }
  const matched = spec.values.filter((_value, index) => results[index].value);
  if (matched.length === 0) {
    return missing(
      base,
      'unsupported',
      `모든 keyword 가 false 입니다 — ${spec.feature} 를 해석하지 못하는 브라우저로 봅니다`,
    );
  }
  return sampled(
    base,
    spec.multiple ? [...matched] : matched[0],
    env.now(),
    results.map(({ name, value }) => ({ name, value })),
  );
};

/** addEventListener 가 없으면 오래된 addListener 를 쓴다. */
const listenList = (list: MediaQueryListLike, listener: Listener): Dispose => {
  if (typeof list.addEventListener === 'function') {
    const added = attempt(() => list.addEventListener?.('change', listener));
    return added.ok
      ? () => {
          attempt(() => list.removeEventListener?.('change', listener));
        }
      : NOOP_DISPOSE;
  }
  if (typeof list.addListener === 'function') {
    const added = attempt(() => list.addListener?.(listener));
    return added.ok
      ? () => {
          attempt(() => list.removeListener?.(listener));
        }
      : NOOP_DISPOSE;
  }
  return NOOP_DISPOSE;
};

export const mediaProbe: SyncProbe = {
  id: 'media',
  detect: (env) => (typeof peek(() => env.matchMedia) === 'function' ? 'supported' : 'unsupported'),
  sample: (env) => MEDIA_FEATURES.map((spec) => sampleFeature(env, spec)),
  subscribe: (env, onChange) => {
    const query = peek(() => env.matchMedia);
    if (typeof query !== 'function') return NOOP_DISPOSE;
    return combine(
      MEDIA_FEATURES.flatMap((spec) =>
        spec.values.map((value) => {
          const list = peek(() => query(queryOf(spec.feature, value)));
          return list ? listenList(list, onChange) : NOOP_DISPOSE;
        }),
      ),
    );
  },
};
