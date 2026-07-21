# Deploying Class 8 B to Vercel

The AI already works on any host — it just calls the Lovable AI Gateway
(`https://ai.gateway.lovable.dev`) with a bearer key. Vercel doesn't
auto-inject that key like Lovable does, so you have to add it once.

## Environment variables to add on Vercel

Open your Vercel project → **Settings → Environment Variables** and add these
for **Production**, **Preview** and **Development**:

| Name | Value | Where to get it |
| --- | --- | --- |
| `LOVABLE_API_KEY` | starts with `sk_...` | In this Lovable project: bottom-left → **Cloud → Secrets** — the value labelled `LOVABLE_API_KEY`. |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Same **Cloud → Secrets** panel — the value labelled `SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | starts with `eyJ...` (long JWT) | Same **Cloud → Secrets** panel — `SUPABASE_SERVICE_ROLE_KEY`. Server-only, never expose to browser. |
| `SUPABASE_PUBLISHABLE_KEY` | starts with `sb_publishable_...` or `eyJ...` | Same **Cloud → Secrets** panel. |
| `VITE_SUPABASE_URL` | *same value as `SUPABASE_URL`* | Duplicate — browser needs a `VITE_` prefix to see it. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | *same value as `SUPABASE_PUBLISHABLE_KEY`* | Duplicate — browser needs the `VITE_` prefix. |
| `VITE_SUPABASE_PROJECT_ID` | your project ref, e.g. `tbhazlhfjrxuxljwsirv` | Copy from the `SUPABASE_URL` — it's the subdomain before `.supabase.co`. |

> **After adding them**, click **Deployments → Redeploy** so the new build
> picks up the environment variables.

## What each variable powers

- `LOVABLE_API_KEY` → AI chat, AI image generation, and the Daily Word poster
  generator. Without it, `/assistant` shows *"AI is not configured yet"*.
- `SUPABASE_*` (non-VITE) → server functions that save chat history, daily
  content and site content (School Song, memories, homework, etc.).
- `VITE_SUPABASE_*` → browser needs these to sign users in with Google, load
  real-time class chat, and read memories/homework/notes.

## After deploy — verify AI works

1. Open your Vercel URL → go to **/assistant**.
2. Ask *"who won ipl 2025"* — you should see a `🔎` line followed by the
   answer (Google-search-grounded).
3. Ask *"draw a picture of a purple cat"* — you should see an image card.

If the chat replies with *"AI is not configured yet"*, `LOVABLE_API_KEY` is
missing on Vercel. If images fail but text works, the key is set but
image-gen was throttled — try again in a few seconds.

## Nothing in the app depends on the Lovable domain

- The Electron desktop wrapper (which was hardcoded to Lovable URLs) has
  been removed.
- All API routes are TanStack server functions bundled with the app — they
  work identically on Vercel, Netlify, Cloudflare Pages, or any Node host.
- Streaming responses (`/assistant`) use standard `fetch` + JSON responses,
  which Vercel supports out of the box.
- Chat history is stored in the Supabase database (via `SUPABASE_*` vars),
  not on any Lovable-specific service.
