'use client';

import React from 'react';
import { NoteWithExtras } from '@/src/lib/model';
import { NoteCard } from './NoteCard';

type OpenHandler = (note: NoteWithExtras) => void;

export function NotesGrid({ notes, onOpen }: { notes: NoteWithExtras[]; onOpen: OpenHandler }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onClick={() => onOpen(note)} />
      ))}
    </div>
  );
}

