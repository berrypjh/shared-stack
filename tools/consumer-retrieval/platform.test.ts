import { describe, expect, it } from 'vitest';

import { NATIVE_PACKAGE, resolvePlatform, WEB_PACKAGE } from './platform';

const webDeps = { [WEB_PACKAGE]: '^1.0.1', react: '^19.1.0' };
const nativeDeps = { [NATIVE_PACKAGE]: '^1.0.1', expo: '~54.0.0' };
const bothDeps = { ...webDeps, ...nativeDeps };

describe('platform resolution', () => {
  it('routes an explicit web request in a web project to web', () => {
    const d = resolvePlatform({ prompt: '웹 화면에 버튼을 추가해줘', dependencies: webDeps });
    expect(d).toMatchObject({ platform: 'web', canonical: 'web', confidence: 'high' });
    expect(d.evidence).toContainEqual({ kind: 'prompt', value: '웹', signals: 'web' });
    expect(d.evidence).toContainEqual({ kind: 'dependency', value: WEB_PACKAGE, signals: 'web' });
  });

  it('routes an explicit React Native request in an Expo project to react-native', () => {
    const d = resolvePlatform({
      prompt: 'React Native 화면에 Box를 추가해줘',
      dependencies: nativeDeps,
      projectFiles: ['app.json', 'src/App.tsx'],
    });
    expect(d).toMatchObject({ platform: 'react-native', confidence: 'high' });
    expect(d.evidence).toContainEqual({
      kind: 'project-file',
      value: 'app.json',
      via: 'expo/metro config',
      signals: 'react-native',
    });
  });

  it('infers the platform from dependencies when the prompt is silent', () => {
    expect(resolvePlatform({ prompt: '검색창을 추가해줘', dependencies: webDeps })).toMatchObject({
      platform: 'web',
      confidence: 'medium',
    });
    expect(resolvePlatform({ prompt: '카드를 만들어줘', dependencies: nativeDeps })).toMatchObject({
      platform: 'react-native',
      confidence: 'medium',
    });
  });

  it('returns none when the project has no UI package installed', () => {
    const d = resolvePlatform({ prompt: '날짜 포맷 헬퍼를 만들어줘', dependencies: {} });
    expect(d).toMatchObject({ platform: 'none', canonical: 'none', confidence: 'high' });
    expect(d.evidence).toContainEqual({
      kind: 'dependency-absent',
      value: 'no @berrypjh UI package',
      signals: null,
    });
  });

  it('routes to both only when the request explicitly covers both platforms', () => {
    expect(
      resolvePlatform({ prompt: '웹과 앱 양쪽에서 같은 테마를 쓰게 해줘', dependencies: bothDeps }),
    ).toMatchObject({ platform: 'both', confidence: 'high' });

    // 양쪽 패키지가 깔려 있어도 요구가 한쪽이면 한쪽으로 간다.
    expect(resolvePlatform({ prompt: '웹 진입점만 고쳐줘', dependencies: bothDeps })).toMatchObject(
      { platform: 'web' },
    );
  });

  it('declines instead of guessing when a mixed project gives no signal', () => {
    const d = resolvePlatform({ prompt: '버튼을 추가해줘', dependencies: bothDeps });
    expect(d).toMatchObject({ platform: 'ambiguous', canonical: null, confidence: 'low' });
  });

  it('declines instead of guessing when nothing is observable', () => {
    expect(resolvePlatform({ prompt: '버튼을 추가해줘' })).toMatchObject({
      platform: 'ambiguous',
      canonical: null,
    });
  });

  it('never routes a web-only project to react-native, and vice versa', () => {
    const rnAsk = resolvePlatform({
      prompt: 'React Native 화면을 만들어줘',
      dependencies: webDeps,
    });
    expect(rnAsk.platform).toBe('ambiguous');
    expect(rnAsk.evidence.some((e) => e.kind === 'conflict')).toBe(true);

    const webAsk = resolvePlatform({ prompt: '웹 페이지를 만들어줘', dependencies: nativeDeps });
    expect(webAsk.platform).toBe('ambiguous');
    expect(webAsk.evidence.some((e) => e.kind === 'conflict')).toBe(true);
  });

  it('uses target file paths as evidence', () => {
    expect(
      resolvePlatform({
        prompt: '테마를 적용해줘',
        dependencies: bothDeps,
        targetFiles: ['src/native/App.tsx'],
      }),
    ).toMatchObject({ platform: 'react-native', confidence: 'high' });
  });

  it('exposes evidence instead of an uncalibrated probability', () => {
    const d = resolvePlatform({ prompt: '웹 버튼', dependencies: webDeps });
    expect(['high', 'medium', 'low']).toContain(d.confidence);
    expect(d).not.toHaveProperty('score');
    expect(JSON.stringify(d)).not.toMatch(/0\.\d{2}/);
  });
});
