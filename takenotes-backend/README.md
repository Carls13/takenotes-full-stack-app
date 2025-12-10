# TakeNotes Backend (Django + DRF + JWT)

Backend for a notes app with user registration, JWT auth, categories, and notes. Notes and categories use UUID primary keys. New users get default categories on registration and can create their own categories.

## Tech Stack
- Python 3
- Django 6
- Django REST Framework
- SimpleJWT
- django-cors-headers
- SQLite (default)

## Quick Start

1) Create and activate a virtual env (already created in this repo if you followed the setup)
```
py -m venv venv
venv\Scripts\activate
```

2) Install dependencies
```
pip install -r requirements.txt
```

3) Apply migrations
```
python manage.py migrate
```

4) Run dev server
```
python manage.py runserver
```

Server runs at:
- API base: http://localhost:8000/api/
- Health: http://localhost:8000/api/health/

## Apps and Structure

- Django project: `config`
- Core apps: `users`, `notes`
- Models (notes app):
  - Category (UUID, per-user unique name, color)
  - Note (UUID, title, content, category optional, last edited via updated_at)
- Auth (users app):
  - Register endpoint creates Django `User` with `username=email`
  - Default categories auto-created for new user
  - Endpoints are mounted under `/api/auth/` via `users.urls`

Key files:
- settings: `config/settings.py`
- urls: `config/urls.py`
- users: `users/serializers.py`, `users/views.py`, `users/urls.py`
- notes models: `notes/models.py`
- notes serializers: `notes/serializers.py`
- notes views: `notes/views.py`
- notes routes: `notes/urls.py`

## Authentication

Auth endpoints are served by the users app.

- Register
  - POST `/api/auth/register/`
  - body:
    ```json
    {"email": "user@example.com", "password": "yourpassword"}
    ```
  - response includes JWT `access` and `refresh` tokens and auto-creates default categories:
    - Random Thoughts (purple)
    - School (blue)
    - Personal (amber)

- Obtain Token (login)
  - POST `/api/auth/token/`
  - body:
    ```json
    {"username": "user@example.com", "password": "yourpassword"}
    ```
  - Note: SimpleJWT expects a `username` field. We use `email` as the Django username at registration time.

- Refresh Token
  - POST `/api/auth/token/refresh/`
  - body:
    ```json
    {"refresh": "<refresh_token>"}
    ```

Authentication for protected endpoints:
- Add header `Authorization: Bearer <access_token>`

## Category API

Base: `/api/categories/` (JWT required)

- List categories (with note counts for the current user)
  - GET `/api/categories/`
  - response:
    ```json
    [
      {"id":"<uuid>","name":"Random Thoughts","color":"#A78BFA","note_count": 3, "created_at":"...","updated_at":"..."},
      ...
    ]
    ```

- Create category
  - POST `/api/categories/`
  - body:
    ```json
    {"name":"Work","color":"#10B981"}
    ```
  - Creates the category for the authenticated user. Name must be unique per user.

- Retrieve/Update/Delete a category
  - GET/PATCH/DELETE `/api/categories/{id}/`

## Notes API

Base: `/api/notes/` (JWT required)

- List notes (optionally filtered by category)
  - GET `/api/notes/`
  - GET `/api/notes/?category=<category_uuid>`
  - Each note includes:
    - `last_edited` (ISO datetime)
    - `last_edited_label` (one of "Today", "Yesterday", or "Mon DD")
    - `category_name` and `category_color` convenience fields

- Create a note
  - POST `/api/notes/`
  - body:
    ```json
    {"title":"My Note","content":"Text...","category":"<category_uuid>"}
    ```
  - If no category is provided, defaults to the user's "Random Thoughts" if present.

- Retrieve/Update/Delete a note
  - GET/PATCH/DELETE `/api/notes/{id}/`

## Date Display Logic

- Serializer computes `last_edited_label`:
  - "Today" if last edited today
  - "Yesterday" if last edited yesterday
  - Else formatted as `Mon DD` (e.g., `Apr 03`)

Frontend can rely on `last_edited_label` or use `last_edited` to format as needed.

## CORS

- `CORS_ALLOW_ALL_ORIGINS = True` for local dev. Restrict this in production.

## Admin

- Visit `/admin/` (create a superuser first):
```
python manage.py createsuperuser
```

## Migrations and DB

- Initial migration already created. To reset:
```
rm db.sqlite3
python manage.py migrate
```

## Environment Notes

- Default DB is SQLite for simplicity. For production, configure `DATABASES` in `config/settings.py`.
- Default permissions require authentication. Public endpoints are:
  - `/api/auth/register/`
  - `/api/auth/token/`
  - `/api/auth/token/refresh/`
  - `/api/health/`

## Tests and Future Work

- Add automated tests for register flow, category CRUD, note CRUD, and filtering.
- Add rate limiting, throttling, pagination, and ordering.
- Replace `CORS_ALLOW_ALL_ORIGINS=True` with whitelisted origins.