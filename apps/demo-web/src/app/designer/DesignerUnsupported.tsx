import { Page, Panel } from '../shell/ui';

/**
 * Designer MVP 가 지원하지 않는 pathname.
 *
 * redirect 하지 않는다 — `/tokens?view=designer` 를 `/components/button?view=designer` 로
 * 보내면 사용자가 요청한 context 가 조용히 바뀐다. 현재 URL 을 그대로 두고 지원 범위를 알린다.
 * 가짜 Designer content 도 그리지 않는다.
 *
 * 여기에 컴포넌트 목록을 두지 않는다 — 이동은 사이드바가 맡는다. 사이드바 링크는 현재 query 를
 * 실어 보내므로 거기서 컴포넌트를 고르면 Designer 를 벗어나지 않는다.
 */
export const DesignerUnsupported = ({ pathname }: { pathname: string }) => (
  <Page
    title="Designer"
    lead="Designer View 는 아직 컴포넌트 경로만 지원한다"
    testId="designer-unsupported"
  >
    <Panel>
      <p className="text-text-default text-xsm leading-xsm break-keep">
        <code className="font-mono text-xxsm text-text-light">{pathname}</code> 에는 등록된
        presentation definition 이 없다. 사이드바에서 컴포넌트를 고르면 Designer View 가 유지된 채
        이동한다.
      </p>
    </Panel>
  </Page>
);
