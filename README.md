# Galaxy.ai

**Visual AI workflow builder** — design node-based pipelines with images, video, text, and LLMs. Run them locally or in the cloud with Trigger.dev. Built with Next.js, Clerk, Prisma, and Google Gemini.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Setup guide](#setup-guide)
- [Project structure](#project-structure)
- [Workflow nodes](#workflow-nodes)
- [Sample workflows](#sample-workflows)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

Galaxy.ai (also known as **Weave_It** in the codebase) is a **visual workflow builder** where you:

- **Add nodes** — Text, Image, Video, Crop Image, Extract Frame, and LLM (Gemini).
- **Connect them** — Drag edges between outputs and inputs (e.g. image → LLM, text → LLM).
- **Run workflows** — Execute full graph or selected nodes; LLM and media tasks run via [Trigger.dev](https://trigger.dev/).
- **Persist & share** — Workflows and run history are stored in PostgreSQL and tied to your user (Clerk).

Authentication is handled by **Clerk**; **Transloadit** powers file uploads for Image and Video nodes. The app is a single Next.js app (no separate backend); API routes handle webhooks and Trigger.dev polling.

---

## Features

- **Visual workflow editor** — Drag-and-drop canvas ([React Flow](https://xyflow.com/)), custom nodes and edges.
- **AI-powered** — [Google Gemini](https://ai.google.dev/) via Trigger.dev tasks for LLM nodes.
- **Media pipeline** — Upload images/video, crop images, extract video frames; all processable by LLM nodes.
- **Secure auth** — [Clerk](https://clerk.com/) for sign-in/sign-up; users synced to your DB via webhooks.
- **Background jobs** — [Trigger.dev](https://trigger.dev/) for LLM, crop, and extract-frame tasks (dev: local worker; prod: cloud).
- **Type-safe stack** — TypeScript, Prisma, Next.js App Router, server actions.
- **Modern UI** — Tailwind CSS, Radix UI, Zustand, React Query.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| Framework   | [Next.js 16](https://nextjs.org/) (App Router) |
| Language    | [TypeScript](https://www.typescriptlang.org/) |
| Styling     | [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) |
| Database    | [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) |
| Auth        | [Clerk](https://clerk.com/) |
| Background  | [Trigger.dev](https://trigger.dev/) (with ffmpeg for video) |
| Uploads     | [Transloadit](https://transloadit.com/) |
| Canvas      | [@xyflow/react](https://xyflow.com/) (React Flow) |
| State       | [Zustand](https://zustand-demo.pmnd.rs/), [TanStack Query](https://tanstack.com/query) |
| Icons       | [Lucide React](https://lucide.dev/) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js client)                                               │
│  • Workflow canvas (nodes + edges)                                       │
│  • Dashboard, folders, workflow list                                     │
│  • Auth UI (Clerk)                                                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js server (API routes, Server Actions)                             │
│  • /api/webhooks/clerk     → sync users to DB                           │
│  • /api/trigger            → poll Trigger.dev run status                │
│  • Server actions          → workflows, folders, history, DB            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PostgreSQL   │     │  Trigger.dev     │     │  Transloadit    │
│  (Prisma)     │     │  (LLM, crop,     │     │  (Image/Video   │
│  Users,       │     │   extract frame) │     │   uploads)      │
│  Workflows,   │     │  → Gemini API    │     │                 │
│  Runs         │     │  → ffmpeg        │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

- **Workflow execution**: When you run a workflow, the app computes a DAG from the graph, then triggers Trigger.dev tasks per node (LLM, crop image, extract frame). The front end polls `/api/trigger?runId=...` for status and displays results.
- **File uploads**: Image and Video nodes upload via Transloadit; resulting URLs (or base64) are passed into downstream nodes or Trigger.dev tasks as needed.

---

## Prerequisites

- **Node.js** 18+ — [nodejs.org](https://nodejs.org/)
- **Bun** (recommended) or npm/yarn — [bun.sh](https://bun.sh/)
- **PostgreSQL** — [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or local/remote Postgres
- **Accounts** (free tiers available):
  - [Clerk](https://clerk.com/) — authentication
  - [Google AI Studio](https://aistudio.google.com/apikey) — Gemini API key
  - [Trigger.dev](https://trigger.dev/) — background tasks
  - [Transloadit](https://transloadit.com/) — file uploads for Image/Video nodes

---

## Quick start

```bash
git clone <your-repo-url>
cd client
bun install
cp .env.example .env
# Edit .env with your keys (see Environment variables and Setup guide)
bunx prisma generate
bunx prisma migrate dev
```

**Terminal 1 — Next.js:**

```bash
bun dev
```

**Terminal 2 — Trigger.dev (required for LLM, Crop Image, Extract Frame):**

```bash
bun run trigger:dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Sign in via Clerk. Without Trigger.dev running, LLM and media-processing nodes will not execute.

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (`pk_test_...` or `pk_live_...`) |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (`sk_test_...` or `sk_live_...`) |
| `CLERK_WEBHOOK_SECRET` | ✅* | Clerk webhook signing secret (`whsec_...`) — *required to sync users to DB |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Google AI Studio API key (for LLM nodes) |
| `TRIGGER_SECRET_KEY` | ✅ | Trigger.dev secret key (`tr_dev_...` or `tr_prod_...`) |
| `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` | ✅ | Transloadit auth key (client uploads) |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | ✅ | Transloadit key (Trigger.dev tasks: crop/extract uploads) |
| `NEXT_PUBLIC_API_URL` | ❌ | Optional; legacy API base URL (default: `http://localhost:4000`) |
| `PORT` | ❌ | Optional; Next.js port (default: `3000`) |

---

## Setup guide

### 1. Clerk

- [Clerk Dashboard](https://dashboard.clerk.com/) → your app → **API Keys**
- **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Secret key** → `CLERK_SECRET_KEY`

### 2. Clerk webhook (sync users to DB)

- Clerk Dashboard → **Webhooks** → **Add Endpoint**
- **Endpoint URL:** `https://your-domain.com/api/webhooks/clerk` (for local dev use a tunnel, e.g. ngrok)
- **Events:** `user.created`, `user.updated`, `user.deleted`
- **Signing secret** → `CLERK_WEBHOOK_SECRET`

### 3. Database

- Create a PostgreSQL database (e.g. Supabase or Neon)
- Set `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"`

### 4. Google Gemini

- [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key**
- Set `GOOGLE_GEMINI_API_KEY=...`

### 5. Trigger.dev

- [Trigger.dev](https://cloud.trigger.dev/) → create or open project → **Project Settings** for project ID
- In `trigger.config.ts`, set `project` to your project ID (e.g. `"proj_xxxxx"`)
- Dashboard → **API Keys** → copy dev key (`tr_dev_...`) → `TRIGGER_SECRET_KEY` in `.env`

### 6. Transloadit

- [Transloadit](https://transloadit.com/) → **Credentials**
- Set `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` and `NEXT_PUBLIC_TRANSLOADIT_KEY`

---

## Project structure

```
client/
├── prisma/
│   └── schema.prisma          # User, Workflow, Folder, WorkflowRun, NodeRun
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/
│   │   │   ├── trigger/       # Poll Trigger.dev run status
│   │   │   └── webhooks/
│   │   │       └── clerk/     # Clerk user sync
│   │   ├── dashboard/         # Dashboard + workflow list
│   │   ├── workflow/[id]/     # Workflow editor page
│   │   ├── signin/, pricing/, collective/, enterprise/, demo/
│   │   └── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── workflow/          # Canvas, nodes, edges, panels
│   │   │   ├── nodes/         # LLMNode, TextNode, ImageNode, VideoNode, CropImageNode, ExtractFrameNode
│   │   │   ├── data/          # sampleWorkflows.ts, handle-colors
│   │   │   └── primitives/    # NodeShell, HandleLabel, BottomToolbar, etc.
│   │   ├── dashboard/         # Sidebar, file/folder cards, showcase
│   │   ├── sections/          # Landing: Hero, Navbar, Footer, etc.
│   │   └── ui/                # Shared UI (buttons, cards, dialogs, etc.)
│   ├── lib/
│   │   ├── actions/           # Server actions (workflow, folder, history)
│   │   ├── db.ts              # Prisma client
│   │   ├── auth-server.ts, auth.ts
│   │   ├── api.ts             # API client / Trigger polling
│   │   ├── transloadit.ts     # Upload helpers
│   │   ├── connectionValidation.ts, dagExecution.ts, nodeExecutor.ts
│   │   └── utils.ts
│   ├── stores/
│   │   └── workflow/          # Zustand slices (nodes, edges, tasks, history, persistence)
│   ├── trigger/               # Trigger.dev tasks
│   │   ├── llmTask.ts         # Gemini LLM
│   │   ├── cropImageTask.ts   # Image cropping
│   │   └── extractFrameTask.ts # Video frame extraction
│   └── types/
│       └── workflow.types.ts  # Node data, edges, run types
├── .env.example
├── package.json
├── trigger.config.ts         # Trigger.dev project, ffmpeg, retries
├── README.md
└── DEPLOYMENT.md              # Production deployment (Vercel, env, Clerk, Trigger)
```

---

## Workflow nodes

| Node | Type | Description | Handles (inputs → output) |
|------|------|-------------|---------------------------|
| **Text** | `text` | Static or editable text (prompts, product details) | — → `output` |
| **Image** | `image` | Upload one or more images (Transloadit) | — → `output` |
| **Video** | `video` | Upload a video (Transloadit) | — → `output` |
| **Crop Image** | `cropImage` | Crop an image (aspect ratio, region); runs on Trigger.dev | `image_input` → `output` |
| **Extract Frame** | `extractFrame` | Extract a frame from video (e.g. at 50%); runs on Trigger.dev | `video_input` → `output` |
| **LLM** | `llm` | Run Gemini (Trigger.dev). Accepts system prompt, user message, and images | `system_prompt`, `user_message`, `images` → `output` |

- **Connections**: Valid connections are enforced (e.g. text/image → LLM inputs; crop/frame → LLM `images`).
- **Execution**: When you run the workflow, the app builds a DAG, triggers Trigger.dev tasks for LLM / Crop / Extract Frame, and propagates outputs to downstream nodes.

---

## Sample workflows

Predefined workflows are available from the workflow editor (e.g. “Load sample” or similar):

| Name | Description |
|------|-------------|
| **LLM Test** | Simple chain: two text nodes → one LLM → output. Good for testing Gemini and Trigger.dev. |
| **Marketing Kit Generator** | Product photo + video; crop image and product details → “Generate Description” LLM; description + social prompt + images → “Final Marketing Post” LLM. Demonstrates parallel branches and convergence. |

You can duplicate and edit these from the dashboard or editor.

---

## Scripts

| Command | Description |
|--------|-------------|
| `bun dev` | Start Next.js in development mode |
| `bun run build` | Generate Prisma client and build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bunx prisma generate` | Generate Prisma client |
| `bunx prisma migrate dev` | Create and apply migrations (development) |
| `bunx prisma migrate deploy` | Apply migrations (production) |
| `bun run trigger:dev` | Start Trigger.dev dev worker (run in a separate terminal for LLM/crop/extract) |

---

## Deployment

For production:

1. Set up a **production PostgreSQL** database and `DATABASE_URL`.
2. Deploy the Next.js app (e.g. **Vercel**); set **Root Directory** to `client` if the repo root is the monorepo.
3. Add all required **environment variables** (Clerk production keys, `CLERK_WEBHOOK_SECRET`, DB, Gemini, Trigger.dev production key, Transloadit).
4. Run **migrations**: `bunx prisma migrate deploy` against the production DB.
5. Configure **Clerk** production domain and webhook → `https://<your-app>/api/webhooks/clerk`; set `CLERK_WEBHOOK_SECRET` and redeploy.
6. Use **Trigger.dev production** key and deploy Trigger tasks to the cloud; add env vars (e.g. `GOOGLE_GEMINI_API_KEY`, `NEXT_PUBLIC_TRANSLOADIT_KEY`) in the Trigger.dev dashboard.

**Full step-by-step:** see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| “User not in DB” / sign-in works but app fails | Clerk webhook not configured or wrong URL/secret. Ensure `CLERK_WEBHOOK_SECRET` is set and endpoint is `.../api/webhooks/clerk` with events `user.created`, `user.updated`, `user.deleted`. |
| LLM / Crop / Extract nodes never run | Trigger.dev dev worker must be running: `bun run trigger:dev`. In production, use Trigger.dev cloud and production API key. |
| Trigger.dev task fails (e.g. GET_ACCOUNT_UNKNOWN_AUTH_KEY) | In Trigger.dev dashboard → Environment Variables, set `GOOGLE_GEMINI_API_KEY` and `NEXT_PUBLIC_TRANSLOADIT_KEY` (same Transloadit key as in the app). |
| Uploads (Image/Video) fail | Check `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` and `NEXT_PUBLIC_TRANSLOADIT_KEY` in `.env` and Transloadit credentials. |
| Build fails (Prisma) | Run `bunx prisma generate` before build. The default `build` script includes it. |
| Migrations in production | Use `prisma migrate deploy`, not `migrate dev`. |

---


Built with Next.js and ❤️.
