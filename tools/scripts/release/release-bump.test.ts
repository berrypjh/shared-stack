import { describe, expect, it } from 'vitest';

import { hasReleaseFeature, toReleaseScopes } from './release-bump';

const scopes = ['react-ui', 'ui-core'];

describe('toReleaseScopes', () => {
  it('strips the npm scope from release project names', () => {
    expect(toReleaseScopes(['@berrypjh/react-ui', '@berrypjh/tsconfig'])).toEqual([
      'react-ui',
      'tsconfig',
    ]);
  });
});

describe('hasReleaseFeature', () => {
  it('detects a feat commit on a release scope', () => {
    expect(hasReleaseFeature(['fix(ui-core): 수정', 'feat(react-ui): Stack 추가'], scopes)).toBe(
      true,
    );
  });

  it('detects a release scope inside a multi-scope feat commit', () => {
    expect(hasReleaseFeature(['feat(demo-web, ui-core): 계약 추가'], scopes)).toBe(true);
  });

  it('ignores feat commits outside release scopes', () => {
    expect(
      hasReleaseFeature(['feat(demo-web): 페이지 추가', 'feat(scripts): CLI 추가'], scopes),
    ).toBe(false);
  });

  it('ignores non-feat commits and scope-less feat commits on release scopes', () => {
    expect(
      hasReleaseFeature(
        ['fix(react-ui): 수정', 'docs(ui-core): 문서', 'feat: 전역 기능', ''],
        scopes,
      ),
    ).toBe(false);
  });
});
