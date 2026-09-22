'use client';

import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@berrypjh/react-ui';

import { Icon, type IconName } from '../ui/icon';

import { usePanZoom } from './use-pan-zoom';
import type { Rect, Size } from './viewport';

/** 범례 한 줄: 선 모양(dash, 실선이면 null) 또는 상자 모양. */
export type LegendItem = { label: string } & (
  | { line: string | null }
  | { box: 'solid' | 'dashed' | 'double' }
);

const KEYS: [keys: string[], action: string][] = [
  [['끌기'], '배경을 끌어 이동'],
  [['Ctrl', '휠'], '확대 · 축소 (macOS 는 ⌘)'],
  [['←', '↑', '→', '↓'], '그림에 포커스한 채 이동'],
  [['+', '−'], '확대 · 축소'],
  [['0'], '화면에 맞추기'],
];

const Sample = ({ item }: { item: LegendItem }) => (
  <svg aria-hidden="true" width="28" height="14" className="shrink-0 overflow-visible">
    {'line' in item ? (
      <line
        x1="0"
        y1="7"
        x2="28"
        y2="7"
        stroke="var(--ds-stroke-dark)"
        strokeWidth="1.5"
        strokeDasharray={item.line ?? undefined}
      />
    ) : (
      <rect
        x="4"
        y="1"
        width="20"
        height="12"
        rx="2"
        fill="var(--ds-background-surface)"
        stroke="var(--ds-stroke-dark)"
        strokeWidth={item.box === 'double' ? 3 : 1}
        strokeDasharray={item.box === 'dashed' ? '3 2' : undefined}
      />
    )}
  </svg>
);

/** "도움말": 조작 키와 범례. 접혀 있어도 그림의 설명(`aria-describedby`)이다. */
const CanvasHelp = ({ id, open, legend }: { id: string; open: boolean; legend: LegendItem[] }) => (
  <div
    id={id}
    hidden={!open}
    className="grid gap-lg rounded-md border border-stroke-light bg-background-surface p-md sm:grid-cols-2"
  >
    <div className="flex flex-col gap-sm">
      <p className="typo-caption-small text-text-light">조작</p>
      <ul className="flex flex-col gap-xs typo-caption-small">
        {KEYS.map(([keys, action]) => (
          <li key={action} className="flex items-center gap-sm">
            <span className="flex shrink-0 gap-2xs">
              {keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-sm border border-stroke-light bg-background-default px-xs font-mono"
                >
                  {key}
                </kbd>
              ))}
            </span>
            {action}
          </li>
        ))}
      </ul>
    </div>
    <div className="flex flex-col gap-sm">
      <p className="typo-caption-small text-text-light">범례</p>
      <ul className="flex flex-col gap-xs typo-caption-small">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-sm">
            <Sample item={item} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const ControlButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
}) => (
  <Button
    size="sm"
    variant="text"
    color="secondary"
    aria-label={label}
    title={label}
    onClick={onClick}
  >
    <Icon name={icon} />
  </Button>
);

type ViewportProps = {
  /** 그림 영역의 접근 이름. */
  label: string;
  content: Size;
  legend: LegendItem[];
  /** 보이는 한 줄 요약(개수 · 선택). 그림의 설명이기도 하다. */
  summary: string;
  /** 고른 노드의 사각형. 처음 열 때와 바뀔 때 보기 안으로 옮긴다. */
  selected?: Rect;
  /** 그림 층. `reveal` 은 노드가 포커스를 받을 때 부른다. */
  children: (api: { reveal: (rect: Rect) => void }) => ReactNode;
};

/**
 * 요약과 "도움말" 위, 잘린 보기 안에 변환된 한 층, 구석에 떠 있는 보기 조절.
 * 조절 묶음이 페이지 순서에서 그림 항목보다 앞이라 키보드가 먼저 닿는다.
 */
