'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/src/lib/model';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Textarea } from './Textarea';
import { getCategories, createNote, updateNote } from '@/src/lib/mockApi';
import { useAuth } from '@/src/contexts/AuthContext';

export function NoteCreateForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const cs = (await getCategories()) as Category[];
      if (cancel) return;
      setCategories(cs);

      const catParam = (searchParams?.get('cat') || '').trim();
      let initialId = '';
      if (catParam) {
        const byName: Record<string, string> = {};
        for (const c of cs) byName[c.name.toLowerCase()] = c.id;
        if (['random', 'school', 'personal'].includes(catParam)) {
          const mapped =
            (catParam === 'random' && (byName['random thoughts'] || byName['random'])) ||
            (catParam === 'school' && byName['school']) ||
            (catParam === 'personal' && byName['personal']) ||
            '';
          initialId = mapped || '';
        } else {
          initialId = cs.some((c) => c.id === catParam) ? catParam : '';
        }
      }
      if (!initialId && cs.length > 0) initialId = cs[0].id;
      setCategory(initialId);
    })();
    return () => {
      cancel = true;
    };
  }, [searchParams]);

  if (!user) return null;

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

      <div
        className="rounded-xl border-[5px] p-4 sm:p-6 min-h-[calc(100vh-8rem)]"
        style={{
          backgroundColor: `${categories.find((x) => x.id === category)?.color ?? '#F3E6D4'}88`,
          border: `6px solid ${categories.find((x) => x.id === category)?.color ?? '#88642A'}`,
        }}
      >
        <div className="space-y-4">
          <TextInput value={title} onChange={(e) => setTitle(e.currentTarget.value)} placeholder="Note Title" className="bg-transparent text-black placeholder:text-black text-2xl sm:text-3xl font-semibold" />
          <Textarea value={content} onChange={(e) => setContent(e.currentTarget.value)} placeholder="Pour your heart out…" className="min-h-[50vh] bg-transparent text-black placeholder:text-black resize-none" />
        </div>
      </div>
    </div>
  );
}

