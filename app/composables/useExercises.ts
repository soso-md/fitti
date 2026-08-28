import type { Exercise } from '~/types/fitti'

export const MUSKELGRUPPEN = [
  'Brust', 'Rücken', 'Beine', 'Gesäß', 'Schulter', 'Arme',
  'Bizeps', 'Trizeps', 'Rumpf', 'Waden', 'Sprunggelenk',
]

export const LEVELS = [
  { wert: 'anfaenger', label: 'Anfänger' },
  { wert: 'fortgeschritten', label: 'Fortgeschritten' },
] as const

export function useExercises() {
  const supabase = useSupabaseClient()

  const FELDER = 'id, name, muscle_groups, level, image_url, video_links, instructions, is_timed'

  /** Geloeschte Uebungen bleiben in der DB, aber aus der Bibliothek raus. */
  async function list() {
    const { data, error } = await supabase
      .from('exercises').select(FELDER).is('deleted_at', null).order('name')
    if (error) throw error
    return (data ?? []) as unknown as Exercise[]
  }

  async function get(id: string) {
    const { data, error } = await supabase
      .from('exercises').select(FELDER).eq('id', id).single()
    if (error) throw error
    return data as unknown as Exercise
  }

  async function create(werte: Partial<Exercise>) {
    const { data, error } = await supabase
      .from('exercises').insert(werte as any).select('id').single()
    if (error) throw error
    return data.id as string
  }

  async function update(id: string, werte: Partial<Exercise>) {
    const { error } = await supabase
      .from('exercises')
      .update({ ...werte, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (error) throw error
  }

  /** Soft-Delete: die Uebung verschwindet, alte Protokolle bleiben lesbar. */
  async function archive(id: string) {
    const { error } = await supabase
      .from('exercises').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }

  /** Das zuletzt geloggte Ergebnis, fuer die "Letztes Mal"-Referenz. */
  async function letztesErgebnis(exerciseId: string) {
    const { data } = await supabase
      .from('session_items')
      .select('id, sessions!inner(started_at, finished_at), session_sets(reps, weight, duration_seconds, done_at)')
      .eq('exercise_id', exerciseId)
      .not('sessions.finished_at', 'is', null)
      .order('started_at', { referencedTable: 'sessions', ascending: false })
      .limit(5)

    for (const item of (data ?? []) as any[]) {
      const saetze = (item.session_sets ?? []).filter((s: any) => s.done_at)
      if (!saetze.length) continue
      const schwerster = saetze.reduce(
        (a: any, b: any) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a), saetze[0])
      return {
        text: schwerster.weight
          ? `${saetze.length}×${schwerster.reps ?? '–'} @ ${schwerster.weight} kg`
          : `${saetze.length}×${schwerster.reps ?? schwerster.duration_seconds + 's'}`,
        datum: item.sessions.started_at as string,
      }
    }
    return null
  }

  return { list, get, create, update, archive, letztesErgebnis }
}
