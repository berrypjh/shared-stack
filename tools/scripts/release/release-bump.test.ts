import { describe, expect, it } from 'vitest';

import { hasBreakingChange, hasReleaseFeature, toReleaseScopes } from './release-bump';

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

  it('detects a breaking feat commit marked with !', () => {
    expect(hasReleaseFeature(['feat(react-ui)!: prop 제거'], scopes)).toBe(true);
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

describe('hasBreakingChange', () => {
  it('detects ! in the subject with or without a scope', () => {
    expect(hasBreakingChange(['feat(react-ui)!: prop 제거'])).toBe(true);
    expect(hasBreakingChange(['\nrefactor!: 구조 변경\n'])).toBe(true);
  });

  it('detects BREAKING CHANGE and BREAKING-CHANGE footers', () => {
    expect(hasBreakingChange(['fix(ui-core): 수정\n\nBREAKING CHANGE: size 제거'])).toBe(true);
    expect(hasBreakingChange(['fix(ui-core): 수정\n\nBREAKING-CHANGE: size 제거'])).toBe(true);
  });

  it('ignores ordinary commits and ! outside the subject', () => {
    expect(
      hasBreakingChange(['feat(react-ui): 추가', 'fix: 수정\n\nfeat!: 본문 속 예시', '']),
    ).toBe(false);
  });
});
