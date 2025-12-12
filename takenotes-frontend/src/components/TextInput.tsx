'use client';

import React from 'react';
import { cx } from './cx';

export function TextInput({
  className,
  unstyled = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { unstyled?: boolean }) {
  return (
    <input
      className={unstyled ? className : cx('w-full rounded-md border-0  px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-400', className)}
      {...props}
    />
  );
}

