'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CATEGORY_NAME, CATEGORY_COLORS, CategoryId, Note } from '@/src/lib/model';
import { formatRelativeMD, truncate } from '@/src/lib/model';
import { getCategoryCounts } from '@/src/lib/mockApi';
import { useAuth } from '@/src/contexts/AuthContext';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

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
    secondary:
      'bg-white text-black border border-zinc-300 hover:bg-zinc-50 focus:ring-zinc-400',
    ghost: 'bg-transparent text-black hover:bg-zinc-100 focus:ring-zinc-300',
  };
  return (
    <button className={unstyled ? cx('cursor-pointer focus:outline-none font-bold', className) : cx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function TextInput({
  className,
  unstyled = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { unstyled?: boolean }) {
  return (
    <input
      className={unstyled
        ? className
        : cx(
            'w-full rounded-md border-0  px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-400',
            className
          )}
      {...props}
    />
  );
}

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
        className={unstyled
          ? inputClassName
          : cx(
              'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-zinc-400',
              inputClassName
            )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 cursor-pointer"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <img src="/icons/eye.png" alt="Toggle visibility" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'w-full min-h-[50vh] rounded-md border-0 px-3 py-2 text-sm outline-none focus:border-zinc-400',
        className
      )}
      {...props}
    />
  );
}

export function CategoryBadge({
  categoryId,
  className,
}: {
  categoryId: CategoryId;
  className?: string;
}) {
  const label = CATEGORY_NAME[categoryId];
  const color = CATEGORY_COLORS[categoryId];
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

export function NoteCard({
  note,
  onClick,
  className,
}: {
  note: Note;
  onClick?: () => void;
  className?: string;
}) {
  const bg = CATEGORY_COLORS[note.categoryId];
  const date = formatRelativeMD(note.updatedAt);
  const previewTitle = note.title.trim() || 'Untitled';
  const previewContent = note.content.trim();

  return (
    <div
      role="button"
      onClick={onClick}
      className={cx(
        'flex cursor-pointer flex-col rounded-lg p-3 transition-shadow hover:shadow overflow-hidden h-[303px]',
        className
      )}
      style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-black">
        <span className="font-bold">{date}</span>
        <span className="font-medium">{CATEGORY_NAME[note.categoryId]}</span>
      </div>
      <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-black">
        {truncate(previewTitle, 60)}
      </h3>
      <p className="line-clamp-6 text-xs text-black">
        {previewContent}
      </p>
    </div>
  );
}

export function Sidebar({
  selected,
  onSelect,
  className,
}: {
  selected: CategoryId | 'all';
  onSelect: (next: CategoryId | 'all') => void;
  className?: string;
}) {
  const { user, signOut } = useAuth();

  const counts = useMemo(
    () =>
      user ? getCategoryCounts(user.id) : { random: 0, school: 0, personal: 0 },
    [user]
  );

  const items: Array<{ id: CategoryId | 'all'; label: string; color?: string; count?: number }> =
    useMemo(
      () => [
        { id: 'all', label: 'All Notes' },
        { id: 'random', label: 'Random Thoughts', color: CATEGORY_COLORS.random, count: counts.random },
        { id: 'school', label: 'School', color: CATEGORY_COLORS.school, count: counts.school },
        { id: 'personal', label: 'Personal', color: CATEGORY_COLORS.personal, count: counts.personal },
      ],
      [counts]
    );

  // new note action moved to right panel header

  return (
    <aside className={cx('w-full sm:w-64 shrink-0', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold text-black">Categories</div>
      </div>
      <nav className="px-2 pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cx(
              'mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-black',
              selected === item.id ? 'font-bold' : 'font-normal'
            )}
          >
            <span className="flex items-center gap-2">
              {item.color && (
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {item.label}
            </span>
            {typeof item.count === 'number' && (
              <span className="text-xs">{item.count}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-2 px-4 py-3 text-xs text-black">
        <div className="mb-2 truncate font-bold">{user?.email ?? 'Guest'}</div>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="text-red-600 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
