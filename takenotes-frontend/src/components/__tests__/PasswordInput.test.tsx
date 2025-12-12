import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/src/components/PasswordInput';

describe('PasswordInput', () => {
  it('toggles icon when visibility changes', async () => {
    render(<PasswordInput placeholder="Password" />);
    const button = screen.getByRole('button', { name: /show password/i });
    const img = screen.getByAltText('Toggle visibility') as HTMLImageElement;

    // initial hidden state -> eye.png
    expect(img.getAttribute('src')).toContain('/icons/eye.png');

    await userEvent.click(button);
    // now visible -> eye-open.png
    expect(img.getAttribute('src')).toContain('/icons/eye-open.png');

    await userEvent.click(button);
    expect(img.getAttribute('src')).toContain('/icons/eye.png');
  });
});

