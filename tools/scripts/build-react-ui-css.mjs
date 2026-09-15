/**
 * react-ui 컴포넌트 스타일을 `libs/react-ui/dist/index.css`로 컴파일한다 (sass → autoprefixer).
 *
 * `@nx/rollup` 23의 내장 postcss 플러그인은 번들에 포함된 모듈의 CSS만 추출한다.
 * `import './styles.scss'` 같은 side-effect import는 빈 모듈(`export default {}`)이 되어
 * rollup이 번들에서 빼므로 CSS가 나오지 않는다. 그래서 CSS는 이 단계가 따로 만든다.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const libRoot = fileURLToPath(new URL('../../libs/react-ui/', import.meta.url));
const require = createRequire(`${libRoot}package.json`);
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

const { css } = sass.compile(`${libRoot}src/styles.scss`);
const result = await postcss([autoprefixer]).process(css, { from: undefined });
writeFileSync(`${libRoot}dist/index.css`, result.css);
