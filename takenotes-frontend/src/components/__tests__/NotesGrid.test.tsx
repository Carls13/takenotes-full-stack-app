import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotesGrid } from '@/src/components/NotesGrid';

const mkNote = (id: string) => ({
  id,
  userId: 'me',
  title: `Title ${id}`,
  content: 'x',
  categoryId: 'school' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  category_color: '#BFDBFE',
});

describe('NotesGrid', () => {
  it('renders a card per note', () => {
    const notes = [mkNote('1') as any, mkNote('2') as any, mkNote('3') as any];
    render(<NotesGrid notes={notes} onOpen={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});

