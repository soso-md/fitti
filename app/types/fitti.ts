/** Ein Eintrag der Session-Uebersicht bzw. des Players. */
export interface SessionItem {
  id: string
  session_id: string
  exercise_id: string
  position: number
  /** 'adhoc' = nur heute dazugenommen, steht nicht im Plan. */
  source: 'block' | 'main' | 'adhoc'
  /** Eingefroren beim Start: "Warmup", "Cooldown", "Reha", "Übung". */
  source_label: string | null
  skipped: boolean
  note: string | null
  exercise?: Exercise
  sets?: SessionSet[]
}

export interface SessionSet {
  id: string
  session_item_id: string
  position: number
  reps: number | null
  weight: number | null
  duration_seconds: number | null
  done_at: string | null
}

export interface Exercise {
  id: string
  name: string
  muscle_groups: string[]
  level: 'anfaenger' | 'fortgeschritten' | null
  image_url: string | null
  video_links: string[]
  instructions: string | null
  is_timed: boolean
}

export interface Session {
  id: string
  workout_id: string | null
  plan_id: string | null
  title: string
  started_at: string
  finished_at: string | null
}

/** Ein heute anstehendes Workout, angereichert um seine Herkunft. */
export interface PlannedWorkout {
  workout_id: string
  workout_name: string
  plan_id: string
  plan_name: string
  /** "Gym Plan · Warmup + 5 Übungen" */
  meta: string
}
