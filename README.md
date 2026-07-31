# Mang Sueb-title

An AI-powered MP3 -> SRT subtitle generator, tuned for Bahasa Indonesia (EYD-style)
and Shopee-specific terminology, running on Gemini.

This is a **static app** with a **baked-in API key** -- your team doesn't need
their own Gemini key or any login. The key lives only as a build-time
environment variable, never committed to git, and is locked to your deployed
domain so it can't be reused elsewhere if someone finds it.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and paste in your own Gemini API key
   (get one free at https://aistudio.google.com/apikey)
3. Run the app:
   `npm run dev`

## Deploy (Vercel / Netlify)

1. Push this repo to GitHub (or drag the folder into Vercel/Netlify directly)
2. In your hosting provider's dashboard, go to
   **Project Settings > Environment Variables** and add:
   `VITE_GEMINI_API_KEY` = your key
3. Deploy / redeploy -- the key gets baked into the build at that point
4. **Lock the key down** (important, do this once): in Google Cloud Console ->
   APIs & Services -> Credentials -> your key -> Application restrictions ->
   **HTTP referrers**, add your deployed domain, e.g. `https://your-app.vercel.app/*`.
   This means the key only works when called from your site -- copying it
   elsewhere won't do anything.
5. Share the deployed URL with your team. No login, no per-person key needed.

## Notes

- Never commit `.env.local` or any file containing the real key -- it's
  already covered by `.gitignore` (the `*.local` rule).
- Only `.mp3` files up to 50MB are supported (see `App.tsx` to adjust).
- If usage ever grows a lot, keep an eye on Google Cloud billing/quota for
  this key, since it's now shared across the whole team.
