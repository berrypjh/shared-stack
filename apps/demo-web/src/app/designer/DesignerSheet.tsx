import { Chip, IconButton, Popover, PopoverPanel, PopoverTrigger } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

/** 닫기 아이콘. 아이콘은 소비자가 소유한다 — 라이브러리는 아이콘 세트를 들고 있지 않다. */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 좁은 화면에서 Library·Inspector 를 담는 side sheet.
 *
 * `react-ui` 에는 Drawer 가 없다. 있다고 가정해 import 하지 않고, **있는 것**으로 만든다 —
 * `Popover semantics="dialog"` 가 이 요구사항을 그대로 갖고 있다: 트리거의 `aria-expanded` ·
 * `aria-controls`, 열릴 때 패널 안으로 포커스 진입, 닫힐 때 트리거로 포커스 복귀, Escape 닫기,
 * 바깥 클릭 닫기. 직접 구현하면 그 중 하나를 빠뜨린다.
 *
 * Popover 는 portal 을 쓰지 않으므로 겹침은 앱이 정한다. 이 앱의 층은 topbar `z-10`,
 * AppShell 드로어 `z-20` 이라 sheet 는 `z-30` 에 둔다 — 전역 메뉴와 층이 겹치지 않는다.
 *
 * 전환 애니메이션을 넣지 않는다. 그래서 `prefers-reduced-motion` 규칙도 새로 만들지 않는다 —
 * 없는 움직임을 위한 대응 CSS 는 거짓이다.
 */
export const DesignerSheet = ({
  triggerLabel,
  title,
  closeLabel,
  testId,
  children,
}: {
  triggerLabel: string;
  /** 패널의 접근 가능한 이름. `role="dialog"` 는 이름이 필수다. */
  title: string;
  closeLabel: string;
  testId: string;
  children: ReactNode;
}) => (
  <Popover semantics="dialog">
    <PopoverTrigger>
      {/* 전역 햄버거로 위장하지 않는다 — 글자가 있는 버튼이고 이름이 스스로를 설명한다. */}
      <Chip size="sm" data-testid={`${testId}-trigger`}>
        {triggerLabel}
      </Chip>
    </PopoverTrigger>
    <PopoverPanel
      aria-label={title}
      data-testid={testId}
      className="fixed inset-y-0 right-0 z-30 w-[min(92vw,360px)] overflow-y-auto shadow-lg"
    >
      <div className="flex items-center justify-between gap-md mb-lg">
        <p className="text-text-default text-xsm font-semiBold">{title}</p>
        {/*
          닫기 버튼은 패널의 첫 포커스 가능 요소다 — dialog 진입 포커스가 여기에 앉으므로
          키보드 사용자가 열자마자 닫을 수 있다.
        */}
        <PopoverTrigger>
          <IconButton size="sm" aria-label={closeLabel} data-testid={`${testId}-close`}>
            <CloseIcon />
          </IconButton>
        </PopoverTrigger>
      </div>
      {children}
    </PopoverPanel>
  </Popover>
);
