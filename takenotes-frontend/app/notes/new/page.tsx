'use client';

import React from 'react';
import Protected from '@/src/components/Protected';
import { NoteCreateForm } from '@/src/components/NotesUI';

export default function NewNotePage() {
  return (
    <Protected>
      <NoteCreateForm />
    </Protected>
  );
}