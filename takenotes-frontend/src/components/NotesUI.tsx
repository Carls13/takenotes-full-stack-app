'use client';

import React, { useMemo, useState } from 'react';
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
  const router = useRouter();
  const handleCreate = () => {
    if (!user) return;
    router.push('/notes/new');
  };
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 p-10 text-center">
      <div className="mb-2 text-lg font-semibold text-zinc-900">No notes yet</div>
      <div className="mb-4 max-w-sm text-sm text-zinc-600">
        Get started by creating your first note. Notes are saved automatically while you type.
      </div>
      <Button onClick={handleCreate}>Create your first note</Button>
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
    <div className="min-h-[calc(100vh-2rem)] rounded-xl border border-zinc-200 p-4 sm:p-6" style={{ backgroundColor: bg }}>
      <div className="mb-4 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-xs text-zinc-700">Last edited: {lastEdited}</div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
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
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>Close</Button>
        </div>
      </div>

      <div className="space-y-4">
        <TextInput
          value={note.title}
          onChange={(e) => onTitleChange(e.currentTarget.value)}
          placeholder="Title"
          className="text-lg font-semibold"
        />
        <Textarea
          value={note.content}
          onChange={(e) => onContentChange(e.currentTarget.value)}
          placeholder="Write your note here…"
          className="min-h-[50vh]"
        />
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

  function onCancel() {
    router.push('/dashboard');
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const n = createNote(user.id, category);
    if (title || content) {
      updateNote(user.id, n.id, { title, content });
    }
    router.replace('/dashboard');
  }

  return (
    <div
      className="min-h-[calc(100vh-2rem)] rounded-xl border border-zinc-200 p-4 sm:p-6"
      style={{ backgroundColor: bg }}
    >
      <form onSubmit={onCreate} className="space-y-4">
        <div className="mb-2 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-xs text-zinc-700">Create a new note</div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
              value={category}
              onChange={(e) => setCategory(e.currentTarget.value as CategoryId)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {CATEGORY_NAME[c.id]}
                </option>
              ))}
            </select>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </div>

        <TextInput
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          placeholder="Title"
          className="text-lg font-semibold"
        />

        <Textarea
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          placeholder="Write your note here…"
          className="min-h-[50vh]"
        />
      </form>
    </div>
  );
}
