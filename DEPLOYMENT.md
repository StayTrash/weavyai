# Deployment Guide – Galaxy.ai (Weave_It)

Step-by-step guide to deploy this Next.js app to production.

---

## Overview

| Component        | Where it runs in production        |
|-----------------|------------------------------------|
| Next.js app     | Vercel (or your chosen platform)   |
| PostgreSQL      | Supabase / Neon / Railway / etc.   |
| Auth            | Clerk (cloud)                      |
| Background jobs | Trigger.dev Cloud                  |
| File processing | Transloadit (cloud)                |

---

## Step 1: Prepare your production database

1. Create a **PostgreSQL** database for production:
   - [Supabase](https://supabase.com/) → New project → copy connection string
   - [Neon](https://neon.tech/) → New project → connection string
   - Or Railway, Render, etc.

2. Set **one** production `DATABASE_URL` (e.g. in a `.env.production` locally or in your host’s env):
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   ```

3. Run migrations against the production DB (use the same env when running):
   ```bash
   cd client
   bunx prisma migrate deploy
   ```
   This applies all migrations in `prisma/migrations/` to the production database.

---

## Step 2: Clerk production setup

1. In [Clerk Dashboard](https://dashboard.clerk.com/) → your application → switch to **Production** (or create a production instance).

2. Copy **production** keys:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

3. Add a **production webhook** so users are synced to your DB:
   - **Webhooks** → **Add Endpoint**
   - **Endpoint URL:** `https://YOUR-DEPLOYED-DOMAIN.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy **Signing secret** → `CLERK_WEBHOOK_SECRET`

You can add the webhook URL after you know your deployed domain (Step 4) and then update the env var.

---

## Step 3: Trigger.dev production setup

1. In [Trigger.dev Dashboard](https://cloud.trigger.dev/) → your project → **API Keys**.

2. Create or copy a **production** key (starts with `tr_prod_`).  
   Set in env: `TRIGGER_SECRET_KEY=tr_prod_...`

3. Deploy your Trigger.dev tasks (from your repo, with env pointing to production where needed):
   ```bash
   cd client
   bunx trigger.dev deploy
   ```
   Use the same `TRIGGER_SECRET_KEY` (prod) when deploying. Your `trigger.config.ts` already has `project` set.

4. In production, the Next.js app only needs to call the Trigger.dev API; workers run on Trigger.dev Cloud, not on Vercel.

---

## Step 4: Deploy the Next.js app to Vercel

### 4.1 Connect the repo

1. Push your code to **GitHub** (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import the repo and set **Root Directory** to `client` (since the app lives in `client/`).

### 4.2 Environment variables in Vercel

In the project → **Settings** → **Environment Variables**, add (for **Production**):

| Variable | Value | Notes |
|----------|--------|--------|
| `DATABASE_URL` | `postgresql://...` | Production DB URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk production |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk production |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` | From Step 2 webhook |
| `GOOGLE_GEMINI_API_KEY` | your key | Same as dev or new key |
| `TRIGGER_SECRET_KEY` | `tr_prod_...` | Trigger.dev production key |
| `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` | your key | Transloadit |
| `NEXT_PUBLIC_TRANSLOADIT_KEY` | your key | Transloadit |

Optional:

- `NEXT_PUBLIC_API_URL` – set to your production URL if the app uses it (e.g. `https://your-app.vercel.app`).

Do **not** commit `.env` or secrets to git; use only Vercel’s env UI (or CLI).

### 4.3 Deploy

1. Click **Deploy** (or push to the connected branch).
2. Wait for the build. The project uses `prisma generate` in `build` (see `package.json`), so Prisma runs at build time.
3. After deploy, note your URL (e.g. `https://your-app.vercel.app`).

### 4.4 Finish Clerk webhook

- Set the Clerk webhook URL to `https://your-app.vercel.app/api/webhooks/clerk` and save `CLERK_WEBHOOK_SECRET` in Vercel if you hadn’t already.

---

## Step 5: Verify

1. **App:** Open `https://your-app.vercel.app` and sign up / sign in (Clerk production).
2. **DB:** Create a workflow or user and check in your DB (Supabase/Neon dashboard) that records appear.
3. **Trigger.dev:** Run a workflow that uses LLM / Crop / Extract Frame; in [Trigger.dev runs](https://cloud.trigger.dev/) you should see the run and success/failure.
4. **Clerk webhook:** In Clerk Dashboard → Webhooks → your endpoint, check “Recent deliveries” for 200 responses.

---

## Checklist summary

- [ ] Production PostgreSQL created; `DATABASE_URL` set in Vercel.
- [ ] `bunx prisma migrate deploy` run against production DB.
- [ ] Clerk production keys and webhook (with final deploy URL) set in Vercel.
- [ ] Trigger.dev production key set in Vercel; `bunx trigger.dev deploy` run from `client/`.
- [ ] All other env vars (Gemini, Transloadit) set in Vercel.
- [ ] Root directory in Vercel set to `client`.
- [ ] Deploy triggered; app and webhooks tested.

---

## Optional: Custom domain

- Vercel: **Settings** → **Domains** → add your domain and follow DNS instructions.
- Clerk: **Domains** → add the same domain so auth works on your custom URL.

---

## Troubleshooting

- **Build fails on Prisma:** Ensure `DATABASE_URL` is set in Vercel (build env). Prisma generate does not need a reachable DB, but the var must exist.
- **Users not in DB:** Check Clerk webhook URL and `CLERK_WEBHOOK_SECRET`; check Vercel function logs for `/api/webhooks/clerk`.
- **Tasks not running:** Confirm `TRIGGER_SECRET_KEY` is production and `trigger.dev deploy` succeeded; check Trigger.dev dashboard for errors.
- **CORS / API errors:** If you use `NEXT_PUBLIC_API_URL`, set it to your production origin (e.g. `https://your-app.vercel.app`).

For more detail on env vars and getting each key, see **README.md** and **ENV_SETUP.md**.
