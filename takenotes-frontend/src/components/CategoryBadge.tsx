'use client';

import React from 'react';
import { CATEGORY_COLORS, CATEGORY_NAME, CategoryId } from '@/src/lib/model';
import { cx } from './cx';

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
      className={cx('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', className)}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

