import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBadge } from '@/src/components/CategoryBadge';

describe('CategoryBadge', () => {
  it('renders label and background color', () => {
    render(<CategoryBadge categoryId="random" />);
    const el = screen.getByText(/random thoughts/i);
    expect(el).toBeInTheDocument();
    expect((el as HTMLElement).style.backgroundColor).toBeTruthy();
  });
});

