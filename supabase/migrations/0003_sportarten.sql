-- =====================================================================
--  Sportarten als eigene Entitaet
--
--  Vorher stand die Sportart nur als Freitext in jedem freeform_log, und
--  die Auswahlliste war im Frontend hart verdrahtet. Damit liess sich
--  weder die Reihenfolge steuern noch das Kennzahl-Label pflegen
--  ("Bahnen a 25 m" bei Schwimmen, "Distanz (km)" beim Rad).
--
--  freeform_logs.sport bleibt bewusst Text: ein spaeter umbenannter oder
--  geloeschter Eintrag soll alte Protokolle nicht veraendern.
-- =====================================================================

create table if not exists public.sports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null,
  -- Beschriftet das generische Kennzahl-Feld im Log-Formular.
  metric_label text,
  metric_type  text check (metric_type in ('sets_reps_weight', 'duration', 'distance_time', 'custom')),
  -- Kleinere Zahl steht weiter vorn -- "haeufigste zuerst".
  position     integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),

  constraint sports_name_unique unique (user_id, name)
);

create index if not exists sports_user_idx on public.sports (user_id, position);

alter table public.sports enable row level security;

drop policy if exists sports_own on public.sports;
create policy sports_own on public.sports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Startbestand: die vier aus dem Entwurf, plus was schon geloggt wurde.
insert into public.sports (user_id, name, metric_label, metric_type, position)
select u.id, v.name, v.label, v.typ, v.pos
from auth.users u
cross join (values
  ('Volleyball',  null,                 'duration',      0),
  ('Schwimmen',   'Bahnen (à 25 m)',    'distance_time', 1),
  ('Wandern',     'Distanz (km)',       'distance_time', 2),
  ('Radfahren',   'Distanz (km)',       'distance_time', 3)
) as v(name, label, typ, pos)
on conflict (user_id, name) do nothing;

insert into public.sports (user_id, name, metric_type, position)
select distinct f.user_id, f.sport, 'custom', 10
from public.freeform_logs f
on conflict (user_id, name) do nothing;
