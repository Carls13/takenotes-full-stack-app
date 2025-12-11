'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Protected from '@/src/components/Protected';
import { Sidebar, Button } from '@/src/components/ui';
import { NotesGrid, EmptyState } from '@/src/components/NotesUI';
import { useAuth } from '@/src/contexts/AuthContext';
import { CATEGORY_NAME, CategoryId, Note } from '@/src/lib/model';
import { filterNotesByCategory, getNotes } from '@/src/lib/mockApi';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<CategoryId | 'all'>('all');

  const notes = useMemo(() => {
    if (!user) return [];
    if (selected === 'all') return getNotes(user.id);
    return filterNotesByCategory(user.id, selected as CategoryId);
  }, [user, selected]);

  const title =
    selected === 'all' ? 'All Notes' : CATEGORY_NAME[selected as CategoryId];

  const handleOpen = (n: Note) => {
    router.push(`/notes/${n.id}`);
  };
  const handleNewNote = () => {
    router.push('/notes/new');
  };

  return (
    <Protected>
      <div className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar selected={selected} onSelect={setSelected} className="sm:min-h-screen" />

        <main className="flex-1 p-4 sm:p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
            <Button
              unstyled
              className="rounded-[46px] border-2 border-[#88642A] bg-transparent text-[#88642A] px-4 py-2 text-sm hover:bg-[#F3E6D4]"
              onClick={handleNewNote}
            >
              + New Note
            </Button>
          </div>

          {notes.length === 0 ? (
            <EmptyState />
          ) : (
            <NotesGrid notes={notes} onOpen={handleOpen} />
          )}
        </main>
      </div>
    </Protected>
  );
}
