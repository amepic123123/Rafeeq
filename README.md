# RAFEEQ

### Patient mode
- **Dashboard** with health score, quick stats, medications, and AI insight cards
- **AI chat** in Arabic with suggested prompts and voice input
- **Labs view** for HbA1c and blood pressure trends
- **Allergies view** pulled from the patient profile
- **Family mode** for linked family health snapshots

### Doctor mode
- Search patients from the Hakeem-style record flow
- Review risk flags and history
- Upload prescriptions for OCR + safety analysis
- Use AI-assisted consultation flows

### Product vibe
- Arabic-first UX
- glassmorphism / demo-day visuals
- Hakeem-connected clinical assistant feel
- built for a judge-friendly, high-signal MVP demo

---

## Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS 4
- **Charts / UI motion:** Recharts + Framer Motion
- **Backend API:** FastAPI
- **Infra services:** PostgreSQL + Qdrant + Redis
- **AI:** OpenAI-backed chat / embeddings / OCR flows

---

## Quick start

### 1) Start the backend stack with Docker Compose

You **do not** need to install PostgreSQL, Redis, or Qdrant manually.

```bash
cd backend
export OPENAI_API_KEY=your_key_here
docker compose up --build
```

This compose file lives at `backend/docker-compose.yml` and defines:

- `backend` → FastAPI API on `http://localhost:8000`
- `db` → PostgreSQL on `localhost:5432`
- `qdrant` → Vector DB on `localhost:6333`
- `redis` → Redis on `localhost:6379`

### 2) Run the frontend

```bash
cd ..
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Local dev notes

### Frontend API URL

By default, the frontend API client points to:

```text
http://localhost:8000
```

So for normal local development, you usually do **not** need extra frontend env setup.

If you want to override it, create `.env.local` with:


```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### AI features

Some flows depend on `OPENAI_API_KEY`, especially:
- AI chat
- RAG / insight generation
- prescription OCR / analysis

If the key is missing, core UI may still load, but AI-heavy flows will be limited or fail.

---

## Demo login flow

The app supports two experiences:

- **Patient** experience
- **Doctor** experience

The login UI includes demo shortcuts and a Sanad-style flow. The frontend stores session data in `localStorage` for MVP convenience.

Demo credential flow in the UI uses:
- doctor: `1111111111` / `doctor123`
- patient: `JO-2026-KHL-4821` / `patient123`

---

## Main screens

- `/dashboard` → patient dashboard
- `/chat` → AI assistant
- `/labs` → lab analytics
- `/allergies` → allergy profile
- `/family` → family overview
- `/doctor` → doctor workspace

Routing is handled by the catch-all app route at `src/app/[[...view]]/page.tsx`.

---

## Project structure

```text
front/
├── src/app/                 # Next.js app router shell
├── src/components/          # main UI views and shared interface pieces
├── src/lib/api.ts           # frontend API client
├── src/lib/hooks.ts         # data hooks used by the views
├── API_DOCUMENTATION.md     # frontend/backend API contract
└── backend/                 # FastAPI app + Docker Compose stack
```

Key UI files:

- `src/components/RafeeqApp.tsx` → app shell / role routing
- `src/components/LoginPage.tsx` → immersive Arabic login experience
- `src/components/PatientDashboard.tsx` → patient home
- `src/components/DoctorView.tsx` → clinical workflow view
- `src/components/ChatView.tsx` → AI chat experience
- `src/components/FamilyView.tsx` → linked family health overview

---

## API contract

Frontend/backend integration is documented in `API_DOCUMENTATION.md`.

That file defines the endpoints, response envelope, and expected payloads used by the frontend.

---

## Commands

From the repo root:

```bash
npm run dev
npm run lint
npm run build
```

From `backend/`:

```bash
docker compose up --build
```

---
- strong demo storytelling
- realistic healthcare workflows
- keeping the Hakeem-integrated product fantasy intact

