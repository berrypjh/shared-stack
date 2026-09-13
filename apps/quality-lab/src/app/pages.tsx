import type { Fetcher } from './data/loadObservability';
import { RunList } from './run/RunList';
import { RunPanel } from './run/RunPanel';
import { Mono, Page } from './ui';

type DataProps = { fetcher: Fetcher; expectedSha: string };

export const OverviewPage = ({ fetcher, expectedSha }: DataProps) => (
  <Page
    title="개요"
    lead="shared-stack 패키지의 테스트·검증·번들·컨텍스트 신호를 실제 수집 결과로만 보여주는 화면입니다."
  >
    <RunPanel fetcher={fetcher} expectedSha={expectedSha} />
    <section aria-labelledby="local-dev-title">
      <h2 id="local-dev-title" className="text-text-default text-lg leading-lg font-semiBold">
        로컬 실행
      </h2>
      <p className="text-text-light text-xsm leading-xsm mt-sm break-keep">
        개발 서버는 <Mono>pnpm nx serve @berrypjh/quality-lab</Mono> 로 띄웁니다. 화면은{' '}
        <Mono>apps/quality-lab/public/observability</Mono> 에 export 된 JSON 만 읽습니다.
      </p>
    </section>
  </Page>
);

export const RunsPage = ({ fetcher, expectedSha }: DataProps) => (
  <Page title="실행 기록" lead="공개 index 에 있는 실행을 export 한 순서로 보여줍니다.">
    <RunList fetcher={fetcher} expectedSha={expectedSha} />
  </Page>
);
