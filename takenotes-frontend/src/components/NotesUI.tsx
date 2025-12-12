'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_COLORS, CATEGORY_NAME, CategoryId, Note, Category } from '@/src/lib/model';
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
  const [note, setNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [titleDraft, setTitleDraft] = useState<string>('');
  const [contentDraft, setContentDraft] = useState<string>('');

  React.useEffect(() => {
    let cancel = false;
    async function load() {
      if (!user || !resolvedNoteId) return;
      const n = await getNoteById(user.id, resolvedNoteId);
      if (!cancel) {
        setNote(n);
        if (n) {
          setSelectedCategory(((n as any).category as string) || (n.categoryId as any));
          setTitleDraft(n.title ?? '');
          setContentDraft(n.content ?? '');
        }
      }
      const cats = await getCategories();
      if (!cancel) setCategories(cats as any[]);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [user, resolvedNoteId, version]);

  // keep local select state in sync with the latest note value (e.g., when navigating between notes)
  React.useEffect(() => {
    if (note) setSelectedCategory(note.categoryId);
  }, [note?.id, note?.categoryId]);

  // data loaded via effect

  if (!user) return null;

  if (!note) {
    return (
      <div className="p-4">
        <div className="mb-3 text-sm text-zinc-700">Note not found.</div>
        <Button onClick={() => router.replace('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const bg = ((note as any).category_color as string) || CATEGORY_COLORS[note.categoryId];
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
      categoryId: selectedCategory as any,
    });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-hidden">
      {/* Top controls outside note: category selector (left) and X close (right) */}
      <div className="mb-3 flex items-center justify-between">
        <select
          className="bg-transparent px-2 py-1 text-sm text-black outline-none"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.currentTarget.value)}
          disabled
        >
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
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

      {/* Note panel with category-colored border/background and Last edited top-right */}
      <div
        className="rounded-xl border-[5px] p-4 sm:p-6 h-[calc(100vh-8rem)] flex flex-col"
        style={{ backgroundColor: `${bg}88`, border: `6px solid ${bg}` }}
      >
        <div className="mb-2 flex justify-end text-xs text-zinc-700">Last edited: {lastEdited}</div>

        <div className="flex-1 min-h-0 space-y-4 flex flex-col">
          <TextInput
            value={titleDraft}
            onChange={(e) => onTitleChange(e.currentTarget.value)}
            placeholder="Title"
            className="bg-transparent text-black placeholder:text-black text-2xl sm:text-3xl font-semibold"
          />
          <Textarea
            value={contentDraft}
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
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!user) return null;

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const cs = await getCategories();
      if (cancel) return;
      setCategories(cs as Category[]);

      // Determine initial category selection based on prior filter (query param 'cat')
      const catParam = (searchParams?.get('cat') || '').trim();
      let initialId = '';
      if (catParam) {
        // Accept either alias (random|school|personal) or actual UUID
        const byName: Record<string, string> = {};
        for (const c of cs as any[]) byName[c.name.toLowerCase()] = c.id;
        if (['random', 'school', 'personal'].includes(catParam)) {
          const mapped =
            (catParam === 'random' && (byName['random thoughts'] || byName['random'])) ||
            (catParam === 'school' && byName['school']) ||
            (catParam === 'personal' && byName['personal']) ||
            '';
          initialId = mapped || '';
        } else {
          // assume it's a UUID and validate it exists
          initialId = (cs as any[]).some((c) => c.id === catParam) ? catParam : '';
        }
      }
      if (!initialId && (cs as any[]).length > 0) initialId = (cs as any[])[0].id;
      setCategory(initialId);
    })();
    return () => {
      cancel = true;
    };
  }, [searchParams]);

  async function exitToDashboard() {
    if (!user) return;
    if (!title && !content) {
      router.push('/dashboard');
      return;
    }
    const n = await createNote(user.id, (category as string) || undefined);
    await updateNote(user.id, n.id, { title, content });
    router.replace('/dashboard');
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] p-4 sm:p-6">
      {/* Top controls outside of the note */}
      <div className="mb-3 flex items-center justify-between">
        <select
          className="bg-transparent px-2 py-1 text-sm text-black outline-none"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
        style={{
          backgroundColor: `${categories.find((x) => x.id === category)?.color ?? '#F3E6D4'}88`,
          border: `6px solid ${categories.find((x) => x.id === category)?.color ?? '#88642A'}`,
        }}
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
