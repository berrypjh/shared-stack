import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SnapshotBlock } from '@/components/overview/snapshot-block';
import { SnapshotSummary } from '@/components/overview/snapshot-summary';
import { RouterAdapter } from '@/components/shell/router-adapter';
import { catalog } from '@/data';
import type { RepositorySnapshot } from '@/domain/model';

import { OverviewPage } from './overview-page';

const renderOverview = () =>
  render(
    <MemoryRouter>
      <RouterAdapter>
        <OverviewPage />
      </RouterAdapter>
    </MemoryRouter>,
  );

const region = (name: string) => screen.getByRole('region', { name });

describe('overview', () => {
  it('quotes the repository purpose from its document', () => {
    renderOverview();
    const repository = within(region('저장소'));
    expect(repository.getByText(catalog.repository.purpose.text)).toBeTruthy();
    expect(repository.getByRole('link', { name: 'README.md' }).getAttribute('href')).toBe(
      '/documents/root-readme',
    );
    expect(repository.getByText(catalog.repository.webUrl)).toBeTruthy();
  });

  it('shows what the repository does not pin, instead of a guessed version', () => {
    renderOverview();
    expect(within(region('저장소')).getByText(/pnpm 버전이 고정되지 않는다/)).toBeTruthy();
    expect(within(region('저장소')).queryByText(/pnpm@/)).toBeNull();
  });

  it('lists every package with its catalog visibility and every application', () => {
    renderOverview();
    const packages = within(region('패키지'));
    for (const pkg of catalog.packages) {
      expect(packages.getByRole('link', { name: pkg.id }).getAttribute('href')).toBe(
        `/packages/${pkg.id}`,
      );
    }
    expect(packages.getAllByText(/공개\(배포\)/)).toHaveLength(
      catalog.packages.filter((pkg) => pkg.visibility === 'public').length,
    );
    const applications = within(region('애플리케이션'));
    for (const app of catalog.applications) {
      expect(applications.getByRole('link', { name: app.id })).toBeTruthy();
    }
  });

  it('counts sections from the catalog', () => {
    renderOverview();
    const sections = within(region('항목'));
    expect(sections.getByText(String(catalog.documents.length))).toBeTruthy();
    expect(sections.getByRole('link', { name: '엔지니어링' }).getAttribute('href')).toBe(
      '/engineering',
    );
  });
});

describe('snapshot', () => {
  const known: RepositorySnapshot = {
    source: 'git',
    commit: 'a'.repeat(40),
    branch: 'main',
    dirty: false,
    uncommitted: [],
  };
  const unavailable: RepositorySnapshot = {
    source: 'unavailable',
    commit: null,
    branch: null,
    dirty: null,
    uncommitted: null,
  };

  it('shows the commit, branch, and tree state it read', () => {
    render(<SnapshotBlock snapshot={known} />);
    expect(screen.getByText(known.commit as string)).toBeTruthy();
    expect(screen.getByText('main')).toBeTruthy();
    expect(screen.getByText('커밋과 같음')).toBeTruthy();
  });

  it('says what it could not read', () => {
    render(<SnapshotBlock snapshot={{ ...known, branch: null, dirty: null }} />);
    expect(screen.getByText(/알 수 없음 — detached HEAD/)).toBeTruthy();
    expect(screen.getByText(/알 수 없음 — git status/)).toBeTruthy();
  });

  it('never shows a commit when git could not be read', () => {
    const { container } = render(
      <>
        <SnapshotBlock snapshot={unavailable} />
        <SnapshotSummary snapshot={unavailable} />
      </>,
    );
    expect(screen.getByText(/스냅샷 커밋을 알 수 없습니다/)).toBeTruthy();
    expect(screen.getByText('스냅샷 커밋을 알 수 없음')).toBeTruthy();
    expect(container.textContent).not.toMatch(/[0-9a-f]{7,40}/);
  });
});
