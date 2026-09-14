import fs from 'node:fs/promises';

import { designSystemSchema } from '@berrypjh/observability-contracts';

import { afterEach, describe, expect, it } from 'vitest';

import { catalogText, makeDesignWorkspace } from '../__fixtures__/design-workspace';

import { collectDesignSystem } from './design-system';

const DT = 'libs/design-tokens';
const roots: string[] = [];

const collect = async (overrides: Record<string, string | null> = {}) => {
  const root = await makeDesignWorkspace(overrides);
  roots.push(root);
  return collectDesignSystem({ workspaceRoot: root });
};

afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

const tokenOf = (ds: Awaited<ReturnType<typeof collect>>, tokenPath: string) => {
  const token = ds.componentTokens.find((candidate) => candidate.path === tokenPath);
  if (!token) throw new Error(`no component token ${tokenPath}`);
  return token;
};

describe('collectDesignSystem — authored registry 와 생성 산출물을 구분한다', () => {
  it('계약을 통과하고 테마 이름·순서·selector·sourceDirs 를 source 에서 읽는다', async () => {
    const ds = await collect();
    expect(designSystemSchema.parse(ds)).toEqual(ds);
    expect(ds.registry.themes.map((theme) => [theme.name, theme.sourceDirs])).toEqual([
      ['light', ['light']],
      ['midnight', ['light', 'dark', 'midnight']],
    ]);
    expect(ds.categories.names).toEqual(['component']);
    expect(ds.catalog).toMatchObject({ status: 'valid', resolvedFor: 'web', rowCount: 4 });
    expect(ds.rnProvider).toMatchObject({
      status: 'present',
      modes: ['light', 'midnight'],
      satisfiesThemeName: true,
      missingThemes: [],
    });
    expect(ds.artifacts.every((artifact) => artifact.status === 'present')).toBe(true);
  });

  it('RN 생성 산출물이 없으면 missing 이고 RN 값·비교·선언 근거를 비운다', async () => {
    const ds = await collect({ [`${DT}/src/.generated/rn/themes/light/tokens.ts`]: null });
    expect(ds.artifacts).toContainEqual({
      theme: 'light',
      kind: 'rn-tokens',
      path: `${DT}/src/.generated/rn/themes/light/tokens.ts`,
      status: 'missing',
      reason: `${DT}/src/.generated/rn/themes/light/tokens.ts 이 없다`,
    });
    expect(tokenOf(ds, 'component.pressedOffset')).toMatchObject({
      emitted: { catalog: true, web: '0.0625rem', rn: null },
      platformComparison: 'unavailable',
    });
    const rnPressed = ds.signals.find((signal) => signal.id === 'Button.react-native.pressed');
    expect(rnPressed).toMatchObject({ declared: null });
    expect(designSystemSchema.parse(ds)).toEqual(ds);
  });

  it('Web rem 과 RN 숫자는 divergence 가 아니라 단위 변환이다', async () => {
    const ds = await collect();
    expect(tokenOf(ds, 'component.pressedOffset')).toMatchObject({
      cssVar: '--ds-component-pressed-offset',
      emitted: { catalog: true, web: '0.0625rem', rn: 1 },
      platformComparison: 'unit-conversion',
      lineage: { status: 'literal' },
    });
  });

  it('문서상 internal 인 token 이 실제로 내보내지면 그 사실을 따로 적는다', async () => {
    const ds = await collect();
    const button = tokenOf(ds, 'component.button');
    expect(button).toMatchObject({
      documentedPolicy: { policy: 'internal', source: { path: `${DT}/AGENTS.md`, line: 5 } },
      emitted: { catalog: true, web: '0.375rem 1rem', rn: '6 16' },
      lineage: { status: 'alias', references: ['spacing.sm', 'spacing.lg'] },
      consumers: [],
    });
    expect(ds.findings.map((finding) => finding.code)).toContain('internal-token-emitted');
  });

  it('authoring 근거가 없으면 lineage 는 unavailable 이다', async () => {
    const ds = await collect();
    expect(tokenOf(ds, 'component.field.height.sm')).toMatchObject({
      authored: null,
      lineage: { status: 'unavailable' },
    });
  });

  it('한정된 셀 밖의 소비는 unmappedConsumers 로만 남긴다', async () => {
    const ds = await collect();
    expect(ds.unmappedConsumers).toEqual([
      {
        token: 'component.pressedOffset',
        source: { path: 'libs/react-ui/src/components/chip/chip.scss', line: 3 },
      },
    ]);
    expect(ds.signals.find((signal) => signal.id === 'Button.react-native.pressed')).toMatchObject({
      observationKind: 'tested',
      tested: { execution: 'not-run' },
    });
  });

  it('source 와 어긋난 오래된 문서 설명은 finding 으로 보고만 한다', async () => {
    const ds = await collect();
    expect(ds.findings).toContainEqual(
      expect.objectContaining({
        code: 'doc-contradicts-source',
        doc: { path: `${DT}/AGENTS.md`, line: 3 },
      }),
    );
    expect(ds.findings).toContainEqual(
      expect.objectContaining({
        code: 'doc-stale-count',
        doc: { path: `${DT}/src/lib/tokens.ts`, line: 1 },
      }),
    );
  });

  it('WCAG 기준과 프로젝트 가시성 가드를 다른 label·basis 로 저장한다', async () => {
    const ds = await collect();
    expect(ds.contrastGuards).toEqual([
      expect.objectContaining({ id: 'wcag-aa-text', ratio: 4.5, basis: 'wcag-2.1-aa' }),
      expect.objectContaining({ id: 'wcag-aa-non-text', ratio: 3, basis: 'wcag-2.1-aa' }),
      expect.objectContaining({
        id: 'divider-visibility',
        ratio: 1.2,
        basis: 'project-visibility-guard',
        source: { path: `${DT}/src/lib/contrast.test.ts`, line: 3 },
      }),
    ]);
  });

  it('catalog 테마 순서가 registry 와 다르면 invalid 이고 catalog 값을 쓰지 않는다', async () => {
    const ds = await collect({ [`${DT}/dist/tokens.json`]: catalogText(['midnight', 'light']) });
    expect(ds.catalog.status).toBe('invalid');
    expect(tokenOf(ds, 'component.pressedOffset')).toMatchObject({
      cssVar: null,
      emitted: { catalog: false },
    });
  });

  it('RN provider 에서 빠진 테마를 적는다', async () => {
    const provider = `const DEFAULT_TOKENS_BY_MODE = {\n  light: Native.Light.tokens,\n} satisfies Record<ThemeName, RNTokens>;\n`;
    const ds = await collect({ 'libs/react-native-ui/src/theme/ThemeProvider.tsx': provider });
    expect(ds.rnProvider).toMatchObject({ missingThemes: ['midnight'], extraModes: [] });
  });
});
