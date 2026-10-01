import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';

import App from '../app';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const settingsRegion = () =>
  within(within(screen.getByRole('main')).getByRole('region', { name: '설정' }));

describe('package settings', () => {
  it('draws one table per setting file, titled by the import specifier, with a row per setting', () => {
    renderAt('/packages/eslint-config');
    const pkg = catalog.packages.find((p) => p.id === 'eslint-config');
    const paths = [...new Set(pkg?.settings?.map((item) => item.evidence.path))];
    expect(settingsRegion().getAllByRole('table')).toHaveLength(paths.length);
    for (const entry of pkg?.entries ?? []) {
      const table = within(
        settingsRegion().getByRole('table', { name: `${entry.specifier} 설정` }),
      );
      const items = pkg?.settings?.filter((item) => item.evidence.path === entry.target) ?? [];
      expect(table.getAllByRole('row')).toHaveLength(items.length + 1);
      for (const item of items) {
        expect(table.getAllByText(item.evidence.symbol).length).toBeGreaterThan(0);
        expect(table.getAllByText(item.value).length).toBeGreaterThan(0);
        expect(table.getAllByText(item.note).length).toBeGreaterThan(0);
      }
    }
  });

  it('draws no settings section for a package that declares none', () => {
    renderAt('/packages/react-ui');
    expect(within(screen.getByRole('main')).queryByRole('region', { name: '설정' })).toBeNull();
  });
});
