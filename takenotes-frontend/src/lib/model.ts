// Domain types, constants, and utilities for TakeNotes mock frontend

export type CategoryId = 'random' | 'school' | 'personal';

export interface Category {
  id: CategoryId;
  name: string;
  color: string; // Tailwind-compatible hex
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  categoryId: CategoryId;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Backend Note payload (serializer)
export type ApiNote = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  category_name?: string;
  category_color?: string;
  created_at: string;
  updated_at: string;
  last_edited?: string;
  last_edited_label?: string;
};

// UI-augmented Note shape used by the app
export type NoteWithExtras = Note & {
  category_name?: string;
  category_color?: string;
  last_edited_label?: string;
  category?: string | null;
};

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'random', name: 'Random Thoughts', color: '#E9D5FF' }, // purple-200
  { id: 'school', name: 'School', color: '#BFDBFE' }, // blue-200
  { id: 'personal', name: 'Personal', color: '#FDE68A' }, // amber-200
];

export const CATEGORY_NAME: Record<CategoryId, string> = {
  random: 'Random Thoughts',
  school: 'School',
  personal: 'Personal',
};

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  random: '#E9D5FF',
  school: '#BFDBFE',
  personal: '#FDE68A',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatRelativeMD(input: string | number | Date, now: Date = new Date()): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const today = stripTime(now);
  const date = stripTime(d);
  const diffMs = today.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diffMs === 0) return 'Today';
  if (diffMs === oneDay) return 'Yesterday';

  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}
