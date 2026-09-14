import { InputBase } from '../input-base/InputBase';

import type { PlainInputProps } from './PlainInput.types';

/** 밑줄만 있는 필드. 동작은 `InputBase`, plain 시각 규칙은 `InputBase.styles.ts`가 가집니다. */
export const PlainInput = (props: PlainInputProps) => <InputBase {...props} variant="plain" />;
