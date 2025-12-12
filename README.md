# TakeNotes Full‑Stack Challenge

Monorepo containing a Django REST API and a Next.js 16 frontend for a simple notes application with categories, authentication, and a responsive UI.

- Backend: Django 6, DRF, SimpleJWT, SQLite
- Frontend: Next.js (App Router), React 19, Tailwind CSS v4, Axios, Vitest + Testing Library


## Repository structure

- takenotes-backend/ — Django project and REST API
- takenotes-frontend/ — Next.js application
- screenshots/ — UI reference captures used during implementation


## Quick start

Run backend first (default API base http://localhost:8000), then the frontend (default http://localhost:3000).

Backend (Django):
1) Create and activate a virtual environment
   - Windows PowerShell
     - py -m venv .venv
     - .venv\Scripts\Activate.ps1
2) Install dependencies
   - pip install -r takenotes-backend/requirements.txt
3) Run migrations
   - cd takenotes-backend
   - python manage.py migrate
4) Start server
   - python manage.py runserver

Frontend (Next.js):
1) Install dependencies
   - cd takenotes-frontend
   - npm install
2) Start dev server
   - npm run dev

URLs:
- API base: http://localhost:8000/api/
- Frontend: http://localhost:3000


## Summary of the process

1) Established a clean split between API and UI in a single repository to simplify local development and end‑to‑end testing.
2) Implemented authentication with JWT on the backend and mirrored the flow on the frontend using an Axios client with request/response interceptors and token refresh.
3) Built core domain features: user registration, categories, and notes. The backend computes helpful presentation fields (e.g., last_edited_label) to keep the frontend lean.
4) Implemented the Next.js App Router screens for sign up, sign in, dashboard, note CRUD and per‑category filtering, with a small component library and a context‑based auth session.
5) Added Tailwind CSS v4 and light/dark theme support using CSS variables so the UI remains consistent and accessible.
6) Wrote unit tests for critical components and model helpers using Vitest and Testing Library.


## Key design and technical decisions

- API‑first model and DTO mapping
  - The frontend uses a thin mapping layer to convert API DTOs into UI models and enrich them with convenience fields. See takenotes-frontend/src/lib/service.ts (toNote, getNotes, filterNotesByCategory, getNoteById, createNote, updateNote, deleteNote).

- JWT auth and token refresh
  - Access and refresh tokens are stored in localStorage using namespaced keys (tn_jwt_access, tn_jwt_refresh, tn_user_email).
  - Axios request interceptor injects Authorization: Bearer <access>; the response interceptor automatically attempts a refresh on 401 and retries once.
  - This keeps components free from auth boilerplate and centralizes retry logic.

- Server‑computed date label
  - The backend serializer computes last_edited_label as Today / Yesterday / Mon DD. This ensures a single source of truth for date presentation across clients.

- Category counts and filtering
  - The backend exposes categories and notes endpoints. The frontend computes counts by scanning notes for the current user to align with what’s rendered in the grid; it also resolves friendly category names (random, school, personal) to actual UUIDs by listing categories first when necessary.

- Next.js App Router and client boundaries
  - Client components are explicitly marked and use an AuthProvider context to expose user, loading, and signIn/signOut/signUp actions. This keeps the app pages declarative and easy to test.

- Styling and theming
  - Tailwind CSS v4 with CSS variables for light/dark themes. The .theme-dark class toggles variables to ensure strong contrast and predictable colors without breaking note colors.

- CORS and local development
  - CORS is open for local development (CORS_ALLOW_ALL_ORIGINS=True). For production, restrict to trusted origins.


## How to run end‑to‑end

1) Start backend at http://localhost:8000
   - cd takenotes-backend
   - python manage.py runserver
2) Start frontend at http://localhost:3000
   - cd takenotes-frontend
   - npm run dev
3) Flow
   - Sign up (creates user and default categories)
   - Sign in
   - Create, edit, filter, and delete notes


## Testing

- Frontend unit tests are written with Vitest and Testing Library and can be run with:
  - cd takenotes-frontend
  - npm test


## Notable files

- Backend
  - takenotes-backend/config/settings.py — Django, DRF, SimpleJWT, CORS, Spectacular
  - takenotes-backend/users/* — registration and token endpoints
  - takenotes-backend/notes/* — categories and notes models, serializers, views

- Frontend
  - takenotes-frontend/src/contexts/AuthContext.tsx — session state and auth actions
  - takenotes-frontend/src/lib/service.ts — Axios client with JWT, auto‑refresh, and API DTO mapping
  - takenotes-frontend/app/* — App Router pages
  - takenotes-frontend/src/components/* — UI components (Sidebar, NotesGrid, NoteCard, NoteEditor, etc.)
  - takenotes-frontend/app/globals.css — Tailwind v4 setup and theme tokens


## Screenshots

Screenshots used to guide the UI flow and verify the result:
- screenshots/sign-in-view.png
- screenshots/sign-up-view.png
- screenshots/dashboard-empty-state-view.png
- screenshots/dashboard-with-notes-state-view.png
- screenshots/create-new-note-view.png
- screenshots/create-new-note-filled-view.png


## AI tools used and how

Kilo Code, an AI pair‑programming assistant, was used to accelerate implementation and documentation:

- Code review and exploration
  - Parsed the repository layout, read source files, and summarized architecture to ensure cohesive documentation and consistent patterns.

- Targeted edits and file creation
  - Created this root README and aligned terminology with the codebase. Where necessary, Kilo Code proposed patch‑style changes and validated cross‑file consistency.

- API client and auth flow alignment
  - Verified the Axios interceptor setup, token storage keys, and refresh flow and documented the decisions so UI code remains simple and robust.

- Styling and theme guidance
  - Consolidated CSS variable strategy and Tailwind v4 setup referenced by globals.css to maintain accessible light/dark theming.

Using Kilo Code in this way kept changes incremental, traceable, and consistent with existing patterns while reducing manual boilerplate and oversight risk.


## License

This repository is provided for the full‑stack challenge context. See individual subfolders for any additional notices.

