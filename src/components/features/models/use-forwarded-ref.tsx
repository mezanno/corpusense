//https://github.com/nightspite/shadcn-color-picker/blob/master/src/components/color-picker-demo.tsx

import type React from 'react';
import { useEffect, useRef } from 'react';

export function useForwardedRef<T>(ref: React.ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}
