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

- `app/pages/` — Heute (`index`), `session/[id]` (Übersicht, Player, Abschluss),
  `plan`, `uebungen`, `bloecke`, `workouts`, `frei`, `stats`, `login`, `confirm`
- `app/components/ui/` — Design-System-Primitives (Button, Card, Input, Tag,
  ProgressBar, Chip, Sheet)
- `app/composables/` — Datenzugriff je Domäne (`useSession`, `useExercises`,
  `useBlocks`, `useWorkouts`, `usePlans`, `useFreeform`, `useStats`, `useToday`)
- `app/assets/css/main.css` — Design-Tokens aus dem Handoff als Tailwind-Theme
- `supabase/schema.sql` — Tabellen und RLS-Policies, `migrations/` für Änderungen
- `nuxt.config.ts` — Module, Auth-Redirects, Head

## Datenmodell

Übungen, Blöcke und Workouts sind getrennt und **referenzieren** einander statt
zu kopieren — eine Änderung am Block wirkt in jedem Workout, das ihn nutzt.

Die Ausnahme ist die Session: beim Start werden Blöcke zu einzelnen
`session_items` aufgelöst und eingefroren. Sonst würde ein später bearbeiteter
Block rückwirkend alte Trainingsprotokolle verändern — und man kann pro Tag
umsortieren, überspringen und „nur heute" ergänzen, ohne den Plan anzufassen.

`user_id` setzt Postgres per `default auth.uid()`. Der Client schickt sie nicht
mit: `useSupabaseUser()` liefert die JWT-Claims, wo die ID `sub` heißt.

## Mobile

Die App ist fürs iPhone gebaut. Layouts in 375 px entwerfen und dort prüfen,
`dvh` statt `vh`, Touch-Ziele mindestens 44 px, `safe-bottom` für die Homebar.

## Auth

`@nuxtjs/supabase` schützt alle Seiten außer `/login` und `/confirm`.
Angemeldet wird mit E-Mail und Passwort; Sessions halten ein Jahr.

## Deploy

Vercel erkennt Nuxt automatisch. `SUPABASE_URL` und `SUPABASE_KEY` müssen in den
Projekt-Umgebungsvariablen liegen (Production, Preview, Development).
