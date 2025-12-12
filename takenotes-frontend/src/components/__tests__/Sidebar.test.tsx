import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from '@/src/components/Sidebar';

vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', email: 'a@b.c' }, loading: false, signOut: vi.fn(), signIn: vi.fn(), signUp: vi.fn() }),
}));

vi.mock('@/src/lib/mockApi', () => ({
  getCategoryCounts: async (_userId: string) => ({ 'Random Thoughts': 3, School: 2, Personal: 1 }),
}));

describe('Sidebar', () => {
  it('shows counts fetched by category name and hover class is present', async () => {
    render(<Sidebar selected="all" onSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Random Thoughts')).toBeInTheDocument();
      expect(screen.getByText('School')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    // counts
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

