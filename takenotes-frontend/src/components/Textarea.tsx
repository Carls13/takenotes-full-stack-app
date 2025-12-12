'use client';

import React from 'react';
import { cx } from './cx';

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx('w-full min-h-[50vh] rounded-md border-0 px-3 py-2 text-sm outline-none focus:border-zinc-400', className)}
      {...props}
    />
  );
}

