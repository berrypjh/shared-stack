type ShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'isComposing' | 'defaultPrevented'
>;

/**
 * macOS 는 ⌘K, 그 밖은 Ctrl+K 만. macOS 의 Ctrl+K(입력칸에서 줄 끝까지 지우기)와 다른 수정 키 조합,
 * IME 조합 중인 입력, 이미 누가 처리한 이벤트는 브라우저 · 입력기에 그대로 둔다.
 */
export const isSearchShortcut = (event: ShortcutEvent, mac: boolean) =>
  !event.defaultPrevented &&
  !event.isComposing &&
  !event.altKey &&
  !event.shiftKey &&
  (mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey) &&
  event.key.toLowerCase() === 'k';

export const shortcutOf = (mac: boolean) =>
  mac ? { label: '⌘K', aria: 'Meta+K' } : { label: 'Ctrl+K', aria: 'Control+K' };

/** macOS 인지. `navigator.platform` 은 폐기 예정이라 userAgentData, 없으면 userAgent 를 본다. */
export const isMac = () => {
  const data = (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData;
  return /mac|iphone|ipad/i.test(data?.platform ?? navigator.userAgent);
};

/** 스크린 리더에 알릴 결과 수. 질의가 없으면 빈 글자, 결과가 없으면 없다고 말한다. */
export const resultStatus = (query: string, total: number, shown: number) => {
  if (!query.trim()) return '';
  if (total === 0) return '일치하는 항목이 없습니다';
  return total > shown ? `결과 ${total}개 중 종류별 상위 ${shown}개` : `결과 ${total}개`;
};
