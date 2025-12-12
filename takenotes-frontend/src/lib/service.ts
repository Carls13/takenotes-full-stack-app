// Frontend API client backed by the Django backend

'use client';

import axios, { AxiosError } from 'axios';
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

// Axios instance with auth and auto-refresh logic
const http = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

http.interceptors.request.use((config) => {
  const access = getAccess();
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as any)['Authorization'] = `Bearer ${access}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;
    if (status === 401 && !originalRequest?._retry) {
      const refresh = getRefresh();
      if (!refresh) return Promise.reject(error);
      try {
        const r = await axios.post(`${BASE}/api/auth/token/refresh/`, { refresh }, { headers: { 'Content-Type': 'application/json' } });
        const newAccess = (r.data as any)?.access as string | undefined;
        if (newAccess) {
          localStorage.setItem(AUTH.access, newAccess);
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return http(originalRequest);
        }
      } catch (e) {
        // fallthrough to reject
      }
    }
    return Promise.reject(error);
  }
);

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
  // Backend registers with {username, password}; it then uses email as username internally
  const { data } = await http.post('/api/auth/register/', { username: email, password });
  // Tokens are nested under "tokens" for register response
  const access = data?.tokens?.access ?? data?.access;
  const refresh = data?.tokens?.refresh ?? data?.refresh;
  if (!access || !refresh) throw new Error('Registration succeeded but tokens missing');
  setTokens(access, refresh, email);
  return { id: 'me', email } as Omit<User, 'passwordHash'>;
}

export async function signIn(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
  const { data } = await http.post('/api/auth/token/', { username: email, password });
  setTokens((data as any).access, (data as any).refresh, email);
  return { id: 'me', email } as Omit<User, 'passwordHash'>;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data } = await http.get('/api/categories/');
  return data as Category[];
}

export async function getCategoryCounts(_userId: string): Promise<Record<string, number>> {
  // Build counts by category_name from the notes list (server provides category_name on each note)
  const { data } = await http.get('/api/notes/');
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
  const { data } = await http.get('/api/notes/');
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
  const { data } = await http.get(`/api/notes/?category=${encodeURIComponent(cid)}`);
  return (data as any[]).map(toNote);
}

export async function getNoteById(_userId: string, noteId: string): Promise<Note | null> {
  try {
    const { data } = await http.get(`/api/notes/${noteId}/`);
    return toNote(data);
  } catch (e) {
    return null;
  }
}

export async function createNote(_userId: string, categoryId?: string): Promise<Note> {
  const body: any = {};
  if (categoryId) body.category = categoryId;
  const { data } = await http.post('/api/notes/', body);
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
  const { data } = await http.patch(`/api/notes/${noteId}/`, payload);
  return toNote(data);
}

export async function deleteNote(_userId: string, noteId: string): Promise<void> {
  await http.delete(`/api/notes/${noteId}/`);
}

