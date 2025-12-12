import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation utilities used by components
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => ({ get: (_k: string) => null }),
    useParams: () => ({}),
  };
});

// Mock Next.js Link component to render plain <a>
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

