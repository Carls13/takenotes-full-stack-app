'use client';

import React from 'react';
import { Note, CATEGORY_NAME } from '@/src/lib/model';
import { formatRelativeMD, truncate } from '@/src/lib/model';
import { cx } from './cx';

export function NoteCard({
  note,
  onClick,
  className,
}: {
  note: Note;
  onClick?: () => void;
  className?: string;
}) {
  const bg = (note as any).category_color;
  const date = formatRelativeMD(note.updatedAt);
  const previewTitle = note.title.trim() || 'Untitled';
  const previewContent = note.content.trim();

  return (
    <div
      role="button"
      onClick={onClick}
      className={cx('flex cursor-pointer flex-col rounded-lg p-3 transition-shadow hover:shadow overflow-hidden h-[303px]', className)}
      style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-black">
        <span className="font-bold">{date}</span>
        <span className="font-medium">{CATEGORY_NAME[note.categoryId]}</span>
      </div>
      <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-black">{truncate(previewTitle, 60)}</h3>
      <p className="line-clamp-6 text-xs text-black">{previewContent}</p>
    </div>
  );
}

