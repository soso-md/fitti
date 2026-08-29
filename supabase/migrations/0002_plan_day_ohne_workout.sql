-- =====================================================================
--  Ein Plantag darf noch ohne Workout dastehen
--
--  Beim Anlegen weiss man oft schon, an welchen Tagen trainiert wird,
--  aber noch nicht womit. Vorher erzwang not null, dass man den Plan
--  erst speichern konnte, wenn jeder Tag belegt war.
-- =====================================================================

alter table public.plan_days alter column workout_id drop not null;

-- Der alte Unique-Schlüssel behandelt NULL nicht als Wert, damit waeren
-- beliebig viele leere Eintraege je Tag moeglich. Zwei Teil-Indizes
-- trennen die Faelle sauber: je Tag entweder ein Workout genau einmal,
-- oder hoechstens ein leerer Platzhalter.
alter table public.plan_days drop constraint if exists plan_days_unique;

create unique index if not exists plan_days_mit_workout_idx
  on public.plan_days (plan_id, weekday, workout_id)
  where workout_id is not null;

create unique index if not exists plan_days_ohne_workout_idx
  on public.plan_days (plan_id, weekday)
  where workout_id is null;
