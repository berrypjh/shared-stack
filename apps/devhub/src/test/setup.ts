/**
 * jsdom 에 없는 브라우저 API 의 대역. "이 페이지에서" 는 IntersectionObserver 로 읽는 절을 따라간다 —
 * jsdom 은 레이아웃이 없어 교차가 일어나지 않으므로, 관찰만 받고 아무것도 알리지 않는다.
 */
const noop = () => undefined;

class NoIntersectionObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
  takeRecords = () => [];
}

globalThis.IntersectionObserver ??=
  NoIntersectionObserver as unknown as typeof IntersectionObserver;
