import { InputBase } from '../input-base/InputBase';

import type { BoxedInputProps } from './BoxedInput.types';

/** 윤곽선만 있는 필드. filled와 테두리·radius가 같고 표면만 다릅니다. */
export const BoxedInput = (props: BoxedInputProps) => <InputBase {...props} variant="boxed" />;
