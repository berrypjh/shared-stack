/**
 * design-tokens 의 Tailwind preset 을 그대로 통과시키는 **패키징 예외**.
 *
 * 플랫폼 중립 런타임 코어가 아니다. 여기 있는 유일한 이유는 의존성 방향 때문이다 —
 * design-tokens 는 private 이라 소비자가 직접 import 할 수 없고, 렌더러 패키지는 자기 build 에서
 * `libs/ui-core/dist/tailwind.js` 를 복사해 간다. ui-core 가 중간에서 그 경로 하나를 제공한다.
 *
 * preset 을 여기서 만들거나 고치지 않는다. 생성은 design-tokens 의 `genTailwind` 소관이다.
 */
export { default } from '@berrypjh/design-tokens/tailwind';
export * from '@berrypjh/design-tokens/tailwind';
