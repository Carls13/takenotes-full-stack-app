'use client';

import React from 'react';
import Protected from '@/src/components/Protected';
import { NoteEditor } from '@/src/components/NotesUI';

export default function NotePage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <Protected>
      <div className="min-h-screen p-4 sm:p-6">
        <NoteEditor noteId={id} />
      </div>
    </Protected>
  );
}