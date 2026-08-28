-- =====================================================================
--  Mantis Fitti — Schema
--
--  Leitgedanke aus dem Handoff: Uebungen, Bloecke und Workouts sind
--  getrennte Entitaeten. Bloecke *referenzieren* Uebungen, Workouts
--  *referenzieren* Bloecke -- nichts wird kopiert, eine Aenderung am
--  Block wirkt ueberall.
--
--  Die Ausnahme ist die Session: sobald ein Training laeuft, wird die
--  Item-Liste eingefroren (sessions -> session_items). Sonst wuerde ein
--  spaeter bearbeiteter Block rueckwirkend das Trainingsprotokoll
--  veraendern -- und man kann pro Tag umsortieren, ueberspringen und
--  "nur heute" ergaenzen, ohne den Plan anzufassen.
--
--  Alles ist nutzergebunden; jede Tabelle traegt user_id und RLS.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: eine Zeile je angemeldeter Person
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- exercises: die Uebungsbibliothek
-- Soft-Delete, damit alte Trainingsprotokolle lesbar bleiben.
-- ---------------------------------------------------------------------
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  muscle_groups text[] not null default '{}',
  level         text check (level in ('anfaenger', 'fortgeschritten')),
  image_url     text,
  video_links   text[] not null default '{}',
  instructions  text,
  -- Zeitbasierte Uebungen (Plank) zeigen im Player einen Sekunden-Timer
  -- statt der Satz-Liste.
  is_timed      boolean not null default false,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists exercises_user_idx on public.exercises (user_id) where deleted_at is null;
create index if not exists exercises_muscles_idx on public.exercises using gin (muscle_groups);

-- ---------------------------------------------------------------------
-- tags: Block-Etiketten. Warmup/Cooldown/Reha sind vorgegeben, eigene
-- duerfen dazukommen -- deshalb eine Tabelle statt eines Enums.
-- ---------------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),

  constraint tags_name_unique unique (user_id, name)
);

-- ---------------------------------------------------------------------
-- blocks: wiederverwendbare Uebungsgruppen ("Schulter-Warmup")
-- ---------------------------------------------------------------------
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.block_tags (
  block_id uuid not null references public.blocks (id) on delete cascade,
  tag_id   uuid not null references public.tags (id) on delete cascade,

  primary key (block_id, tag_id)
);

create table if not exists public.block_exercises (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.blocks (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position    integer not null,
  -- Vorgabewerte; im Player ueberschreibbar.
  target_sets integer,
  target_reps integer,
  target_seconds integer,
  target_weight numeric(6, 2),

  constraint block_exercises_position_unique unique (block_id, position) deferrable initially deferred
);

create index if not exists block_exercises_block_idx on public.block_exercises (block_id);

-- ---------------------------------------------------------------------
-- workouts: Block-Slots plus fester Hauptuebungen-Abschnitt.
-- Ein workout_item zeigt entweder auf einen Block ODER auf eine Uebung,
-- nie auf beides -- das erzwingt der Check.
-- ---------------------------------------------------------------------
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_items (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  position    integer not null,
  block_id    uuid references public.blocks (id) on delete restrict,
  exercise_id uuid references public.exercises (id) on delete restrict,
  target_sets integer,
  target_reps integer,
  target_seconds integer,
  target_weight numeric(6, 2),

  constraint workout_items_one_ref check (
    (block_id is not null and exercise_id is null)
    or (block_id is null and exercise_id is not null)
  ),
  constraint workout_items_position_unique unique (workout_id, position) deferrable initially deferred
);

create index if not exists workout_items_workout_idx on public.workout_items (workout_id);

-- ---------------------------------------------------------------------
-- plans: mehrere parallele Plaene, je Wochentag ein Workout.
-- repeat_mode 'weekly' laeuft unbefristet, 'period' hat ein Enddatum --
-- was danach passiert, steht in on_expiry.
-- ---------------------------------------------------------------------
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  repeat_mode text not null default 'weekly' check (repeat_mode in ('weekly', 'period')),
  starts_on   date,
  ends_on     date,
  on_expiry   text check (on_expiry in ('extend', 'archive', 'manual')),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Ein Zeitraum-Plan braucht Ende und Nachlaufregel, ein Wochenplan nicht.
  constraint plans_period_complete check (
    repeat_mode <> 'period' or (ends_on is not null and on_expiry is not null)
  )
);

create table if not exists public.plan_days (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references public.plans (id) on delete cascade,
  -- ISO-Wochentag: 1 = Montag ... 7 = Sonntag, passend zu date_part('isodow').
  weekday    integer not null check (weekday between 1 and 7),
  workout_id uuid not null references public.workouts (id) on delete cascade,

  constraint plan_days_unique unique (plan_id, weekday, workout_id)
);

create index if not exists plan_days_plan_idx on public.plan_days (plan_id);

-- ---------------------------------------------------------------------
-- sessions: ein durchgefuehrtes Training.
-- workout_id ist nur die Herkunft -- was tatsaechlich passiert ist,
-- steht in session_items.
-- ---------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  workout_id  uuid references public.workouts (id) on delete set null,
  plan_id     uuid references public.plans (id) on delete set null,
  title       text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,

  constraint sessions_finish_after_start check (finished_at is null or finished_at >= started_at)
);

