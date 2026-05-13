# Rafeeq — AI Health Assistant

**رفيق: نظام الذكاء الاصطناعي الصحي المدمج مع منظومة حكيم الأردنية**  
Rafeeq is an AI-powered clinical assistant web app designed to help doctors and families manage health data, track key metrics, and gain actionable clinical insights. The system provides a fully Arabic-localized interface with deep integration into Jordan’s Hakeem national health platform.

---

## 🧩 Tech Stack

- **Frontend:** [Next.js (TypeScript)](https://nextjs.org/)  
- **Backend:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Vector Store:** Qdrant (for patient data embeddings & semantic search)
- **LLM/AI:** OpenAI (LangChain integration for embeddings & chat)
- **Authentication:** JWT (JSON Web Tokens)
- **Styling:** Tailwind CSS, IBM Plex Sans Arabic font
- **Other:** OCR (Prescription uploads), Audit logs for all AI interactions

---

## 🚀 Features Overview

- Doctor & patient dashboards (Arabic-first)
- Health metrics: Labs (HbA1c, BP), medication, risk flags
- Family health management, summary stats
- AI-powered chat, suggested prompts, and risk analysis
- AI prescription image uploads & extraction
- All records synced and auditable (with Hakeem system integration)

---

## ⚙️ Local Development Setup

### 1. Prerequisites

- [Node.js (v18+)](https://nodejs.org/)
- [Python (3.11+)](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/) (for backend data)
- [Qdrant](https://qdrant.tech/documentation/quick_start/) (for vector search, via Docker recommended)
- **API Keys:** OpenAI API key for embeddings/chat

### 2. Clone the Repo

```bash
git clone https://github.com/amepic123123/front.git
cd front
```

### 3. Frontend (Next.js)

Install dependencies:

```bash
npm install
# or: yarn install
```

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

> 🎨 All React/TypeScript code is in `src/`. Main entry: `src/app/layout.tsx` and `src/components/`.

### 4. Backend (FastAPI)

Install Python dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Set up environment variables (for database, Qdrant, and API keys). Example `.env` file:

```ini
DATABASE_URL=postgresql+asyncpg://username:password@localhost/dbname
QDRANT_HOST=localhost
QDRANT_PORT=6333
OPENAI_API_KEY=sk-...
```

Run the backend API:

```bash
uvicorn app.main:app --reload
```

Backend is now running at [http://localhost:8000](http://localhost:8000).

### 5. Qdrant Vector Database (Docker)

If not installed, you can quickly run it via Docker:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

---

## 🏁 Seed Test Data

Optionally populate mock patients, labs, and history for demos:

```bash
cd backend
python seed_more.py
```

---

## 🧠 Running Everything Together

- **Frontend (Next.js):** `localhost:3000`
- **Backend (FastAPI):** `localhost:8000`
- **Qdrant:** `localhost:6333`
- **PostgreSQL:** (your configured instance)

All services need to be running for the app to function fully:  
1. Start Qdrant and PostgreSQL  
2. Start the backend server  
3. Start the frontend development server

---

## 📝 Additional Notes

- For full functionality, you may need OpenAI API Key (for semantic search & chat).
- The app supports both English and full Arabic localization.
- For deployments, consider using platforms like [Vercel](https://vercel.com/) for frontend and [Render](https://render.com/) or servers for backend/Qdrant/Postgres.

---

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Qdrant Quick Start](https://qdrant.tech/documentation/quick_start/)
- [LangChain](https://python.langchain.com/)

---

## 🤝 Contributions

We welcome contributions! Please fork, branch, and submit a PR — see the `CONTRIBUTING.md` if available.
