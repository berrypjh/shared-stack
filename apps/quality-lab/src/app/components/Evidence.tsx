import type { EvidenceRef } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { Mono } from './Mono';

const Excerpt = ({ text }: { text: string }) => (
  <pre className="font-mono text-xxsm text-text-default whitespace-pre-wrap break-all mt-xs">
    {text}
  </pre>
);

const hashText = (sha: string) => (sha === 'unknown' ? 'sha 모름' : `sha256 ${sha.slice(0, 12)}`);

const EvidenceItem = ({ evidence }: { evidence: EvidenceRef }) => {
  switch (evidence.source) {
    case 'file':
      return (
        <>
          파일 <Mono>{evidence.path}</Mono> · {hashText(evidence.sha256)}
          {evidence.excerpt && <Excerpt text={evidence.excerpt} />}
        </>
      );
    case 'command':
      return (
        <>
          명령 <Mono>{evidence.commandId}</Mono>
          {evidence.exitCode === null ? ' · exit 없음' : ` · exit ${evidence.exitCode}`}
          {evidence.excerpt && <Excerpt text={evidence.excerpt} />}
        </>
      );
    case 'url':
      return <a href={evidence.url}>{evidence.url}</a>;
    case 'artifact':
      return (
        <>
          artifact <Mono>{evidence.path}</Mono> · {hashText(evidence.sha256)}
        </>
      );
  }
};

/** 관측의 출처. 경로·명령은 monospace, 발췌는 글로만 — HTML 로 해석하지 않는다. */
export const EvidenceList = ({ evidence }: { evidence: readonly EvidenceRef[] }) =>
  evidence.length === 0 ? (
    <span className="text-text-light">근거 없음</span>
  ) : (
    <List className="flex flex-col gap-xs">
      {evidence.map((item, index) => (
        <ListItem key={index}>
          <EvidenceItem evidence={item} />
        </ListItem>
      ))}
    </List>
  );
