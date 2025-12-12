import { describe, it, expect } from 'vitest';
import { formatRelativeMD } from '@/src/lib/model';

describe('formatRelativeMD', () => {
  it('returns Today for same date', () => {
    const now = new Date('2025-01-10T12:00:00Z');
    const input = new Date('2025-01-10T00:05:00Z');
    expect(formatRelativeMD(input, now)).toBe('Today');
  });

  it('returns Yesterday for previous day', () => {
    const now = new Date('2025-01-10T12:00:00Z');
    const input = new Date('2025-01-09T23:00:00Z');
    expect(formatRelativeMD(input, now)).toBe('Yesterday');
  });

  it('returns Mon DD for other dates', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    const input = new Date('2025-06-12T12:00:00Z');
    expect(formatRelativeMD(input, now)).toBe('Jun 12');
  });
});

