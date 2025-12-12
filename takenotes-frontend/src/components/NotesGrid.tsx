'use client';

import React from 'react';
import { Note } from '@/src/lib/model';
import { NoteCard } from './NoteCard';

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

