# How to Get All Environment Variables

Copy `.env.example` to `.env`, then follow the steps below to fill in each value.

---

## Steps in order

1. **Create `.env`**  
   In the `client` folder run: `cp .env.example .env` (or copy the file and rename to `.env`).

2. **Clerk**  
   Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app → **API Keys**.  
   Copy **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env`.  
   Copy **Secret key** → `CLERK_SECRET_KEY` in `.env`.

3. **Clerk webhook**  
   In Clerk: **Webhooks** → **Add Endpoint** → URL: `https://your-domain.com/api/webhooks/clerk` (or ngrok URL for local).  
   Subscribe to `user.created`, `user.updated`, `user.deleted` → **Create** → copy **Signing secret** → `CLERK_WEBHOOK_SECRET` in `.env`.

4. **Database**  
   Create a PostgreSQL DB at [Supabase](https://supabase.com) or [Neon](https://neon.tech).  
   Copy the **connection string** (URI) → `DATABASE_URL` in `.env` (keep it in quotes).

5. **Google Gemini**  
   Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key** → copy key → `GOOGLE_GEMINI_API_KEY` in `.env`.

6. **Trigger.dev**  
   Go to [cloud.trigger.dev](https://cloud.trigger.dev) → create/open project.  
   Copy **Project ID** → open `trigger.config.ts` in this repo → set `project: "proj_xxxx"` (your ID).  
   Go to **API Keys** → copy **Dev** key → `TRIGGER_SECRET_KEY` in `.env`.

7. **Transloadit**  
   Go to [transloadit.com](https://transloadit.com) → **Credentials**.  
   Copy **Auth Key** (or Key) → set both `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` and `NEXT_PUBLIC_TRANSLOADIT_KEY` in `.env` to this value.

8. **Run the app**  
   `bunx prisma generate` → `bunx prisma migrate dev` → `bun dev`.  
   In a second terminal: `bun run trigger:dev` (or `bunx trigger.dev dev`).

---

## 1. Clerk (Authentication) – detailed

**URL:** https://dashboard.clerk.com

1. Sign up or log in.
2. Create an **Application** (or select an existing one).
3. In the left sidebar, go to **API Keys**.
4. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** (starts with `sk_test_` or `sk_live_`) → `CLERK_SECRET_KEY`

### Clerk Webhook Secret (for user sync to your DB)

1. In Clerk Dashboard, go to **Webhooks** in the sidebar.
2. Click **Add Endpoint**.
3. **Endpoint URL:**
   - Production: `https://your-domain.com/api/webhooks/clerk`
   - Local dev: use a tunnel (e.g. [ngrok](https://ngrok.com/)) and put that URL, e.g. `https://abc123.ngrok.io/api/webhooks/clerk`
4. Under **Subscribe to events**, enable:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Click **Create**.
6. On the new webhook, open **Signing secret** and copy it (starts with `whsec_`) → `CLERK_WEBHOOK_SECRET`

---

## 2. Database (PostgreSQL) – detailed

**Options:** [Supabase](https://supabase.com/) | [Neon](https://neon.tech/) | [Railway](https://railway.app/) | your own PostgreSQL

### Using Supabase

1. Go to https://supabase.com and create a project.
2. In the project, go to **Settings** → **Database**.
3. Under **Connection string**, choose **URI** and copy it.
4. Replace the placeholder password with your database password if needed.
5. Paste into `.env` as `DATABASE_URL="postgresql://..."`  
   (Keep the quotes; add `?sslmode=require` if not already present.)

### Using Neon

1. Go to https://neon.tech and create a project.
2. On the project dashboard, copy the **Connection string**.
3. Paste into `.env` as `DATABASE_URL="postgresql://..."`

---

## 3. Google Gemini (AI / LLM) – detailed

**URL:** https://aistudio.google.com/apikey

1. Sign in with your Google account.
2. Click **Create API key** (or **Get API key**).
3. Choose or create a Google Cloud project when prompted.
4. Copy the key (starts with `AIzaSy`) → `GOOGLE_GEMINI_API_KEY`

---

## 4. Trigger.dev (Background jobs) – detailed

**URL:** https://cloud.trigger.dev

1. Sign up or log in.
2. Create a new **Project** (or open an existing one).
3. **Project ID (for `trigger.config.ts`):**
   - Go to **Project Settings** (or project overview).
   - Copy the **Project ID** (e.g. `proj_xxxxxxxxxxxx`).
   - In the repo, open `trigger.config.ts` and set `project: "proj_xxxxxxxxxxxx"` (your actual ID).
4. **Secret key (for `.env`):**
   - Go to **API Keys** in the sidebar.
   - Copy the **Dev** key (starts with `tr_dev_`) → `TRIGGER_SECRET_KEY`  
   - For production, use a **Production** key (`tr_prod_...`) and set it in your hosting env (e.g. Vercel).

---

## 5. Transloadit (File uploads) – detailed

**URL:** https://transloadit.com

1. Sign up or log in.
2. Go to **Credentials** (or **Account** → **Credentials**).
3. You’ll see:
   - **Auth Key** (or “Key”) – use for server/Trigger tasks.
   - **Secret** (or “Secret key”) – use for signed client uploads if you use signing.
4. For this project:
   - **Auth Key** → use for both:
     - `NEXT_PUBLIC_TRANSLOADIT_KEY` (used by Trigger.dev crop/extract tasks)
     - `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY` (used by client Image/Video uploads)
   - If Transloadit shows two different keys (e.g. “Key” and “Auth Key”), put the one used for API auth in both. If there’s only one key, set both env vars to that same value.

---

## 6. Optional

- **NEXT_PUBLIC_API_URL** – Only if you use a separate API server. For this Next.js app alone, you can leave as `http://localhost:4000` or omit.
- **PORT** – Next.js port; default is `3000`. Set only if you need a different port.

---

## Checklist

Before running the app, ensure:

- [ ] `.env` exists (copy from `.env.example`).
- [ ] Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.
- [ ] Database: `DATABASE_URL`.
- [ ] Gemini: `GOOGLE_GEMINI_API_KEY`.
- [ ] Trigger.dev: `TRIGGER_SECRET_KEY` in `.env` and `project` in `trigger.config.ts`.
- [ ] Transloadit: `NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY`, `NEXT_PUBLIC_TRANSLOADIT_KEY`.

Then run:

```bash
bunx prisma generate
bunx prisma migrate dev
bun dev
```

In a **second terminal** (for workflow execution):

```bash
bun run trigger:dev
```
