# Deployment Guide – Galaxy.ai / Weave_It

Step-by-step guide to deploy this Next.js app (Clerk, Prisma/PostgreSQL, Trigger.dev, Transloadit).

---

## Before you deploy

- [ ] **Accounts** (free tiers OK): Clerk, Google AI Studio, Trigger.dev, Transloadit  
- [ ] **PostgreSQL database** (e.g. [Supabase](https://supabase.com/) or [Neon](https://neon.tech/))  
- [ ] **Code** in a Git repo (GitHub, GitLab, or Bitbucket) so your host can build from it  

---

## Step 1: Set up a production database

1. Create a PostgreSQL project on **Supabase** or **Neon**.
2. Copy the **connection string** (URI). It usually looks like:
   ```txt
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
3. Save it; you’ll add it as `DATABASE_URL` in your deployment platform.

---

## Step 2: Choose where to deploy the app

**Recommended: Vercel** (best fit for Next.js).  
Alternatively: Railway, Render, or a VPS with Docker.

---

## Step 3: Deploy on Vercel

### 3.1 Create the project

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New** → **Project**.
3. **Import** your Git repository.
4. Set **Root Directory** to `client` (if the repo root is the monorepo and the app is in `client`). If the repo is only the app, leave root as `.`.
5. **Framework Preset**: Vercel should detect **Next.js**.
6. Do **not** deploy yet; add environment variables first.

### 3.2 Add environment variables

In the Vercel project: **Settings** → **Environment Variables**. Add these for **Production** (and optionally Preview):

| Variable | Where to get it | Notes |
|----------|-----------------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | Use **production** key (`pk_live_...`) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Use **production** secret (`sk_live_...`) |
| `CLERK_WEBHOOK_SECRET` | Step 3.5 below | After you have the deploy URL |
| `DATABASE_URL` | Supabase/Neon dashboard | Production DB connection string |
| `GOOGLE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Same as dev or a new key |
| `TRIGGER_SECRET_KEY` | Trigger.dev → API Keys | Use **production** key (`tr_prod_...`) |
| `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` | Transloadit → Credentials | |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | Transloadit → Credentials | |

Optional:

- `NEXT_PUBLIC_API_URL` – only if you use a separate API (e.g. `https://api.yourdomain.com`).
- `PORT` – leave unset on Vercel.

### 3.3 Build settings

- **Build Command:** `prisma generate && next build` (or leave default if your `package.json` already has `"build": "prisma generate && next build"`).
- **Output:** Next.js (default).
- **Install Command:** `bun install` or `npm install`.

Click **Save**.

### 3.4 Deploy

1. Click **Deploy** (or push to the connected branch to trigger a deploy).
2. Wait for the build to finish.
3. Note your **production URL**, e.g. `https://your-project.vercel.app`.

---

## Step 4: Run database migrations in production

Migrations must be run against the **production** `DATABASE_URL` (the one in Vercel).

**Option A – From your machine (safest):**

1. In your repo, create a `.env.production` (or a one-off env) with **only**:
   ```bash
   DATABASE_URL="postgresql://..."   # your production DB URL
   ```
2. Run:
   ```bash
   cd client
   bunx prisma migrate deploy
   ```
   This applies all existing migrations to the production DB. Do **not** use `migrate dev` in production.

**Option B – Vercel build (optional):**

You can run migrations in the build step so every deploy ensures DB is up to date. In Vercel → Settings → General → Build & Development Settings:

- **Build Command:**  
  `prisma generate && prisma migrate deploy && next build`

Ensure `DATABASE_URL` is set in Vercel so the build can reach your DB. Some teams prefer Option A for more control.

---

## Step 5: Configure Clerk for production

1. In [Clerk Dashboard](https://dashboard.clerk.com/), open your application.
2. Switch to **Production** (or create a production instance).
3. **API Keys**: Copy the **production** Publishable and Secret keys; they should already be in Vercel as above.
4. **Domains**: Add your production domain (e.g. `your-project.vercel.app` or `app.yourdomain.com`).

### 5.1 Clerk webhook (sync users to your DB)

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL:**  
   `https://your-production-url.vercel.app/api/webhooks/clerk`  
   (use the exact URL from Step 3.4).
3. **Events:** Subscribe to `user.created`, `user.updated`, `user.deleted`.
4. Create the endpoint; Clerk will show a **Signing secret** (`whsec_...`).
5. Add that value in Vercel as `CLERK_WEBHOOK_SECRET` (Production), then **redeploy** so the app picks it up.

Without this webhook, users won’t be created/updated in your PostgreSQL database.

---

## Step 6: Trigger.dev production

1. In [Trigger.dev](https://cloud.trigger.dev/), open your project.
2. Get the **production** API key (e.g. `tr_prod_...`) from **API Keys**.
3. Put it in Vercel as `TRIGGER_SECRET_KEY` and redeploy.
4. Deploy your Trigger.dev tasks to the cloud (see [Trigger.dev Deploy](https://trigger.dev/docs/deploy)). **Also add env vars in the Trigger.dev dashboard** (e.g. `GOOGLE_GEMINI_API_KEY` for the LLM task) under **Environment Variables** → **Production**, since tasks run on Trigger.dev's servers and do not use Vercel env vars. so background jobs run in production instead of only with `trigger dev` locally.

Your app will call Trigger.dev from the server using `TRIGGER_SECRET_KEY`; the workers run in Trigger.dev’s cloud.

---

## Step 7: Verify after deploy

1. Open your production URL and sign in (Clerk).
2. Create a test user if needed; check in your DB (Supabase/Neon) that a row was created in the `User` table (confirms webhook).
3. Run a workflow that uses Trigger.dev (e.g. LLM or image node) and confirm it runs in the Trigger.dev dashboard.
4. Test file upload (Transloadit) if you use Image/Video nodes.

---

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Create production PostgreSQL (Supabase/Neon) and get `DATABASE_URL` |
| 2 | Deploy app to Vercel (or other host), set **Root Directory** to `client` if needed |
| 3 | Add all required env vars in Vercel (Clerk, DB, Gemini, Trigger, Transloadit) |
| 4 | Run `prisma migrate deploy` against production DB |
| 5 | In Clerk: add production domain and create webhook → `https://<your-app>/api/webhooks/clerk` |
| 6 | Set `CLERK_WEBHOOK_SECRET` in Vercel and redeploy |
| 7 | Use Trigger.dev production key and deploy Trigger tasks to the cloud |
| 8 | Smoke-test: sign in, user in DB, one workflow with Trigger.dev |

---

## Deploying elsewhere (Railway, Render, Docker)

- **Railway / Render:** Create a new Web Service, connect the same repo, set **Root Directory** to `client`, and add the same environment variables. Use their “run migrations” or a release command: `prisma migrate deploy`.
- **Docker:** You’d add a `Dockerfile` that runs `prisma generate`, `prisma migrate deploy`, and `next start`. You still need a hosted PostgreSQL and the same env vars; Trigger.dev and Clerk stay as above.

If you tell me your host (Vercel, Railway, etc.), I can give you exact commands and screens for that platform.
