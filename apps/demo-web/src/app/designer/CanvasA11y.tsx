import { useEffect, useRef, useState } from 'react';

import type { ReactNode } from 'react';

import { Mono } from '../shell/ui';

/** 화면에 드러나지 않고 보조 기술에만 보이는 상태 속성. id 를 담는 `aria-controls` 등은 뺀다. */
const STATE_ATTRS = [
  'aria-expanded',
  'aria-haspopup',
  'aria-pressed',
  'aria-checked',
  'aria-selected',
  'aria-disabled',
  'aria-modal',
];

/** 명시 role · 상태 속성이 있거나, 그 자체로 role 을 갖는 `<hr>` 만 고른다. */
const SELECTOR = ['[role]', 'hr', ...STATE_ATTRS.map((a) => `[${a}]`)].join(',');

const describe = (el: Element): string => {
  const role = el.getAttribute('role');
  const attrs = STATE_ATTRS.filter((a) => el.hasAttribute(a)).map(
    (a) => `${a}=${el.getAttribute(a)}`,
  );
  return [el.tagName.toLowerCase(), role && `role=${role}`, ...attrs].filter(Boolean).join(' ');
};

/**
 * Canvas 안의 접근성 정보를 DOM 에서 읽는다.
 *
 * Popover `semantics` · Divider `decorative` 처럼 모양은 같고 보조 기술에 보이는 구조만 바뀌는
 * prop 이 있다. 값은 metadata 가 아니라 실제 렌더 결과에서 읽는다 — 선언과 결과가 갈리면 결과가 맞다.
 */
const readA11y = (root: Element) => {
  const items = Array.from(root.querySelectorAll(SELECTOR), describe);
  const active = document.activeElement;
  const focus = active && root.contains(active) ? describe(active) : null;
  return { items, focus };
};

/**
 * Canvas 를 감싸고 그 위에 접근성 정보를 보여 준다. 아래에 두면 Canvas 밖으로 뜨는 overlay(열린
 * Popover 패널)가 덮는다.
 *
 * 내용 · 속성이 바뀌거나 포커스가 움직이면 다시 읽는다. aria-live 를 두지 않는다 — 포커스가
 * 움직일 때마다 읽어 주면 Canvas 를 조작하는 보조 기술 사용자에게 소음이 된다.
 */
export const CanvasA11y = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<ReturnType<typeof readA11y>>({ items: [], focus: null });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const update = () => setInfo(readA11y(root));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { subtree: true, childList: true, attributes: true });
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  return (
    <div>
      <dl
        data-testid="canvas-a11y"
        className="mb-sm grid grid-cols-[auto_1fr] gap-x-md gap-y-xs text-xxsm"
      >
        <dt className="text-text-light font-semiBold">접근성</dt>
        <dd className="break-all">
          {info.items.length === 0 ? (
            <span className="text-text-light">명시 role · 상태 속성 없음</span>
          ) : (
            info.items.map((item, i) => (
              <span key={i}>
                {i > 0 && <span className="text-text-light"> · </span>}
                <Mono>{item}</Mono>
              </span>
            ))
          )}
        </dd>
        <dt className="text-text-light font-semiBold">포커스</dt>
        <dd className="break-all">
          {info.focus ? (
            <Mono>{info.focus}</Mono>
          ) : (
            <span className="text-text-light">Canvas 밖</span>
          )}
        </dd>
      </dl>
      <div ref={ref}>{children}</div>
    </div>
  );
};
