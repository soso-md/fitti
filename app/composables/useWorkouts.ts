export interface WorkoutItemRow {
  position: number
  block_id: string | null
  exercise_id: string | null
  label: string
  target_sets: number | null
  target_reps: number | null
  target_seconds: number | null
  target_weight: number | null
}

export interface WorkoutRow {
  id: string
  name: string
  items: WorkoutItemRow[]
}

export function useWorkouts() {
  const supabase = useSupabaseClient()

  async function list(): Promise<WorkoutRow[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id, name,
        workout_items ( position, block_id, exercise_id,
                        target_sets, target_reps, target_seconds, target_weight,
                        blocks ( name ), exercises ( name ) )
      `)
      .is('deleted_at', null)
      .order('name')
    if (error) throw error

    return ((data ?? []) as any[]).map(w => ({
      id: w.id,
      name: w.name,
      items: (w.workout_items ?? [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((i: any) => ({
          position: i.position,
          block_id: i.block_id,
          exercise_id: i.exercise_id,
          label: i.blocks?.name ?? i.exercises?.name ?? '?',
          target_sets: i.target_sets,
          target_reps: i.target_reps,
          target_seconds: i.target_seconds,
          target_weight: i.target_weight,
        })),
    }))
  }

  async function get(id: string) {
    return (await list()).find(w => w.id === id) ?? null
  }

  async function save(werte: {
    id?: string
    name: string
    items: { block_id: string | null, exercise_id: string | null,
      target_sets: number | null, target_reps: number | null,
      target_seconds: number | null, target_weight: number | null }[]
  }) {
    let id = werte.id
    if (id) {
      const { error } = await supabase
        .from('workouts')
        .update({ name: werte.name, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await supabase.from('workout_items').delete().eq('workout_id', id)
    }
    else {
      const { data, error } = await supabase
        .from('workouts').insert({ name: werte.name }).select('id').single()
      if (error) throw error
      id = data.id as string
    }

    if (werte.items.length) {
      const { error } = await supabase.from('workout_items').insert(
        werte.items.map((it, i) => ({ ...it, workout_id: id, position: i })),
      )
      if (error) throw error
    }
    return id
  }

  return { list, get, save }
}
