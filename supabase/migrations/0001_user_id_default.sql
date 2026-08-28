-- =====================================================================
--  user_id nicht mehr vom Client erwarten
--
--  Der Client hatte user_id selbst mitgeschickt. Das ging schief, weil
--  useSupabaseUser() die JWT-Claims liefert (id steckt dort in "sub"),
--  nicht das User-Objekt -- das Feld fiel still aus dem Insert und die
--  RLS-Policy lehnte die Zeile ab.
--
--  Jetzt setzt Postgres die Spalte aus dem Token. Der Client kann
--  user_id gar nicht mehr falsch (oder fremd) belegen.
-- =====================================================================

alter table public.exercises     alter column user_id set default auth.uid();
alter table public.tags          alter column user_id set default auth.uid();
alter table public.blocks        alter column user_id set default auth.uid();
alter table public.workouts      alter column user_id set default auth.uid();
alter table public.plans         alter column user_id set default auth.uid();
alter table public.sessions      alter column user_id set default auth.uid();
alter table public.freeform_logs alter column user_id set default auth.uid();
