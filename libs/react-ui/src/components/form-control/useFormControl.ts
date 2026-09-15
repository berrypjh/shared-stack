'use client';

import { useContext } from 'react';

import { FormControlContext } from './FormControlContext';

export const useFormControl = () => {
  return useContext(FormControlContext);
};
