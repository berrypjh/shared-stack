/**
 * 다음 major 에서 제거할 re-export.
 *
 * ui-core 패스스루를 플랫폼 구분 없이 통째로 내보내던 시절의 잔재다. `Web` 은 CSS 문자열
 * (`"0.75rem"`)로 해석된 web 토큰 트리라 RN 스타일 객체에 그대로 넣으면 동작하지 않는다.
 * RN 은 숫자로 해석된 `Native` 를 쓴다.
 *
 * 공개 API 였으므로 지우지 않고 한 번의 deprecation 을 거친다.
 */
import { Web as WebTokens } from '@berrypjh/ui-core';

/** @deprecated web 전용 토큰 트리(값이 CSS 문자열). RN 은 `Native` 를 쓴다. 다음 major 에서 제거. */
export const Web = WebTokens;
