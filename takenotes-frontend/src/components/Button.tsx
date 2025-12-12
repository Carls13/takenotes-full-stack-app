'use client';

import React from 'react';
import { cx } from './cx';

export function Button({
  children,
  className,
  variant = 'primary',
  unstyled = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; unstyled?: boolean }) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer';
  const variants: Record<string, string> = {
    primary: 'bg-black text-white hover:bg-zinc-800 focus:ring-black',
    secondary: 'bg-white text-black border border-zinc-300 hover:bg-zinc-50 focus:ring-zinc-400',
    ghost: 'bg-transparent text-black hover:bg-zinc-100 focus:ring-zinc-300',
  };
  return (
    <button className={unstyled ? cx('cursor-pointer focus:outline-none font-bold', className) : cx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

