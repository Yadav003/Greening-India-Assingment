# TaskFlow Frontend

React frontend for TaskFlow, built with a mock API powered by json-server.

## Overview

This app includes:

- User authentication (register, login, persisted session)
- Protected routes with automatic redirect to login on 401
- Projects list with create project flow
- Project detail page with task creation, editing, deletion, status updates, and filtering
- Optimistic UI updates for task status changes with rollback on API failure
- Clear loading, error, and empty states across key screens

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- json-server (custom middleware server for auth + business routes)

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a local env file from the example:

```bash
cp .env.example .env
```

Default:

```env
VITE_API_URL=http://localhost:4000
```

### 3. Start the mock API (Terminal 1)

```bash
npm run mock:api
```

The API runs on http://localhost:4000.

### 4. Start the frontend (Terminal 2)

```bash
npm run dev
```

Open the app at http://localhost:5173.

## Test Credentials

- Email: test@example.com
- Password: password123

These are seeded in mock-api/db.json.

## Mock API Endpoints

Implemented endpoints:

- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /projects
- POST /projects
- GET /projects/:id
- GET /projects/:id/tasks
- POST /projects/:id/tasks
- PATCH /tasks/:id
- DELETE /tasks/:id

## Folder Structure

```text
frontend/Greening-India-Assingment
├─ mock-api/           # json-server + auth and project/task middleware routes
├─ src/
│  ├─ api/             # axios client and domain API modules
│  ├─ components/      # reusable UI components (cards, modal, navbar, states)
│  ├─ context/         # auth context and provider
│  ├─ hooks/           # reusable hooks (auth, toast)
│  ├─ pages/           # route-level screens
│  ├─ routes/          # route guards
│  ├─ types/           # TypeScript domain models
│  └─ utils/           # shared helpers (storage, validation, date, api error)
└─ README.md
```

## Architecture Decisions

- API Layer: Dedicated API modules in src/api keep transport concerns isolated from UI.
- Response Normalization: Project/task/auth responses are mapped into stable TypeScript-safe frontend models, protecting the UI from null/undefined and snake_case/camelCase drift.
- Auth Management: Auth state is stored in localStorage and synchronized through AuthProvider. Axios interceptors inject tokens and trigger centralized 401 handling.
- Route Protection: ProtectedRoute blocks private pages when unauthenticated and prevents blank-screen transitions.
- App Stability: An app-level Error Boundary renders a user-safe fallback if any unexpected runtime render error occurs.
- Task UX: Task status updates are optimistic for faster perceived performance; failures roll back state and show clear toast errors.
- UI States: Pages include explicit loading, empty, and error states to avoid silent failures.

## Quality and Performance Notes

- Hooks are memoized where useful (useCallback/useMemo) to reduce avoidable re-renders.
- Task and project actions provide per-action loading feedback (submit, delete, status update).
- Build and lint are clean:

```bash
npm run lint
npm run build
```

