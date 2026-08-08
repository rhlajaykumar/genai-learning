# Web — AI Playground UI

Next.js App Router frontend for signup/login, agent config, doc upload, chat, traces, and evals placeholder.

## Setup

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. API calls are proxied to `http://127.0.0.1:8000` via `next.config.ts` rewrites (`/api/*`).

Ensure the AI service and Postgres are running first.
