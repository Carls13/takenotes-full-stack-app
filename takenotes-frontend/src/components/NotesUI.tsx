'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CATEGORY_COLORS, CATEGORY_NAME, CategoryId, Note } from '@/src/lib/model';
import { formatRelativeMD } from '@/src/lib/model';
import { Button, TextInput, Textarea, NoteCard } from '@/src/components/ui';
import { getCategories, getNoteById, updateNote, createNote } from '@/src/lib/mockApi';
import { useAuth } from '@/src/contexts/AuthContext';

type OpenHandler = (note: Note) => void;

export function NotesGrid({ notes, onOpen }: { notes: Note[]; onOpen: OpenHandler }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((n) => (
        <NoteCard key={n.id} note={n} onClick={() => onOpen(n)} />
      ))}
    </div>
  );
}

export function EmptyState() {
  const { user } = useAuth();
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <Image src="/icons/coffee.png" alt="Coffee" width={220} height={220} />
      <div className="mt-5 max-w-md text-base sm:text-lg" style={{ color: '#88642A' }}>
        I’m just here waiting for your charming notes...
      </div>
    </div>
  );
}

export function NoteEditor({ noteId }: { noteId?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resolvedNoteId = noteId ?? params?.id;
  const [version, setVersion] = useState(0);
  const note = user && resolvedNoteId ? getNoteById(user.id, resolvedNoteId) : null;

  const categories = useMemo(() => getCategories(), []);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(note?.categoryId ?? 'random');

  // keep local select state in sync with the latest note value (e.g., when navigating between notes)
  React.useEffect(() => {
    if (note) setSelectedCategory(note.categoryId);
  }, [note?.id, note?.categoryId]);

  // no effect needed; we read the note directly from storage each render

  if (!user) return null;

  if (!note) {
    return (
      <div className="p-4">
        <div className="mb-3 text-sm text-zinc-700">Note not found.</div>
        <Button onClick={() => router.replace('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const bg = CATEGORY_COLORS[note.categoryId];
  const lastEdited = formatRelativeMD(note.updatedAt);

  function onTitleChange(next: string) {
    if (!user || !note) return;
    updateNote(user.id, note.id, { title: next });
    setVersion((v) => v + 1);
  }

  function onContentChange(next: string) {
    if (!user || !note) return;
    updateNote(user.id, note.id, { content: next });
    setVersion((v) => v + 1);
  }

  function onCategoryChange(next: CategoryId) {
    if (!user || !note) return;
    setSelectedCategory(next);
    updateNote(user.id, note.id, { categoryId: next });
    setVersion((v) => v + 1);
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-hidden">
      {/* Top controls outside note: category selector (left) and X close (right) */}
      <div className="mb-3 flex items-center justify-between">
        <select
          className="bg-transparent px-2 py-1 text-sm text-black outline-none"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.currentTarget.value as CategoryId)}
          disabled
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_NAME[c.id]}
            </option>
          ))}
        </select>
        <Button
          unstyled
          onClick={() => router.push('/dashboard')}
          className="bg-transparent px-2 py-1 text-4xl leading-none text-[#88642A] cursor-pointer"
          aria-label="Close"
        >
          ×
        </Button>
      </div>

      {/* Note panel with category-colored border/background and Last edited top-right */}
      <div
        className="rounded-xl border-[5px] p-4 sm:p-6 h-[calc(100vh-8rem)] flex flex-col"
        style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}
      >
        <div className="mb-2 flex justify-end text-xs text-zinc-700">Last edited: {lastEdited}</div>

        <div className="flex-1 min-h-0 space-y-4 flex flex-col">
          <TextInput
            value={note.title}
            onChange={(e) => onTitleChange(e.currentTarget.value)}
            placeholder="Title"
            className="bg-transparent text-black placeholder:text-black text-2xl sm:text-3xl font-semibold"
          />
          <Textarea
            value={note.content}
            onChange={(e) => onContentChange(e.currentTarget.value)}
            placeholder="Write your note here…"
            className="flex-1 min-h-0 resize-none bg-transparent text-black placeholder:text-black"
          />
        </div>
      </div>
    </div>
  );
}
export function NoteCreateForm() {
  const { user } = useAuth();
  const router = useRouter();

  const categories = useMemo(() => getCategories(), []);
  const [category, setCategory] = useState<CategoryId>('random');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!user) return null;

  const bg = CATEGORY_COLORS[category];

  function exitToDashboard() {
    if (!user) return;
    if (!title && !content) {
      router.push('/dashboard');
      return;
    }
    const n = createNote(user.id, category);
    updateNote(user.id, n.id, { title, content });
    router.replace('/dashboard');
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] p-4 sm:p-6">
      {/* Top controls outside of the note */}
      <div className="mb-3 flex items-center justify-between">
        <select
          className="bg-transparent px-2 py-1 text-sm text-black outline-none"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value as CategoryId)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {CATEGORY_NAME[c.id]}
            </option>
          ))}
        </select>
        <Button
          unstyled
          onClick={exitToDashboard}
          className="bg-transparent px-2 py-1 text-4xl leading-none text-[#88642A] cursor-pointer"
          aria-label="Close"
        >
          ×
        </Button>
      </div>

      {/* Note panel with padding and thick border */}
      <div
        className="rounded-xl border-[5px] p-4 sm:p-6 min-h-[calc(100vh-8rem)]"
        style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}
      >
        <div className="space-y-4">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Note Title"
            className="bg-transparent text-black placeholder:text-black text-2xl sm:text-3xl font-semibold"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            placeholder="Pour your heart out…"
            className="min-h-[50vh] bg-transparent text-black placeholder:text-black resize-none"
          />
        </div>
      </div>
    </div>
  );
}
