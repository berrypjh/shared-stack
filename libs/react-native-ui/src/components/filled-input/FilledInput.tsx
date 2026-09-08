import { InputBase } from '../input-base/InputBase';

import type { FilledInputProps } from './FilledInput.types';

/**
 * 채워진 표면과 사방 테두리를 가지는 필드.
 *
 * "Filled"는 시각 variant입니다 — 값이 들어있다는 뜻이 아닙니다. `value=""`여도 같은 chrome을 그립니다.
 */
export const FilledInput = (props: FilledInputProps) => <InputBase {...props} variant="filled" />;
