// Frontend API client backed by the Django backend

'use client';

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { Category, CategoryId, Note, User, ApiNote, NoteWithExtras } from './model';

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
import { notifyErrorFromAxios, notifyError } from '@/src/lib/notifications';

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = getAccess();
  if (access) {
    const headers = (config.headers ?? {}) as AxiosRequestHeaders;
    headers['Authorization'] = `Bearer ${access}`;
    config.headers = headers;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });
    const status = error.response?.status;
    if (status === 401 && !originalRequest?._retry) {
      const refresh = getRefresh();
      if (!refresh) return Promise.reject(error);
      try {
        const refreshResp = await axios.post(`${BASE}/api/auth/token/refresh/`, { refresh }, { headers: { 'Content-Type': 'application/json' } });
        const newAccess = (refreshResp.data as { access?: string }).access;
        if (newAccess) {
          localStorage.setItem(AUTH.access, newAccess);
          originalRequest._retry = true;
          const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
          headers['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers = headers;
          return http(originalRequest);
        }
      } catch (e) {
        // Refresh failed: clear tokens and surface message
        clearTokens();
        notifyError('Session expired. Please sign in again.', 'Authentication');
      }
    }
    // Any other error: surface a toast notification
    try {
      notifyErrorFromAxios(error);
    } catch {}
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
  const tokenResp = data as { access: string; refresh: string };
  setTokens(tokenResp.access, tokenResp.refresh, email);
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
  const apiNotes = data as ApiNote[];
  const counts: Record<string, number> = {};
  for (const noteDto of apiNotes) {
    const name = noteDto.category_name || 'Uncategorized';
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

// Notes
function toNote(dto: ApiNote): NoteWithExtras {
  const base: NoteWithExtras = {
    id: dto.id,
    userId: 'me',
    title: dto.title ?? '',
    content: dto.content ?? '',
    categoryId: (dto.category ?? 'random') as unknown as CategoryId,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
  if (dto.category_name) base.category_name = dto.category_name;
  if (dto.category_color) base.category_color = dto.category_color;
  if (dto.last_edited_label) base.last_edited_label = dto.last_edited_label;
  base.category = dto.category;
  return base;
}

export async function getNotes(_userId: string): Promise<NoteWithExtras[]> {
  const { data } = await http.get('/api/notes/');
  return (data as ApiNote[]).map(toNote);
}

export async function filterNotesByCategory(_userId: string, categoryId?: CategoryId): Promise<NoteWithExtras[]> {
  if (!categoryId) return getNotes('me');
  // Map known names to actual category UUID by listing categories first if necessary
  let resolvedCategoryId = categoryId as string;
  if (['random', 'school', 'personal'].includes(categoryId as string)) {
    const cats = await getCategories();
    const nameLookup: Record<string, string> = {};
    for (const cat of cats) nameLookup[cat.name.toLowerCase()] = cat.id;
    resolvedCategoryId =
      (categoryId === 'random' && (nameLookup['random thoughts'] || nameLookup['random'])) ||
      (categoryId === 'school' && nameLookup['school']) ||
      (categoryId === 'personal' && nameLookup['personal']) ||
      (categoryId as string);
  }
  const { data } = await http.get(`/api/notes/?category=${encodeURIComponent(resolvedCategoryId)}`);
  return (data as ApiNote[]).map(toNote);
}

export async function getNoteById(_userId: string, noteId: string): Promise<Note | null> {
  try {
    const { data } = await http.get(`/api/notes/${noteId}/`);
    return toNote(data);
  } catch (e) {
    return null;
  }
}

export async function createNote(_userId: string, categoryId?: string): Promise<NoteWithExtras> {
  const body: { category?: string } = {};
  if (categoryId) body.category = categoryId;
  const { data } = await http.post('/api/notes/', body);
  return toNote(data as ApiNote);
}

export async function updateNote(
  _userId: string,
  noteId: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>> & { touchUpdatedAt?: boolean } = { touchUpdatedAt: true }
): Promise<NoteWithExtras> {
  const payload: Partial<{ title: string; content: string; category: string }> = {};
  if (typeof patch.title === 'string') payload.title = patch.title;
  if (typeof patch.content === 'string') payload.content = patch.content;
  if (typeof patch.categoryId === 'string') payload.category = patch.categoryId as unknown as string;
  const { data } = await http.patch(`/api/notes/${noteId}/`, payload);
  return toNote(data as ApiNote);
}

export async function deleteNote(_userId: string, noteId: string): Promise<void> {
  await http.delete(`/api/notes/${noteId}/`);
}