const CanvasSurface = ({
  label,
  content,
  legend,
  summary,
  selected,
  children,
  viewportClassName,
  onExpand,
}: ViewportProps & { viewportClassName: string; onExpand?: () => void }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const summaryId = useId();
  const [helpOpen, setHelpOpen] = useState(false);
  const { view, fit, zoomIn, zoomOut, reveal, handlers } = usePanZoom(viewportRef, content);

  // deep link 로 고른 노드가 맞춘 보기 밖에 있을 수 있다.
  const { x = null, y = null, width = 0, height = 0 } = selected ?? {};
  useEffect(() => {
    if (x !== null && y !== null) reveal({ x, y, width, height });
  }, [reveal, x, y, width, height]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p id={summaryId} className="typo-caption-small">
          {summary}
        </p>
        <Button
          size="sm"
          variant="text"
          color="secondary"
          aria-expanded={helpOpen}
          aria-controls={helpId}
          onClick={() => setHelpOpen((open) => !open)}
        >
          도움말
        </Button>
      </div>
      <CanvasHelp id={helpId} open={helpOpen} legend={legend} />
      <div className={`relative ${viewportClassName}`}>
        <div
          role="group"
          aria-label="보기 조절"
          className="absolute right-md bottom-md z-10 flex items-center divide-x divide-stroke-light rounded-md border border-stroke-light bg-background-surface shadow-xs"
        >
          <div className="flex items-center">
            <ControlButton label="축소" icon="minus" onClick={zoomOut} />
            <output className="min-w-11 text-center typo-caption-small">
              {Math.round(view.k * 100)}%
            </output>
            <ControlButton label="확대" icon="plus" onClick={zoomIn} />
          </div>
          <ControlButton label="화면에 맞추기" icon="fit" onClick={fit} />
          {onExpand && <ControlButton label="크게 보기" icon="expand" onClick={onExpand} />}
        </div>
        <div
          ref={viewportRef}
          role="group"
          aria-label={label}
          aria-describedby={`${summaryId} ${helpId}`}
          className="relative h-full cursor-grab touch-none overflow-hidden rounded-lg border border-stroke-light bg-background-default active:cursor-grabbing"
          {...handlers}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: content.width,
              height: content.height,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            }}
          >
            {children({ reveal })}
          </div>
        </div>
      </div>
    </>
  );
};

/** 이미 열려 있지 않으면 모달로 연다 — 두 번 불러도 안전하다(개발 모드 StrictMode). */
export const openModal = (dialog: Pick<HTMLDialogElement, 'open' | 'showModal'> | null) => {
  if (dialog && !dialog.open) dialog.showModal();
};

/**
 * "크게 보기": 같은 그림을 창 전체 모달 `<dialog>` 로. Escape 로 닫힘, 뒤 페이지 비활성, 닫으면 버튼으로
 * 포커스 복귀는 브라우저 기본이다. 창이 열린 뒤에 그림을 그려 창 크기에 맞춘다.
 */
const CanvasDialog = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  // 정리에서 close() 하지 않는다: 개발 모드 effect 재실행 때 늦게 오는 close 이벤트가 창을 곧바로 내린다.
  useEffect(() => {
    openModal(dialogRef.current);
    setOpen(true);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // 페이지 안 링크(상세 정보)는 창을 먼저 닫아야 닿는다.
      onClickCapture={(event) => {
        if ((event.target as Element).closest('a[href^="#"]')) dialogRef.current?.close();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-background-surface p-lg text-text-default backdrop:bg-neutral-ne900/50 sm:p-xl"
    >
      <div className="flex h-full flex-col gap-sm">
        <div className="flex items-center justify-between gap-sm">
          <h2 id={titleId} className="typo-body-medium-strong">
            {title}
          </h2>
          <Button size="sm" variant="outlined" onClick={() => dialogRef.current?.close()}>
            닫기
          </Button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
};

/** DevHub 의 그림이 모두 쓰는 이동 · 확대 표면. "크게 보기"로 같은 그림을 창 크기로 연다. */
export const CanvasViewport = (props: ViewportProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-sm">
      <CanvasSurface
        {...props}
        viewportClassName="h-[min(60vh,34rem)]"
        onExpand={() => setExpanded(true)}
      />
      {expanded && (
        <CanvasDialog title={`${props.label} — 크게 보기`} onClose={() => setExpanded(false)}>
          <CanvasSurface {...props} viewportClassName="min-h-0 flex-1" />
        </CanvasDialog>
      )}
    </div>
  );
};
