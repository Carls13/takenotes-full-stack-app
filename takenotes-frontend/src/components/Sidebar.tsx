'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORY_COLORS, CategoryId } from '@/src/lib/model';
import { getCategoryCounts } from '@/src/lib/service';
import { useAuth } from '@/src/contexts/AuthContext';
import { cx } from './cx';

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

  const [countsByName, setCountsByName] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user) {
        setCountsByName({});
        return;
      }
      const m = await getCategoryCounts(user.id);
      if (!cancel) setCountsByName(m);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  const items: Array<{ id: CategoryId | 'all'; label: string; color?: string; count?: number }> = useMemo(
    () => [
      { id: 'all', label: 'All Categories' },
      { id: 'random', label: 'Random Thoughts', color: CATEGORY_COLORS.random, count: countsByName['Random Thoughts'] ?? 0 },
      { id: 'school', label: 'School', color: CATEGORY_COLORS.school, count: countsByName['School'] ?? 0 },
      { id: 'personal', label: 'Personal', color: CATEGORY_COLORS.personal, count: countsByName['Personal'] ?? 0 },
    ],
    [countsByName]
  );

  return (
    <aside className={cx('w-full sm:w-64 shrink-0', className)}>
      <nav className="px-2 pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cx(
              'mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-black cursor-pointer transition hover:brightness-90',
              selected === item.id ? 'font-bold' : 'font-normal'
            )}
          >
            <span className="flex items-center gap-2">
              {item.color && (
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              )}
              {item.label}
            </span>
            {typeof item.count === 'number' && <span className="text-xs">{item.count}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-2 px-4 py-3 text-xs text-black">
        <div className="mb-2 truncate font-bold">{user?.email ?? 'Guest'}</div>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="text-red-600 hover:underline cursor-pointer transition hover:brightness-90">
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

