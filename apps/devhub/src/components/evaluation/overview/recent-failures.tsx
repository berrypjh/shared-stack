import type { RunSummary } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { Section } from '@/components/evaluation/section';
import { LINK } from '@/components/ui/entity-link';
import { DOMAIN_LABEL } from '@/lib/evaluation/labels';
import { failureHref } from '@/lib/evaluation/links';

/** 원본 판정이 fail 인 행만. 각 행은 그 근거를 보여 주는 화면의 필터 · 행으로 간다. */
export const RecentFailures = ({ summary }: { summary: RunSummary }) => {
  const withoutValue = summary.observations.filter((item) => item.availability !== 'available');
  return (
    <Section title="최근 실패">
      <p className="typo-body-small break-keep text-text-light">
        원본 판정이 fail 인 행만 모았음. 실행하지 않았거나 값이 없는 관측 {withoutValue.length}
        개는 실패로 세지 않았음.
      </p>
      {summary.failures.length === 0 ? (
        <p className="typo-body-small text-text-default">원본 판정이 fail 인 행이 없음.</p>
      ) : (
        <List className="flex flex-col gap-sm typo-body-small">
          {summary.failures.map((failure, index) => (
            <ListItem key={`${failure.id}-${index}`}>
              <span aria-hidden className="mr-xs">
                ✕
              </span>
              <Link className={LINK} to={failureHref(failure, summary.metadata.runId)}>
                {failure.id}
              </Link>{' '}
              <span className="text-text-light">({DOMAIN_LABEL[failure.domain]})</span> —{' '}
              {failure.reason}
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
};