create index if not exists sessions_user_started_idx on public.sessions (user_id, started_at desc);

create table if not exists public.session_items (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position    integer not null,
  -- Woher das Item kam. 'adhoc' = nur heute dazugenommen, nicht im Plan.
  source      text not null default 'main' check (source in ('block', 'main', 'adhoc')),
  -- Freitext, damit der Player "Warmup"/"Cooldown"/"Reha" anzeigen kann,
  -- ohne den Block nachzuladen. Zum Zeitpunkt der Session eingefroren.
  source_label text,
  skipped     boolean not null default false,
  note        text,

  constraint session_items_position_unique unique (session_id, position) deferrable initially deferred
);

create index if not exists session_items_session_idx on public.session_items (session_id, position);

create table if not exists public.session_sets (
  id              uuid primary key default gen_random_uuid(),
  session_item_id uuid not null references public.session_items (id) on delete cascade,
  position        integer not null,
  reps            integer,
  weight          numeric(6, 2),
  duration_seconds integer,
  done_at         timestamptz,

  constraint session_sets_position_unique unique (session_item_id, position) deferrable initially deferred
);

create index if not exists session_sets_item_idx on public.session_sets (session_item_id);

-- ---------------------------------------------------------------------
-- freeform_logs: unstrukturiertes Training (Volleyball, Schwimmen).
-- Das Kennzahl-Feld ist generisch: metric_label passt sich der Sportart
-- an ("Bahnen a 25m", "Distanz"), metric_type sagt, wie zu lesen ist.
-- ---------------------------------------------------------------------
create table if not exists public.freeform_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  sport        text not null,
  performed_at timestamptz not null default now(),
  duration_minutes integer,
  metric_type  text check (metric_type in ('sets_reps_weight', 'duration', 'distance_time', 'custom')),
  metric_label text,
  metric_value numeric(10, 2),
  intensity    integer check (intensity between 1 and 10),
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists freeform_logs_user_idx on public.freeform_logs (user_id, performed_at desc);

-- =====================================================================
--  Row Level Security
--  Direkt nutzergebundene Tabellen pruefen user_id, Kindtabellen haengen
--  sich per exists() an ihren Elternsatz.
-- =====================================================================

alter table public.profiles        enable row level security;
alter table public.exercises       enable row level security;
alter table public.tags            enable row level security;
alter table public.blocks          enable row level security;
alter table public.block_tags      enable row level security;
alter table public.block_exercises enable row level security;
alter table public.workouts        enable row level security;
alter table public.workout_items   enable row level security;
alter table public.plans           enable row level security;
alter table public.plan_days       enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_items   enable row level security;
alter table public.session_sets    enable row level security;
alter table public.freeform_logs   enable row level security;

-- Profil: nur die eigene Zeile.
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Direkt nutzergebundene Tabellen.
do $$
declare t text;
begin
  foreach t in array array[
    'exercises', 'tags', 'blocks', 'workouts', 'plans', 'sessions', 'freeform_logs'
  ] loop
    execute format('drop policy if exists %I_own on public.%I', t, t);
    execute format(
      'create policy %I_own on public.%I for all
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- Kindtabellen: erlaubt, wenn der Elternsatz mir gehoert.
do $$
declare
  spec text[][] := array[
    ['block_tags',      'blocks',        'block_id'],
    ['block_exercises', 'blocks',        'block_id'],
    ['workout_items',   'workouts',      'workout_id'],
    ['plan_days',       'plans',         'plan_id'],
    ['session_items',   'sessions',      'session_id'],
    ['session_sets',    'session_items', 'session_item_id']
  ];
  i int;
begin
  for i in 1 .. array_length(spec, 1) loop
    execute format('drop policy if exists %I_own on public.%I', spec[i][1], spec[i][1]);
    if spec[i][2] = 'session_items' then
      -- Zwei Ebenen tief: session_sets -> session_items -> sessions
      execute format(
        'create policy %I_own on public.%I for all
           using (exists (
             select 1 from public.session_items si
               join public.sessions s on s.id = si.session_id
             where si.id = %I.%I and s.user_id = auth.uid()))
           with check (exists (
             select 1 from public.session_items si
               join public.sessions s on s.id = si.session_id
             where si.id = %I.%I and s.user_id = auth.uid()))',
        spec[i][1], spec[i][1], spec[i][1], spec[i][3], spec[i][1], spec[i][3]);
    else
      execute format(
        'create policy %I_own on public.%I for all
           using (exists (select 1 from public.%I p
                          where p.id = %I.%I and p.user_id = auth.uid()))
           with check (exists (select 1 from public.%I p
                               where p.id = %I.%I and p.user_id = auth.uid()))',
        spec[i][1], spec[i][1], spec[i][2], spec[i][1], spec[i][3],
        spec[i][2], spec[i][1], spec[i][3]);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Profil automatisch anlegen, sobald sich jemand registriert.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
