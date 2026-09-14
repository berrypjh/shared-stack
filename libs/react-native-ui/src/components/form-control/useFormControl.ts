import { useContext } from 'react';

import { FormControlContext } from './FormControlContext';

/**
 * 가장 가까운 FormControl의 값. 없으면 `undefined`. 비공개.
 *
 * 던지지 않는다 — 자손은 FormControl 없이도 단독으로 쓰이고, 각자
 * `prop ?? formControl?.x ?? 기본값`으로 푼다.
 */
export const useFormControl = () => useContext(FormControlContext);
