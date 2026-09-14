import { cx } from './cx';

describe('cx', () => {
  describe('문자열/숫자 인자', () => {
    it('문자열 인자를 공백으로 결합한다', () => {
      expect(cx('foo', 'bar')).toBe('foo bar');
    });

    it('숫자 인자를 문자열로 변환해 포함한다', () => {
      expect(cx('foo', 1)).toBe('foo 1');
    });

    it('앞뒤 공백을 제거한다', () => {
      expect(cx('  foo  ', 'bar')).toBe('foo bar');
    });

    it('공백만 있는 문자열은 무시한다', () => {
      expect(cx('  ', 'foo')).toBe('foo');
    });

    it('빈 문자열은 무시한다', () => {
      expect(cx('', 'foo', '')).toBe('foo');
    });
  });

  describe('falsy 인자', () => {
    it('false를 무시한다', () => {
      expect(cx('foo', false, 'bar')).toBe('foo bar');
    });

    it('null을 무시한다', () => {
      expect(cx('foo', null, 'bar')).toBe('foo bar');
    });

    it('undefined를 무시한다', () => {
      expect(cx('foo', undefined, 'bar')).toBe('foo bar');
    });
  });

  describe('객체 인자', () => {
    it('truthy value를 가진 key만 포함한다', () => {
      expect(cx({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('null/undefined value를 가진 key는 제외한다', () => {
      expect(cx({ foo: true, bar: null, baz: undefined })).toBe('foo');
    });
  });

  describe('엣지 케이스', () => {
    it('인자가 없으면 빈 문자열을 반환한다', () => {
      expect(cx()).toBe('');
    });

    it('전부 falsy이면 빈 문자열을 반환한다', () => {
      expect(cx(false, null, undefined)).toBe('');
    });

    it('문자열과 객체를 혼합할 수 있다', () => {
      expect(cx('base', { active: true, disabled: false })).toBe('base active');
    });
  });
});
