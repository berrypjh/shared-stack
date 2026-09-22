import { editorHref, isCanonicalPath, templateOf } from './editor-link';

const ROOT = '/Users/me/shared-stack';

describe('editorHref', () => {
  it('opens the file in the configured editor with the absolute path', () => {
    expect(editorHref('libs/react-ui/src/index.ts', { root: ROOT, editor: 'cursor' })).toBe(
      'cursor://file/Users/me/shared-stack/libs/react-ui/src/index.ts',
    );
    expect(editorHref('README.md', { root: ROOT, editor: undefined })).toBe(
      'vscode://file/Users/me/shared-stack/README.md',
    );
  });

  it('is absent outside the dev server, so no machine path reaches a build', () => {
    expect(editorHref('README.md', { root: null, editor: 'vscode' })).toBeNull();
  });

  it('refuses paths that are not repository-relative', () => {
    for (const path of ['../etc/passwd', '/etc/passwd', 'a//b', 'a\\b', 'https://x', 'a#b', '']) {
      expect(editorHref(path, { root: ROOT, editor: 'vscode' })).toBeNull();
      expect(isCanonicalPath(path)).toBe(false);
    }
  });

  it('encodes spaces and Hangul so the URL stays one token', () => {
    expect(editorHref('docs/한글 이름.md', { root: ROOT, editor: 'zed' })).toBe(
      'zed://file/Users/me/shared-stack/docs/%ED%95%9C%EA%B8%80%20%EC%9D%B4%EB%A6%84.md',
    );
  });
});

describe('templateOf', () => {
  it('takes a known editor name in any case, a custom template, or falls back to vscode', () => {
    expect(templateOf(' Cursor ')).toBe('cursor://file{path}');
    expect(templateOf('mate://open?url=file://{path}')).toBe('mate://open?url=file://{path}');
    expect(templateOf('no-such-editor')).toBe('vscode://file{path}');
  });
});
