// Frontend API client backed by the Django backend

'use client';

import { Category, CategoryId, Note, User } from './model';

const BASE = 'http://localhost:8000';
const AUTH = {
  access: 'tn_jwt_access',
  refresh: 'tn_jwt_refresh',
  email: 'tn_user_email',
};

function getAccess(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(AUTH.access);
}
function getRefresh(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(AUTH.refresh);
}
function setTokens(access: string, refresh: string, email?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH.access, access);
  localStorage.setItem(AUTH.refresh, refresh);
  if (email) localStorage.setItem(AUTH.email, email);
}
function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH.access);
  localStorage.removeItem(AUTH.refresh);
  localStorage.removeItem(AUTH.email);
}

async function refreshIfNeeded(resp: Response, retry: () => Promise<Response>): Promise<Response> {
  if (resp.status !== 401) return resp;
  const refresh = getRefresh();
  if (!refresh) return resp;
  const r = await fetch(`${BASE}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) return resp;
  const data = await r.json();
  const newAccess = data.access as string;
  if (newAccess) {
    localStorage.setItem(AUTH.access, newAccess);
    return retry();
  }
  return resp;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  const access = getAccess();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const attempt = () => fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers as any) } });
  const res = await attempt();
  if (res.status === 401) {
    const retryRes = await refreshIfNeeded(res, attempt);
    if (retryRes !== res) return retryRes;
  }
  return res;
}

// Auth
export function getCurrentUser(): Omit<User, 'passwordHash'> | null {
  const access = getAccess();
  const email = typeof window === 'undefined' ? null : localStorage.getItem(AUTH.email);
  if (!access || !email) return null;
  return { id: 'me', email } as Omit<User, 'passwordHash'>;
}

export function signOut(): void {
  clearTokens();
}

export async function signUp(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
  const r = await fetch(`${BASE}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Backend registers with {email, password}; it then uses email as username internally
    body: JSON.stringify({ username: email, password }),
  });
  if (!r.ok) throw new Error('Failed to register');
  const data = await r.json();
  // Tokens are nested under "tokens" for register response
  const access = data?.tokens?.access ?? data?.access;
  const refresh = data?.tokens?.refresh ?? data?.refresh;
  if (!access || !refresh) throw new Error('Registration succeeded but tokens missing');
  setTokens(access, refresh, email);
  return { id: 'me', email } as Omit<User, 'passwordHash'>;
}

export async function signIn(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
  const r = await fetch(`${BASE}/api/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (!r.ok) throw new Error('Failed to sign in');
  const data = await r.json();
  setTokens(data.access, data.refresh, email);
  return { id: 'me', email } as Omit<User, 'passwordHash'>;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const r = await api('/api/categories/');
  if (!r.ok) throw new Error('Failed to load categories');
  const data = await r.json();
  return data as Category[];
}

export async function getCategoryCounts(_userId: string): Promise<Record<string, number>> {
  // Build counts by category_name from the notes list (server provides category_name on each note)
  const r = await api('/api/notes/');
  if (!r.ok) throw new Error('Failed to load notes');
  const data = await r.json();
  const counts: Record<string, number> = {};
  for (const n of (data as any[])) {
    const name = (n.category_name as string) || 'Uncategorized';
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

// Notes
function toNote(n: any): Note {
  return {
    id: n.id,
    userId: 'me',
    title: n.title ?? '',
    content: n.content ?? '',
    categoryId: (n.category as string) ?? 'random',
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    // attach conveniences for UI that can read via (note as any)
    ...(n.category_name ? { category_name: n.category_name } : {}),
    ...(n.category_color ? { category_color: n.category_color } : {}),
    ...(n.last_edited_label ? { last_edited_label: n.last_edited_label } : {}),
  } as any;
}

export async function getNotes(_userId: string): Promise<Note[]> {
  const r = await api('/api/notes/');
  if (!r.ok) throw new Error('Failed to load notes');
  const data = await r.json();
  return (data as any[]).map(toNote);
}

export async function filterNotesByCategory(_userId: string, categoryId?: CategoryId): Promise<Note[]> {
  if (!categoryId) return getNotes('me');
  // Map known names to actual category UUID by listing categories first if necessary
  let cid = categoryId as string;
  if (['random', 'school', 'personal'].includes(categoryId as string)) {
    const cats = await getCategories();
    const nameLookup: Record<string, string> = {};
    for (const c of cats) nameLookup[c.name.toLowerCase()] = c.id;
    cid =
      (categoryId === 'random' && (nameLookup['random thoughts'] || nameLookup['random'])) ||
      (categoryId === 'school' && nameLookup['school']) ||
      (categoryId === 'personal' && nameLookup['personal']) ||
      (categoryId as string);
  }
  const r = await api(`/api/notes/?category=${encodeURIComponent(cid)}`);
  if (!r.ok) throw new Error('Failed to load notes');
  const data = await r.json();
  return (data as any[]).map(toNote);
}

export async function getNoteById(_userId: string, noteId: string): Promise<Note | null> {
  const r = await api(`/api/notes/${noteId}/`);
  if (!r.ok) return null;
  const data = await r.json();
  return toNote(data);
}

export async function createNote(_userId: string, categoryId?: string): Promise<Note> {
  const body: any = {};
  if (categoryId) body.category = categoryId;
  const r = await api('/api/notes/', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Failed to create note');
  const data = await r.json();
  return toNote(data);
}

export async function updateNote(
  _userId: string,
  noteId: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>> & { touchUpdatedAt?: boolean } = { touchUpdatedAt: true }
): Promise<Note> {
  const payload: any = {};
  if (typeof patch.title === 'string') payload.title = patch.title;
  if (typeof patch.content === 'string') payload.content = patch.content;
  if (typeof patch.categoryId === 'string') payload.category = patch.categoryId;
  const r = await api(`/api/notes/${noteId}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!r.ok) throw new Error('Failed to update note');
  const data = await r.json();
  return toNote(data);
}

export async function deleteNote(_userId: string, noteId: string): Promise<void> {
  const r = await api(`/api/notes/${noteId}/`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error('Failed to delete note');
}
