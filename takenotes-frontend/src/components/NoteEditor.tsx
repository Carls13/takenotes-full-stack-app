'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CATEGORY_COLORS, Category, NoteWithExtras, CategoryId } from '@/src/lib/model';
import { formatRelativeMD } from '@/src/lib/model';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Textarea } from './Textarea';
import { getCategories, getNoteById, updateNote } from '@/src/lib/service';
import { useAuth } from '@/src/contexts/AuthContext';

export function NoteEditor({ noteId }: { noteId?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resolvedNoteId = noteId ?? params?.id;
  const [version, setVersion] = useState(0);
  const [note, setNote] = useState<NoteWithExtras | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [contentDraft, setContentDraft] = useState<string>('');

  React.useEffect(() => {
    let cancel = false;
    async function load() {
      if (!user || !resolvedNoteId) return;
      const loaded = await getNoteById(user.id, resolvedNoteId);
      if (!cancel) {
        setNote(loaded);
        if (loaded) {
          setSelectedCategory(((loaded as NoteWithExtras).category ?? loaded.categoryId) as unknown as string);
          setTitleDraft(loaded.title ?? '');
          setContentDraft(loaded.content ?? '');
        }
      }
      const cats = await getCategories();
      if (!cancel) setCategories(cats);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [user, resolvedNoteId, version]);

  React.useEffect(() => {
    if (note) setSelectedCategory(note.categoryId);
  }, [note?.id, note?.categoryId]);

  if (!user) return null;

  if (!note) {
    return (
      <div className="p-4">
        <div className="mb-3 text-sm text-zinc-700">Note not found.</div>
        <Button onClick={() => router.replace('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const bg = note.category_color || CATEGORY_COLORS[note.categoryId];
  const lastEdited = formatRelativeMD(note.updatedAt);

  function onTitleChange(next: string) {
    setTitleDraft(next);
  }

  function onContentChange(next: string) {
    setContentDraft(next);
  }

  function onCategoryChange(next: string) {
    setSelectedCategory(next);
  }

  async function onSaveAndClose() {
    if (!user || !note) return;
    await updateNote(user.id, note.id, {
      title: titleDraft,
      content: contentDraft,
      categoryId: selectedCategory as unknown as CategoryId,
    });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <select
          className="bg-transparent px-2 py-1 text-sm text-black outline-none"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.currentTarget.value)}
          disabled
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button
          unstyled
          onClick={onSaveAndClose}
          className="bg-transparent px-2 py-1 text-4xl leading-none text-[#88642A] cursor-pointer"
          aria-label="Close"
        >
          ×
        </Button>
      </div>

      <div className="rounded-xl border-[5px] p-4 sm:p-6 h-[calc(100vh-8rem)] flex flex-col" style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}>
        <div className="mb-2 flex justify-end text-xs text-zinc-700">Last edited: {lastEdited}</div>

        <div className="flex-1 min-h-0 space-y-4 flex flex-col">
          <TextInput value={titleDraft} onChange={(e) => onTitleChange(e.currentTarget.value)} placeholder="Title" className="bg-transparent text-black placeholder:text-black text-2xl sm:text-3xl font-semibold" />
          <Textarea value={contentDraft} onChange={(e) => onContentChange(e.currentTarget.value)} placeholder="Write your note here…" className="flex-1 min-h-0 resize-none bg-transparent text-black placeholder:text-black" />
        </div>
      </div>
    </div>
  );
}

