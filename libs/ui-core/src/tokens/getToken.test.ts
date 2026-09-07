/* eslint-disable @typescript-eslint/no-explicit-any */
import { getToken } from './getToken';

const tokens = {
  color: {
    primary: '#0000FF',
    neutral: '#888888',
  },
  spacing: {
    sm: '8px',
    md: '16px',
  },
};

describe('getToken', () => {
  it('단일 depth 경로에서 값을 읽는다', () => {
    expect(getToken(tokens, 'color' as any)).toBe(tokens.color);
  });

  it('leaf 값을 읽는다', () => {
    expect(getToken(tokens, 'color.primary')).toBe('#0000FF');
  });

  it('서로 다른 top-level 키를 구분해 읽는다', () => {
    expect(getToken(tokens, 'spacing.sm')).toBe('8px');
    expect(getToken(tokens, 'spacing.md')).toBe('16px');
  });
});

/**
 * 반환 타입이 값을 약속하므로 결손은 전부 던진다.
 * `undefined` 를 돌려주면 정적 타입이 거짓이 되고 실패가 렌더까지 지연된다.
 */
describe('getToken 은 결손을 조용히 넘기지 않는다', () => {
  it('마지막 leaf 가 없으면 던진다', () => {
    expect(() => getToken(tokens as any, 'color.unknown' as any)).toThrow(
      '"color.unknown" is not in the token tree — "unknown" is missing',
    );
  });

  it('중간 노드가 없으면 던진다', () => {
    expect(() => getToken(tokens as any, 'typography.body.medium' as any)).toThrow(
      '"typography" is missing',
    );
  });

  it('중간 노드가 null 이면 던진다', () => {
    expect(() => getToken({ a: null } as any, 'a.b' as any)).toThrow(
      'cannot read "a.b" — "b" has no object to read from',
    );
  });

  it('중간 노드가 primitive 이면 던진다', () => {
    expect(() => getToken({ a: 42 } as any, 'a.b' as any)).toThrow('has no object to read from');
  });

  it('값이 명시적으로 undefined 여도 키가 있으면 읽는다', () => {
    // 결손(키 없음)과 값이 `undefined` 인 것을 구분한다.
    expect(getToken({ a: undefined } as any, 'a' as any)).toBeUndefined();
  });
});
