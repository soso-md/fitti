-- =====================================================================
--  Demo-Daten fuer Fitti
--  Im SQL-Editor NACH schema.sql ausfuehren. Haengt alles an den zuerst
--  registrierten Nutzer -- also an dich, wenn du der einzige bist.
-- =====================================================================

do $$
declare
  uid uuid;
  ex_armkreisen uuid; ex_bank uuid; ex_schulter uuid; ex_plank uuid; ex_stretch uuid;
  tag_warmup uuid; tag_cooldown uuid;
  blk_warmup uuid; blk_cooldown uuid;
  wo_push uuid;
  pl_gym uuid;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'Kein Nutzer vorhanden -- registriere dich zuerst in der App.';
  end if;

  -- Uebungen ---------------------------------------------------------
  insert into public.exercises (user_id, name, muscle_groups, level, is_timed, instructions)
  values
    (uid, 'Armkreisen',      array['Schulter'],           'anfaenger',      false, 'Locker aus der Schulter, erst klein, dann groesser.'),
    (uid, 'Bankdrücken',     array['Brust','Trizeps'],    'fortgeschritten', false, 'Schulterblaetter zusammen, Stange zur Brustmitte.'),
    (uid, 'Schulterdrücken', array['Schulter'],           'fortgeschritten', false, 'Rumpf fest, nicht ins Hohlkreuz gehen.'),
    (uid, 'Plank',           array['Rumpf'],              'anfaenger',      true,  'Gerade Linie von Kopf bis Ferse.'),
    (uid, 'Brust-Stretch',   array['Brust'],              'anfaenger',      false, 'Im Tuerrahmen, 30 Sekunden je Seite.');

  select id into ex_armkreisen from public.exercises where user_id = uid and name = 'Armkreisen';
  select id into ex_bank       from public.exercises where user_id = uid and name = 'Bankdrücken';
  select id into ex_schulter   from public.exercises where user_id = uid and name = 'Schulterdrücken';
  select id into ex_plank      from public.exercises where user_id = uid and name = 'Plank';
  select id into ex_stretch    from public.exercises where user_id = uid and name = 'Brust-Stretch';

  -- Tags -------------------------------------------------------------
  insert into public.tags (user_id, name) values (uid, 'Warmup'), (uid, 'Cooldown'), (uid, 'Reha')
  on conflict do nothing;
  select id into tag_warmup   from public.tags where user_id = uid and name = 'Warmup';
  select id into tag_cooldown from public.tags where user_id = uid and name = 'Cooldown';

  -- Bloecke ----------------------------------------------------------
  insert into public.blocks (user_id, name) values (uid, 'Schulter-Warmup') returning id into blk_warmup;
  insert into public.blocks (user_id, name) values (uid, 'Brust-Cooldown')  returning id into blk_cooldown;

  insert into public.block_tags (block_id, tag_id) values
    (blk_warmup, tag_warmup), (blk_cooldown, tag_cooldown);

  insert into public.block_exercises (block_id, exercise_id, position, target_sets, target_seconds) values
    (blk_warmup,   ex_armkreisen, 0, 1, 120),
    (blk_cooldown, ex_stretch,    0, 1, 60);

  -- Workout: Warmup-Block, drei Hauptuebungen, Cooldown-Block ---------
  insert into public.workouts (user_id, name) values (uid, 'Push Day') returning id into wo_push;

  insert into public.workout_items (workout_id, position, block_id, exercise_id, target_sets, target_reps, target_weight, target_seconds) values
    (wo_push, 0, blk_warmup,   null,         null, null, null,  null),
    (wo_push, 1, null,         ex_bank,      3,    10,   42.5,  null),
    (wo_push, 2, null,         ex_schulter,  3,    12,   20,    null),
    (wo_push, 3, null,         ex_plank,     3,    null, null,  45),
    (wo_push, 4, blk_cooldown, null,         null, null, null,  null);

  -- Plan: laeuft an jedem Wochentag, damit "Heute" immer etwas zeigt ---
  insert into public.plans (user_id, name, repeat_mode) values (uid, 'Gym Plan', 'weekly')
  returning id into pl_gym;

  insert into public.plan_days (plan_id, weekday, workout_id)
  select pl_gym, generate_series(1, 7), wo_push;

  raise notice 'Demo-Daten angelegt fuer %', uid;
end $$;
