'use client';

import {
  createContext,
  type FocusEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { IconButton } from '@berrypjh/react-ui';

import { useDevHubLocation } from '../provider/devhub-provider';
import { Icon } from '../ui/icon';

const PANE_ID = 'explorer-pane';

type Drawer = {
  open: boolean;
  toggle: () => void;
  /** `returnFocus` 면 여는 버튼으로 포커스를 돌린다. */
  close: (returnFocus: boolean) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
};

const DrawerContext = createContext<Drawer | null>(null);

const useDrawer = () => {
  const drawer = useContext(DrawerContext);
  if (!drawer) throw new Error('ExplorerDrawerProvider 가 없습니다');
  return drawer;
};

/**
 * `lg` 미만 탐색기 서랍의 열림 상태. 상단 바 버튼과 서랍이 함께 쓴다.
 * 경로가 바뀌면 닫는다 — 항목을 골랐으니 서랍의 일은 끝났다.
 */
export const ExplorerDrawerProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useDevHubLocation();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  return (
    <DrawerContext.Provider value={{ open, toggle, close, toggleRef }}>
      {children}
    </DrawerContext.Provider>
  );
};

/** 상단 바의 메뉴 버튼. `lg` 부터는 탐색기가 늘 보여 버튼이 없다. */
export const ExplorerToggle = () => {
  const { open, toggle, toggleRef } = useDrawer();
  return (
    <IconButton
      ref={toggleRef}
      size="sm"
      color="secondary"
      aria-label="탐색기"
      aria-expanded={open}
      aria-controls={PANE_ID}
      onClick={toggle}
      className="lg:hidden"
    >
      <Icon name="menu" />
    </IconButton>
  );
};

/**
 * 탐색기 칸. `lg` 부터 왼쪽 열이고, 그 미만에서는 어두운 배경 위로 왼쪽에서 들어온다.
 * 모달이 아니라 펼침(disclosure)이다 — 포커스를 가두지 않는다. Escape · 닫기 버튼 · 서랍 밖 누르기는
 * 닫고 버튼으로 포커스를 돌리고, 포커스가 서랍 밖으로 나가면 돌려주지 않고 닫는다.
 * 닫힌 서랍은 `invisible` 이라 Tab 순서와 접근성 트리에서 빠진다.
 */
export const ExplorerPane = ({ children }: { children: ReactNode }) => {
  const { open, close } = useDrawer();
  const paneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const pane = paneRef.current;
    const current = pane?.querySelector<HTMLElement>('[aria-current="page"]');
    (current ?? pane?.querySelector<HTMLElement>('nav a[href]'))?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (pane && !pane.contains(event.target as Node)) close(true);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (open && next instanceof Node && !event.currentTarget.contains(next)) close(false);
  };

  return (
    <>
      {open && (
        <div aria-hidden="true" className="fixed inset-0 z-30 bg-neutral-ne900/50 lg:hidden" />
      )}
      <aside
        ref={paneRef}
        id={PANE_ID}
        aria-label="탐색기"
        data-state={open ? 'open' : 'closed'}
        onBlur={onBlur}
        className={[
          'relative bg-background-surface lg:overflow-y-auto lg:border-r lg:border-stroke-light',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[min(20rem,85vw)]',
          'max-lg:overflow-y-auto max-lg:shadow-4',
          'max-lg:transition-[translate,visibility] max-lg:duration-200 motion-reduce:transition-none',
          'max-lg:data-[state=closed]:invisible max-lg:data-[state=closed]:-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-stroke-light p-md lg:hidden">
          <p className="typo-body-small-strong">탐색기</p>
          <IconButton
            size="sm"
            color="secondary"
            aria-label="탐색기 닫기"
            onClick={() => close(true)}
          >
            <Icon name="close" />
          </IconButton>
        </div>
        {children}
      </aside>
    </>
  );
};
