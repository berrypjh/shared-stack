import { useState } from 'react';

import { Button, List, ListItem, Popover, PopoverPanel, PopoverTrigger } from '@berrypjh/react-ui';

import type { ComponentProps, ReactNode } from 'react';

import {
  type ComparisonOption,
  type ComponentPresentationData,
  narrowOverrides,
  type PreviewScenario,
  type ScenarioOverrides,
} from '../model';
import { usePreviewSurface } from '../previewSurface';

/**
 * Popover fixture.
 *
 * Popover 는 **portal 을 쓰지 않는다** — 패널이 DOM 상 그 자리에 그려지므로 앱의 stacking
 * context 안에서 겹침이 결정된다. 위치도 라이브러리가 정하지 않는다. 둘 다 소비자의 몫이라,
 * fixture 가 앵커와 z 층을 소유한다. 구현을 복사하는 것이 아니라 public 컴포넌트를 조립한다.
 */
const Anchor = ({ children }: { children: ReactNode }) => (
  <div className="relative inline-block">{children}</div>
);

/**
 * 패널의 면·여백·그림자는 라이브러리가 토큰으로 그린다. 여기서 주는 것은 자리와 폭뿐이다.
 *
 * 비교 표 안에서는 띄우지 않고 트리거 아래 흐름에 둔다 — 떠 있으면 칸 높이에 들어가지 않아
 * 표의 스크롤 영역 안에서 잘린다 (`previewSurface`).
 */
const FloatingPanel = (props: ComponentProps<typeof PopoverPanel>) => {
  const inMatrix = usePreviewSurface() === 'matrix';
  return (
    <PopoverPanel
      {...props}
      className={inMatrix ? 'mt-xs w-[240px]' : 'absolute top-full left-0 mt-xs z-10 min-w-[240px]'}
    />
  );
};

const Body = ({ children }: { children: ReactNode }) => (
  <p className="text-text-default text-xsm break-keep">{children}</p>
);

type PopoverScenarioProps = Pick<ComponentProps<typeof Popover>, 'semantics' | 'open'>;

type PopoverScenario = PreviewScenario<PopoverScenarioProps>;

const SCENARIOS: readonly PopoverScenario[] = [
  { id: 'disclosure', sectionId: 'disclosure', label: '도움말 열기', props: {} },
  { id: 'dialog', sectionId: 'dialog', label: '계정 메뉴', props: { semantics: 'dialog' } },
  { id: 'light-dismiss', sectionId: 'light-dismiss', label: 'light dismiss', props: {} },
  { id: 'stacking', sectionId: 'stacking', label: '아래 카드 위로 뜨기', props: {} },
];

const SEMANTICS_OPTIONS: readonly ComparisonOption[] = [
  { id: 'disclosure', label: 'Disclosure', value: 'disclosure' },
  { id: 'dialog', label: 'Dialog', value: 'dialog' },
];

