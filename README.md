# Weave_It - Weave your own Workflows

Weave_It is a modern, AI-powered web application built with Next.js, designed to streamline workflows and application building. It leverages the power of Google Gemini AI for intelligence, Clerk for secure authentication, and Trigger.dev for robust background job processing.

## 🚀 Features

- **AI-Powered**: Integrates with Google Generative AI (Gemini) for advanced capabilities.
- **Secure Authentication**: User management and authentication powered by Clerk.
- **Type-Safe API**: Server actions for end-to-end type safety between client and server (no tRPC).
- **Modern UI**: Styled with Tailwind CSS and Radix UI for a responsive and accessible interface.
- **State Management**: Efficient state handling using Zustand and React Query.
- **Database**: PostgreSQL database managed with Prisma ORM.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Database**: [Prisma](https://www.prisma.io/) (PostgreSQL)
- **Authentication**: [Clerk](https://clerk.com/)
- **Background Jobs**: [Trigger.dev](https://trigger.dev/)
- **File Uploads**: [Transloadit](https://transloadit.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📋 Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (starts with `pk_test_` or `pk_live_`) |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (starts with `sk_test_` or `sk_live_`) |
| `CLERK_WEBHOOK_SECRET` | ✅* | Clerk webhook signing secret (starts with `whsec_`) – *needed to sync users to DB |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Google AI Studio API key (for LLM nodes) |
| `TRIGGER_SECRET_KEY` | ✅ | Trigger.dev secret key (starts with `tr_dev_` or `tr_prod_`) |
| `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` | ✅ | Transloadit auth key (client uploads: Image/Video nodes) |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | ✅ | Transloadit key (Trigger.dev tasks: crop/extract uploads) |
| `NEXT_PUBLIC_API_URL` | ❌ | Optional; legacy API base URL (default: `http://localhost:4000`) |
| `PORT` | ❌ | Optional; Next.js port (default: `3000`) |

**Quick copy:** Use `.env.example` as a template – copy it to `.env` and fill in your values.  
**Step-by-step:** See **[ENV_SETUP.md](./ENV_SETUP.md)** for how to get each variable from Clerk, Supabase/Neon, Google AI Studio, Trigger.dev, and Transloadit.

---

## 🏁 How to Set Up This Project

### Prerequisites

- **Node.js** v18 or higher – [nodejs.org](https://nodejs.org/)
- **Bun** (recommended) or npm/yarn – [bun.sh](https://bun.sh/)
- **PostgreSQL** – use [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or a local/remote PostgreSQL instance
- Accounts (free tiers available):
  - [Clerk](https://clerk.com/) – auth
  - [Google AI Studio](https://aistudio.google.com/apikey) – Gemini API key
  - [Trigger.dev](https://trigger.dev/) – background tasks
  - [Transloadit](https://transloadit.com/) – file uploads

### 1. Clone and install

```bash
git clone <your-repo-url>
cd client
bun install
# or: npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

1. **Clerk**  
   - [Clerk Dashboard](https://dashboard.clerk.com/) → your app → **API Keys**  
   - Copy **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  
   - Copy **Secret key** → `CLERK_SECRET_KEY`  

2. **Clerk webhook** (so users are created in your DB)  
   - Clerk Dashboard → **Webhooks** → **Add Endpoint**  
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk` (for local dev you can use a tunnel like ngrok)  
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`  
   - Copy **Signing secret** → `CLERK_WEBHOOK_SECRET`  

3. **Database**  
   - Create a PostgreSQL database (e.g. Supabase or Neon).  
   - Set `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"`  

4. **Google Gemini**  
   - [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key**  
   - Set `GOOGLE_GEMINI_API_KEY=...`  

5. **Trigger.dev**  
   - [Trigger.dev](https://cloud.trigger.dev/) → create or open your project → **Project Settings** for the project ID.  
   - In **`trigger.config.ts`**, set `project` to your project ID (e.g. `"proj_xxxxx"`).  
   - In the dashboard → **API Keys** → copy the dev key (starts with `tr_dev_`) → `TRIGGER_SECRET_KEY` in `.env`.  

6. **Transloadit**  
   - [Transloadit](https://transloadit.com/) → **Credentials**  
   - Set `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` and `NEXT_PUBLIC_TRANSLOADIT_KEY` (both used in this app).

### 3. Database setup

```bash
bunx prisma generate
bunx prisma migrate dev
# or, if you already have migrations: bunx prisma migrate deploy
```

### 4. Run the app (local dev)

**Terminal 1 – Next.js:**

```bash
bun dev
# or: npm run dev
```

**Terminal 2 – Trigger.dev (required for running workflow nodes):**

```bash
bun run trigger:dev
# or: bunx trigger.dev dev
```

- App: [http://localhost:3000](http://localhost:3000)  
- Sign in is required; use Clerk’s sign-in/sign-up (or the app’s sign-in page).  
- Without Trigger.dev running, LLM / Crop Image / Extract Frame nodes will not execute.

### 5. (Optional) Production build

```bash
bun run build
bun run start
```

For production, run Trigger.dev in the cloud (see [Trigger.dev docs](https://trigger.dev/docs)); do not rely only on `trigger dev` locally.

---

## 📜 Available Scripts

| Command | Description |
|--------|-------------|
| `bun dev` | Start Next.js in development mode |
| `bun run build` | Generate Prisma client and build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bunx prisma generate` | Generate Prisma client |
| `bunx prisma migrate dev` | Create and apply migrations (dev) |
| `bun run trigger:dev` | Start Trigger.dev dev worker (run in a separate terminal) |

---

## 📂 Project Structure

- **`src/app`** – App Router pages, layouts, API routes (webhooks, trigger)
- **`src/components`** – UI components, workflow nodes, sections
- **`src/lib`** – Utilities, server actions, DB, Transloadit, node execution
- **`src/stores`** – Zustand workflow state
- **`src/trigger`** – Trigger.dev tasks (LLM, crop image, extract frame)
- **`prisma`** – Schema and migrations

---

Built with Next.js and ❤️.
