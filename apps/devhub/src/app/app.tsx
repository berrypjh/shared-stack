import { useRef } from 'react';

import { INSPECTOR_ID, MAIN_CONTENT_ID, useRouteFocus } from '@berrypjh/devhub-ui';
import { SkipLink } from '@berrypjh/react-ui';

import { RouterAdapter } from '@/components/shell/router-adapter';

import { AppRoutes } from './router';

import '@berrypjh/react-ui/styles.css';

/**
 * 선택만 바뀌는 그림 화면: 아키텍처 전체, 흐름 하나. 같은 화면 안의 이동은 그림 · 포커스를 그대로 둔다.
 * 다른 흐름으로 가면 다른 화면이다.
 */
const CANVAS_VIEWS = [/^\/architecture(?=\/|$)/, /^\/journeys\/[^/]+(?=\/|$)/];

/** 이동 뒤 포커스를 둘 자리(보이지 않음), 건너뛰기 링크 둘, 그리고 route. 건너뛰기 링크는 문서의 것이라 route 셸 밖에 둔다. */
const Document = () => {
  const start = useRef<HTMLDivElement>(null);
  useRouteFocus(start, CANVAS_VIEWS);
  return (
    <>
      <div ref={start} tabIndex={-1} data-focus-start className="outline-none" />
      <SkipLink targetId={MAIN_CONTENT_ID}>본문으로 건너뛰기</SkipLink>
      <SkipLink targetId={INSPECTOR_ID}>상세 정보로 건너뛰기</SkipLink>
      <AppRoutes />
    </>
  );
};

/** 라우터 접점(`RouterAdapter`) 안의 문서 전체. */
const App = () => (
  <RouterAdapter>
    <Document />
  </RouterAdapter>
);

export default App;
