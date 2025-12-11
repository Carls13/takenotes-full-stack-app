// Mocked client-side API using localStorage with SSR-safe memory fallback

'use client';

import { Category, CategoryId, DEFAULT_CATEGORIES, Note, User, nowIso } from './model';

const STORAGE_KEYS = {
  users: 'tn_users',
  notes: 'tn_notes',
  session: 'tn_session_user_id',
} as const;

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const storage: StorageLike =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : createMemoryStorage();

// Helpers

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  storage.setItem(key, JSON.stringify(value));
}

function uuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  // Fallback
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function hashPassword(pw: string): string {
  // Mock hash (NOT secure; demo only)
  if (typeof btoa !== 'undefined') return btoa(pw).split('').reverse().join('');
  return pw.split('').reverse().join('');
}

// Public API

export function getCategories(): Category[] {
  return DEFAULT_CATEGORIES;
}

export function getSessionUserId(): string | null {
  return storage.getItem(STORAGE_KEYS.session);
}

export function getCurrentUser(): Omit<User, 'passwordHash'> | null {
  const uid = getSessionUserId();
  if (!uid) return null;
  const users = readJSON<User[]>(STORAGE_KEYS.users, []);
  const found = users.find((u) => u.id === uid);
  if (!found) return null;
  const { passwordHash, ...safe } = found;
  return safe;
}

export function signOut(): void {
  storage.removeItem(STORAGE_KEYS.session);
}

export function signUp(email: string, password: string): Omit<User, 'passwordHash'> {
  const users = readJSON<User[]>(STORAGE_KEYS.users, []);
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('Email already registered');
  }
  const user: User = {
    id: uuid(),
    email,
    passwordHash: hashPassword(password),
  };
  users.push(user);
  writeJSON(STORAGE_KEYS.users, users);
  storage.setItem(STORAGE_KEYS.session, user.id);
  const { passwordHash, ...safe } = user;
  return safe;
}

export function signIn(email: string, password: string): Omit<User, 'passwordHash'> {
  const users = readJSON<User[]>(STORAGE_KEYS.users, []);
  const candidate = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!candidate || candidate.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid email or password');
  }
  storage.setItem(STORAGE_KEYS.session, candidate.id);
  const { passwordHash, ...safe } = candidate;
  return safe;
}

export function getNotes(userId: string): Note[] {
  const notes = readJSON<Note[]>(STORAGE_KEYS.notes, []);
  return notes.filter((n) => n.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getNoteById(userId: string, noteId: string): Note | null {
  const notes = readJSON<Note[]>(STORAGE_KEYS.notes, []);
  const n = notes.find((x) => x.id === noteId && x.userId === userId);
  return n ?? null;
}

export function createNote(userId: string, categoryId: CategoryId = 'random'): Note {
  const notes = readJSON<Note[]>(STORAGE_KEYS.notes, []);
  const now = nowIso();
  const note: Note = {
    id: uuid(),
    userId,
    title: '',
    content: '',
    categoryId,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  writeJSON(STORAGE_KEYS.notes, notes);
  return note;
}

export function updateNote(
  userId: string,
  noteId: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>> & { touchUpdatedAt?: boolean } = { touchUpdatedAt: true }
): Note {
  const notes = readJSON<Note[]>(STORAGE_KEYS.notes, []);
  const idx = notes.findIndex((n) => n.id === noteId && n.userId === userId);
  if (idx === -1) throw new Error('Note not found');
  const original = notes[idx];
  const updated: Note = {
    ...original,
    ...('title' in patch ? { title: patch.title ?? '' } : {}),
    ...('content' in patch ? { content: patch.content ?? '' } : {}),
    ...('categoryId' in patch ? { categoryId: (patch.categoryId ?? original.categoryId) as CategoryId } : {}),
    updatedAt: patch.touchUpdatedAt === false ? original.updatedAt : nowIso(),
  };
  notes[idx] = updated;
  writeJSON(STORAGE_KEYS.notes, notes);
  return updated;
}

export function deleteNote(userId: string, noteId: string): void {
  const notes = readJSON<Note[]>(STORAGE_KEYS.notes, []);
  const filtered = notes.filter((n) => !(n.id === noteId && n.userId === userId));
  writeJSON(STORAGE_KEYS.notes, filtered);
}

export function getCategoryCounts(userId: string): Record<CategoryId, number> {
  const notes = getNotes(userId);
  const counts: Record<CategoryId, number> = { random: 0, school: 0, personal: 0 };
  for (const n of notes) {
    counts[n.categoryId] += 1;
  }
  return counts;
}

export function filterNotesByCategory(userId: string, categoryId?: CategoryId): Note[] {
  const notes = getNotes(userId);
  if (!categoryId) return notes;
  return notes.filter((n) => n.categoryId === categoryId);
}