// SCSS 모음이다. rollup-plugin-postcss가 extract하므로 JS 번들에는 남지 않는다.
import './styles';

// 시맨틱 prop 계약은 react-ui 자체 props가 wrap해서 내보낸다.
// 공유 계약(`BoxProps`)은 ui-core가, web 전용 계약(button/field/fab/icon-button/menu-item)은 `src/types`가 소유한다.
export * from './components';
export * from './theme';

// web 소비자용 토큰 facade. RN 전용 심볼은 `./deprecated`로 분리했다.
export * from './deprecated';
export { cx } from './utils';
export type {
  ColorToken,
  RadiusToken,
  SpacingToken,
  ThemeInfo,
  ThemeName,
} from '@berrypjh/ui-core';
export { themes, Web } from '@berrypjh/ui-core';
