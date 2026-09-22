import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import type { Platform } from '@/domain/model';
import { SECTIONS } from '@/lib/catalog/entities';
import { APP_ROLE, GAP_KIND, PACKAGE_KIND, PLATFORM, VISIBILITY } from '@/lib/catalog/labels';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

import { EntityLink, LINK } from '../ui/entity-link';

import { SnapshotBlock } from './snapshot-block';

const { repository, packages, applications, tools, documents } = catalog;
const PLATFORMS: Platform[] = ['web', 'react-native', 'platform-neutral', 'node'];
const ROWS = 'grid grid-cols-[7rem_minmax(0,1fr)] gap-x-md gap-y-sm typo-body-small';

const purposeDocument = documents.find((doc) => doc.path === repository.purpose.source.path);

/** 저장소가 무엇인지(문서 인용), 어디에 있는지, 무엇을 모르는지. */
const RepositorySummary = () => (
  <WorkspaceSection id="overview-repository" title="저장소">
    <blockquote className="flex flex-col gap-xs border-l-2 border-stroke-primary pl-md">
      <p className="typo-body-small">{repository.purpose.text}</p>
      <footer className="typo-caption-small text-text-light">
        출처:{' '}
        {purposeDocument ? (
          <Link to={`/documents/${purposeDocument.id}`} className={LINK}>
            {purposeDocument.path}
          </Link>
        ) : (
          repository.purpose.source.path
        )}
      </footer>
    </blockquote>
    <dl className={ROWS}>
      <dt className="text-text-light">원격</dt>
      <dd className="devhub-code">{repository.webUrl}</dd>
      <dt className="text-text-light">기본 브랜치</dt>
      <dd className="font-mono">{repository.defaultBranch}</dd>
      <dt className="text-text-light">패키지 매니저</dt>
      <dd>{repository.packageManager}</dd>
    </dl>
    {repository.gaps?.map((gap) => (
      <p key={gap.note} className="typo-caption-small text-text-warning">
        {GAP_KIND[gap.kind]} — {gap.note}
      </p>
    ))}
  </WorkspaceSection>
);

/** 카탈로그 섹션과 항목 수. 개수는 카탈로그에서 센 것이다. */
const SectionCounts = () => (
  <WorkspaceSection id="overview-sections" title="항목">
    <List className="flex flex-col divide-y divide-stroke-light">
      {SECTIONS.map((section) => (
        <ListItem key={section.id} className="flex items-center justify-between py-sm">
          <Link to={section.path} className={`typo-body-small ${LINK}`}>
            {section.title}
          </Link>
          <span className="typo-body-small">{section.entities.length}</span>
        </ListItem>
      ))}
    </List>
  </WorkspaceSection>
);

/** 플랫폼마다 그 위에서 도는 패키지 · 앱. 도구는 모두 Node 라 개수만 적는다. */
const PlatformSummary = () => (
  <WorkspaceSection id="overview-platforms" title="플랫폼">
    <dl className={ROWS}>
      {PLATFORMS.map((platform) => {
        const ids = [...packages, ...applications]
          .filter((entity) => entity.platform === platform)
          .map((entity) => entity.id);
        const toolCount = tools.filter((tool) => tool.platform === platform).length;
        return (
          <div key={platform} className="contents">
            <dt className="text-text-light">{PLATFORM[platform]}</dt>
            <dd className="flex flex-wrap gap-x-md gap-y-xs">
              {ids.map((id) => (
                <EntityLink key={id} id={id} />
              ))}
              {toolCount > 0 && (
                <Link to="/engineering" className={LINK}>
                  도구 {toolCount}개
                </Link>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  </WorkspaceSection>
);

/** 패키지를 종류별로, 공개 여부와 함께. 공개 여부는 매니페스트의 `private` 에서 온다. */
const PackageSummary = () => (
  <WorkspaceSection id="overview-packages" title="패키지">
    <List className="flex flex-col divide-y divide-stroke-light">
      {packages.map((pkg) => (
        <ListItem key={pkg.id} className="flex flex-col gap-2xs py-sm">
          <span className="flex flex-wrap items-baseline gap-x-md">
            <EntityLink id={pkg.id} />
            <span className="font-mono typo-caption-small text-text-light">{pkg.packageName}</span>
          </span>
          <span className="typo-caption-small text-text-light">
            {PACKAGE_KIND[pkg.kind]} · {VISIBILITY[pkg.visibility]} · {PLATFORM[pkg.platform]}
          </span>
        </ListItem>
      ))}
    </List>
  </WorkspaceSection>
);

const ApplicationSummary = () => (
  <WorkspaceSection id="overview-applications" title="애플리케이션">
    <List className="flex flex-col divide-y divide-stroke-light">
      {applications.map((app) => (
        <ListItem key={app.id} className="flex flex-col gap-2xs py-sm">
          <EntityLink id={app.id} />
          <span className="typo-caption-small text-text-light">
            {APP_ROLE[app.role]} · {PLATFORM[app.platform]} — {app.purpose}
          </span>
        </ListItem>
      ))}
    </List>
  </WorkspaceSection>
);

/** 저장소의 가운데 화면. 카탈로그와 스냅샷에서만 요약하고, 개수는 데이터에서 직접 센다. */
export const RepositoryOverview = () => (
  <>
    <RepositorySummary />
    <SnapshotBlock snapshot={SNAPSHOT} />
    <SectionCounts />
    <PlatformSummary />
    <PackageSummary />
    <ApplicationSummary />
  </>
);
