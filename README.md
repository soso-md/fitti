# Fitti

Nuxt 4 + Supabase + Tailwind v4, deployt auf Vercel — gleicher Stack wie `book`.

## Einrichten

```bash
pnpm install
cp .env.example .env   # SUPABASE_URL und SUPABASE_KEY eintragen
pnpm dev
```

Das Schema liegt in [`supabase/schema.sql`](supabase/schema.sql) und wird im
Supabase-SQL-Editor ausgeführt.

## Struktur

- `app/pages/` — Seiten (`index`, `login`, `confirm`)
- `app/assets/css/main.css` — Theme-Tokens, Platzhalter bis zum Design-Handoff
- `supabase/schema.sql` — Tabellen und RLS-Policies
- `nuxt.config.ts` — Module, Auth-Redirects, Head

## Auth

`@nuxtjs/supabase` schützt alle Seiten außer `/login` und `/confirm`.
Angemeldet wird mit E-Mail und Passwort; Sessions halten ein Jahr.

## Deploy

Vercel erkennt Nuxt automatisch. `SUPABASE_URL` und `SUPABASE_KEY` müssen in den
Projekt-Umgebungsvariablen liegen (Production, Preview, Development).
