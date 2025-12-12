'use client';

import React, { useState } from 'react';
import { cx } from './cx';

export function PasswordInput({
  className,
  inputClassName,
  unstyled = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { inputClassName?: string; unstyled?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cx('relative', className)}>
      <input
        type={visible ? 'text' : 'password'}
        className={unstyled ? inputClassName : cx('w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-zinc-400', inputClassName)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <img src={visible ? '/icons/eye-open.png' : '/icons/eye.png'} alt="Toggle visibility" className="h-4 w-4" />
      </button>
    </div>
  );
}

