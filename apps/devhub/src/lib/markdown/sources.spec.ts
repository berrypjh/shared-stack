import { catalog } from '../../data';

import { bundledPaths, loadRaw } from './sources';

describe('document sources', () => {
  it('bundle every cataloged document', () => {
    const bundled = new Set(bundledPaths());
    const pages = [...catalog.documents, ...catalog.records];
    expect(pages.filter((doc) => !bundled.has(doc.path)).map((doc) => doc.path)).toEqual([]);
  });

  it('load the raw text of a document', async () => {
    expect(await loadRaw('README.md')).toMatch(/^# @berrypjh\/shared-stack/);
    expect(loadRaw('no/such.md')).toBeUndefined();
  });
});
