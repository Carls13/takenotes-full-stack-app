import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteCard } from '@/src/components/NoteCard';

const baseNote = {
  id: '1',
  userId: 'me',
  title: 'Hello World',
  content: 'Body',
  categoryId: 'random' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  // NoteCard reads category_color off the note object dynamically
  category_color: '#E9D5FF',
} as any;

describe('NoteCard', () => {
  it('renders note summary with category label', () => {
    render(<NoteCard note={baseNote} />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    expect(screen.getByText(/random thoughts/i)).toBeInTheDocument();
  });
});

