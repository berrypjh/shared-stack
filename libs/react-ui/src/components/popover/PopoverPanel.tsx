'use client';

import { useEffect, useRef } from 'react';

import { cx } from '../../utils';

import { popoverClasses } from './Popover.constants';
import type { PopoverPanelProps } from './Popover.types';
import { usePopoverContext } from './PopoverContext';

const PANEL_SELECTOR = `.${popoverClasses.panel}`;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * 나보다 안쪽에 열린 패널이 있는지. **구조만 본다 — 포커스를 묻지 않는다.**
 *
 * 포커스가 어느 팝업 것인지는 아래 "스코프 리스너"가 DOM 버블링으로 이미 가려낸다.
 * 여기까지 온 Escape 는 어떤 팝업 안에서도 일어나지 않은 것(문서 어딘가)이라,
 * 그때의 규칙은 "중첩이면 안쪽부터"뿐이다.
 */
const hasNestedPanel = (panel: HTMLElement): boolean =>
  panel.querySelector(PANEL_SELECTOR) !== null;

/** dialog 진입 포커스. 첫 포커스 가능 요소, 없으면 패널 자신. */
const moveFocusInto = (panel: HTMLDivElement): void => {
  (panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel).focus();
};

export const PopoverPanel = ({ children, asDialog, className, ...rest }: PopoverPanelProps) => {
  const { open, setOpen, semantics, triggerRef, panelRef, panelId } =
    usePopoverContext('PopoverPanel');

  /** 바깥 포인터로 닫힌 경우. 사용자가 고른 컨트롤에서 포커스를 빼앗지 않는다. */
  const dismissedByPointer = useRef(false);

  const isDialog = asDialog ?? semantics === 'dialog';

  /**
   * 바깥 클릭과 Escape 로 닫기.
   *
   * Escape 의 **주인을 고르는 방식이 핵심**이다. 예전에는 `document.activeElement` 와
   * `aria-controls` 로 "이 포커스가 누구 것인지" 를 **추론**했는데, 그 추론이 jsdom 과
   * 실제 브라우저에서 갈렸다 — 중첩에서 안쪽 트리거에 포커스가 있을 때 브라우저에서는
   * 아무도 자기 것이라고 하지 않아 Escape 가 통째로 먹혔다.
   *
   * 그래서 추론을 버리고 **DOM 버블링**에 맡긴다. 리스너를 내 패널과 내 트리거에 직접 달면,
   * 키 이벤트가 내 팝업 안에서 났을 때만 불린다. 중첩이면 가장 안쪽 것이 먼저 불리고
   * `stopPropagation()` 으로 바깥을 막는다 — 순서가 DOM 명세로 보장되므로 환경을 타지 않는다.
   *
   * 어느 팝업 안에서도 나지 않은 Escape(문서 어딘가에 포커스)만 document 까지 올라온다.
   * 그때는 열린 팝업이 함께 닫히는 light-dismiss 이고, 중첩은 안쪽부터다.
   */
  useEffect(() => {
    if (!open) return undefined;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      dismissedByPointer.current = true;
      setOpen(false);
    };

    /** 어느 팝업 안에서도 나지 않은 Escape. 중첩이면 안쪽에게 양보한다. */
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const current = panelRef.current;
      if (current && hasNestedPanel(current)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, setOpen, triggerRef, panelRef]);

  /**
   * 포커스 수명주기. 규칙은 하나다 — **닫힐 때 포커스가 패널 안에 있었다면 트리거로
   * 되돌리고, 아니면 건드리지 않는다.**
   *
   * 패널이 사라지는 순간의 `document.activeElement` 는 이미 `<body>` 라서 믿을 수 없다.
   * 그래서 열려 있는 동안 `focusin` 으로 "안에 있었는지"를 계속 따라간다 — 포커스가 밖으로
   * 나가면 새 대상에서 focusin 이 떠서 false 가 되고, 요소가 제거돼 포커스가 파괴된 경우엔
   * focusin 이 뜨지 않아 true 로 남는다. 되돌릴 값이 필요한 쪽만 정확히 true 다.
   */
  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    if (!panel) return undefined;

    if (isDialog) moveFocusInto(panel);

    let focusInside = panel.contains(document.activeElement);
    const track = () => {
      focusInside = panel.contains(document.activeElement);
    };

    document.addEventListener('focusin', track);

    return () => {
      document.removeEventListener('focusin', track);

      const byPointer = dismissedByPointer.current;
      dismissedByPointer.current = false;
      if (byPointer || !focusInside) return;

      // cleanup 시점의 **현재** 트리거를 읽어야 한다 — effect 시작 때 잡아두면 그 사이
      // 트리거가 다시 마운트된 경우 분리된 옛 노드를 붙잡는다. 그래서 exhaustive-deps 의
      // ref 경고는 여기서 의도적으로 무시하고, 대신 isConnected 로 직접 확인한다.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, isDialog, triggerRef, panelRef]);

  if (!open) return null;

  return (
    <div
      {...rest}
      ref={panelRef}
      id={panelId}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Escape') return;
        event.stopPropagation();
        setOpen(false);
      }}
      role={isDialog ? 'dialog' : rest.role}
      tabIndex={rest.tabIndex ?? (isDialog ? -1 : undefined)}
      className={cx(popoverClasses.panel, className)}
    >
      {children}
    </div>
  );
};

PopoverPanel.displayName = 'PopoverPanel';