const data: ComponentPresentationData<PopoverScenarioProps> = {
  id: 'popover',
  label: 'Popover',
  path: '/components/popover',
  group: 'overlay',
  lead: '트리거에 붙는 비모달 surface. 위치와 겹침은 소비자가 결정',
  defaultScenarioId: 'disclosure',
  sections: [
    {
      id: 'disclosure',
      label: 'disclosure',
      note: '기본 시맨틱. 트리거에 aria-expanded 만 붙고 패널에는 role 없음',
      scenarioIds: ['disclosure'],
    },
    {
      id: 'dialog',
      label: 'dialog',
      note: '열리면 포커스가 패널로 들어가고 닫히면 트리거로 복귀. 이름 필수',
      scenarioIds: ['dialog'],
    },
    {
      id: 'light-dismiss',
      label: 'light dismiss',
      note: '바깥을 누르거나 Escape 를 누르면 닫힘. 상태를 소비자가 들 수도 있음',
      scenarioIds: ['light-dismiss'],
    },
    {
      id: 'stacking',
      label: '앱이 정하는 겹침',
      note: 'portal 이 없으므로 패널의 z 층과 잘림은 소비자 책임',
      scenarioIds: ['stacking'],
      footnote: '뒤따르는 본문 카드. 패널이 이 카드 위에 떠야 정상',
    },
  ],
  scenarios: SCENARIOS,
  tokens: {
    /* 근거: `popover.scss` 의 `.ui-popover-panel` 선언 전체. */
    bindings: [
      {
        id: 'panel-surface',
        label: '패널 면과 글자',
        tokenIds: ['color.background.surface', 'color.text.default'],
      },
      {
        id: 'panel-border',
        label: '패널 테두리와 모서리',
        tokenIds: ['border.primary.width', 'color.stroke.default', 'radius.md'],
      },
      { id: 'panel-padding', label: '패널 여백', tokenIds: ['spacing.md'] },
      {
        id: 'panel-shadow',
        label: '패널 그림자',
        tokenIds: [
          'shadow.lg.1.offsetX',
          'shadow.lg.1.offsetY',
          'shadow.lg.1.blur',
          'shadow.lg.1.spread',
          'shadow.lg.1.color',
        ],
      },
    ],
    notes: [
      '그림자는 두 겹 — 위 목록은 첫 겹이고 `shadow.lg.2.*` 가 같은 구조로 한 겹 더 쌓임',
      '트리거의 token 은 트리거로 쓴 컴포넌트(여기서는 Button) 소유',
    ],
  },
  comparison: {
    catalogSymbol: 'Popover',
    properties: [
      {
        id: 'semantics',
        prop: 'semantics',
        label: 'Semantics',
        control: { kind: 'enum', options: SEMANTICS_OPTIONS },
      },
      { id: 'open', prop: 'open', label: 'Open', control: { kind: 'boolean' } },
    ],
    stateMatrix: {
      baseScenarioId: 'disclosure',
      states: [
        // 닫힘도 prop 으로 고정한다. 비워 두면 uncontrolled 라 누를 때 열려 열 이름과 어긋난다.
        { id: 'closed', label: '닫힘', kind: 'prop', props: { open: false } },
        { id: 'open', label: '열림', kind: 'prop', props: { open: true } },
      ],
    },
    notes: [
      'open 은 controlled 공개 prop 이라 열린 상태를 그대로 재현 — 이 컴포넌트는 pseudo-state 없이 State Matrix 성립',
      'semantics 는 패널이 닫혀 있으면 트리거가 똑같아 보임. prop grid 가 아니라 curated scenario 로 그 차이를 표시',
    ],
  },
};

const MenuAction = ({ children }: { children: ReactNode }) => (
  <button
    type="button"
    className="w-full text-left px-sm py-xs rounded-sm text-text-default hover:bg-background-default"
  >
    {children}
  </button>
);

/** controlled 상태는 hook 이 필요하므로 scenario data 가 아니라 fixture 컴포넌트가 소유한다. */
const LightDismiss = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Anchor>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <Button variant="outlined">{open ? '열림' : '닫힘'}</Button>
          </PopoverTrigger>
          <FloatingPanel>
            <Body>바깥 클릭 · Escape 로 닫기. 버튼 라벨이 controlled 상태를 그대로 표시</Body>
          </FloatingPanel>
        </Popover>
      </Anchor>
      <span className="text-text-light text-xxsm" data-testid="popover-state">
        open: {String(open)}
      </span>
    </>
  );
};

const render = ({ id, label, props }: PopoverScenario): ReactNode => {
  if (id === 'light-dismiss') return <LightDismiss />;

  if (id === 'dialog') {
    return (
      <Anchor>
        <Popover {...props}>
          <PopoverTrigger>
            <Button variant="contained">{label}</Button>
          </PopoverTrigger>
          {/* dialog 로 올리면 접근 가능한 이름을 반드시 준다 — 이름 없는 dialog 는 정체를 잃는다. */}
          <FloatingPanel aria-label={label}>
            <List className="text-xsm">
              <ListItem>
                <MenuAction>프로필</MenuAction>
              </ListItem>
              <ListItem>
                <MenuAction>설정</MenuAction>
              </ListItem>
            </List>
          </FloatingPanel>
        </Popover>
      </Anchor>
    );
  }

  return (
    <Anchor>
      <Popover {...props}>
        <PopoverTrigger>
          <Button variant="outlined">{label}</Button>
        </PopoverTrigger>
        <FloatingPanel>
          <Body>
            {id === 'stacking'
              ? '`z-10` 을 주지 않으면 뒤따르는 카드가 패널을 덮음. 라이브러리는 z-index 를 정하지 않음'
              : '패널의 배경·테두리·그림자는 라이브러리가 semantic 토큰으로 그림. 테마를 바꾸면 이 카드도 함께 바뀜'}
          </Body>
        </FloatingPanel>
      </Popover>
    </Anchor>
  );
};

export const popoverPresentation = {
  data,
  renderScenario: (scenarioId: string, overrides?: ScenarioOverrides): ReactNode => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    // 새 객체를 만든다 — 원본 scenario 는 그대로 남는다.
    return render({
      ...scenario,
      props: { ...scenario.props, ...narrowOverrides<PopoverScenarioProps>(overrides) },
    });
  },
};
