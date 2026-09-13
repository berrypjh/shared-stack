import { useMemo, useState } from 'react';

import type { ThemeName } from '@berrypjh/react-ui';

import type { DesignerPropertyValue, PropertyOverrides } from '../presentation/model';
import type { WebPresentation } from '../presentation/registry';
import { Page } from '../shell/ui';
import { useMediaQuery } from '../shell/useMediaQuery';

import { DesignerCanvas } from './DesignerCanvas';
import { DesignerInspector } from './DesignerInspector';
import { DesignerSheet } from './DesignerSheet';

/**
 * Inspector 를 Canvas 옆에 함께 펼칠 폭. Tailwind 기본 `xl` 이다.
 *
 * 기준은 링크 열 개수가 아니라 **Canvas 에 남는 폭**이다. AppShell 사이드바(220px)와 본문
 * 여백을 빼면 Canvas 는 1280px 에서 약 670px, 1024px 에서는 약 420px 만 남는다. 420px 은
 * Inspector 를 위해 Canvas 를 내주는 셈이라, `lg` 에서는 Canvas 가 전폭을 쓰고 Inspector 는
 * sheet 로 연다.
 */
const WIDE = '(min-width: 1280px)';

/**
 * Designer Workspace session.
 *
 * scenario 선택과 property override 를 여기서 들고 있다. Canvas 와 Inspector 가 같은 값을 봐야
 * 하기 때문이고, 두 region 이 각자 복제하면 화면이 갈린다. **선택된 컴포넌트 · ViewMode ·
 * theme 은 여기 복제하지 않는다** — 각각 URL 과 App state 가 canonical source 다.
 *
 * 컴포넌트 목록은 여기 없다 — AppShell 사이드바가 이 앱의 유일한 내비게이션이고, 컴포넌트
 * 검색도 그 위에 있다. Designer 가 같은 목록을 한 번 더 그리면 landmark 와 `aria-current` 가
 * 두 벌이 되고 Canvas 왼쪽에 링크 열이 두 개 붙는다.
 *
 * 폭에 따라 Inspector 를 **한 벌만** mount 한다. CSS 로 두 벌을 그리면 같은 landmark 와 접근
 * 가능한 이름이 DOM 에 둘씩 생겨 보조 기술이 어느 쪽인지 알 수 없다.
 */
const DesignerSession = ({
  presentation,
  theme,
}: {
  presentation: WebPresentation;
  theme: ThemeName;
}) => {
  const { data } = presentation;
  const wide = useMediaQuery(WIDE, true);

  const [requestedId, setRequestedId] = useState(data.defaultScenarioId);
  const [overrides, setOverrides] = useState<PropertyOverrides>({});

  const active =
    data.scenarios.find((s) => s.id === requestedId) ??
    data.scenarios.find((s) => s.id === data.defaultScenarioId) ??
    data.scenarios[0];

  const comparison = data.comparison;

  /**
   * 이 definition 이 선언한 property 밖의 override 는 버린다. 컴포넌트가 바뀌면 session 이
   * 다시 mount 되지만, scenario 만 바뀌었을 때도 지원되지 않는 override 가 남지 않게 한 번 더 거른다.
   */
  const supported = useMemo(() => {
    const props = new Set((comparison?.properties ?? []).map((p) => p.prop));
    return Object.fromEntries(
      Object.entries(overrides).filter(([prop]) => props.has(prop)),
    ) as PropertyOverrides;
  }, [comparison, overrides]);

  /**
   * 지금 켜져 있는 state. state 의 prop 이 전부 현재 override 와 같을 때 그 state 가 활성이다.
   * Token Inspector 가 state 로 좁힌 binding(예: disabled 색)을 이걸로 걸러낸다.
   */
  const activeStateIds = (comparison?.stateMatrix?.states ?? [])
    .filter((state) =>
      Object.entries(state.props).every(([prop, value]) => supported[prop] === value),
    )
    .map((state) => state.id);

  const setOverride = (prop: string, value: DesignerPropertyValue | undefined) =>
    setOverrides((current) => {
      // 새 객체를 만든다 — 기존 state 를 mutate 하지 않는다.
      const next = { ...current };
      if (value === undefined) delete next[prop];
      else next[prop] = value;
      return next;
    });

  const selectScenario = (scenarioId: string) => {
    setRequestedId(scenarioId);
    // scenario 를 바꾸면 이전 scenario 위에서 고른 override 는 문맥을 잃는다.
    setOverrides({});
  };

  const canvas = (
    <DesignerCanvas
      presentation={presentation}
      active={active}
      overrides={supported}
      onSelectScenario={selectScenario}
    />
  );

  const inspector = (
    <DesignerInspector
      componentLabel={data.label}
      comparison={comparison}
      tokens={data.tokens}
      overrides={supported}
      onPropertyChange={setOverride}
      onReset={() => setOverrides({})}
      scenarioId={active?.id}
      stateIds={activeStateIds}
      theme={theme}
    />
  );

  if (wide) {
    /*
      Canvas | Inspector. Inspector 는 고정 폭이고 Canvas 가 남은 폭을 전부 받는다 —
      비율로 나누면 창이 좁아질 때 Canvas 가 먼저 줄어든다.
    */
    return (
      <div className="flex gap-xl" data-testid="designer-wide">
        <div className="flex-1 min-w-0">{canvas}</div>
        <div className="w-[300px] shrink-0">{inspector}</div>
      </div>
    );
  }

  /*
    좁은 화면: Canvas 가 전폭을 쓰고 Inspector 는 trigger 로 연다. 데스크톱 열을 비율만 줄여
    밀어 넣지 않는다. 컴포넌트 이동은 전역 메뉴(AppShell 드로어)가 맡는다 — Designer 전용
    목록을 하나 더 만들지 않는다.
  */
  return (
    <div className="flex flex-col gap-xl" data-testid="designer-compact">
      <div className="flex flex-wrap gap-md">
        <DesignerSheet
          triggerLabel="Inspector"
          title="Inspector"
          closeLabel="Inspector 닫기"
          testId="inspector-sheet"
        >
          {inspector}
        </DesignerSheet>
      </div>
      {canvas}
    </div>
  );
};

/**
 * Designer Workspace.
 *
 * 시각 테마는 `AppShell` 의 `ThemeProvider` 가 준다 — canvas 는 같은 `data-theme` 아래에 있다.
 * `theme` 이름을 따로 받는 것은 Token Inspector 가 그 theme 의 **값**을 catalog 에서 읽어야
 * 하기 때문이고, App 의 single state 를 그대로 전달받는다 — Designer 전용 theme state 가 아니다.
 *
 * `key` 로 컴포넌트가 바뀔 때 session 을 다시 mount 한다 — 이전 컴포넌트의 scenario id 나
 * override 가 남아 있을 수 없게 하는 가장 단순한 방법이다.
 */
export const DesignerWorkspace = ({
  presentation,
  theme,
}: {
  presentation: WebPresentation;
  theme: ThemeName;
}) => (
  <Page
    title={`${presentation.data.label} · Designer`}
    lead={presentation.data.lead}
    testId="designer-workspace"
  >
    <DesignerSession key={presentation.data.id} presentation={presentation} theme={theme} />
  </Page>
);
