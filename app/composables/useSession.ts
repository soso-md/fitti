import type { SessionItem } from '~/types/fitti'

/**
 * Eine Session ist der eingefrorene Ablauf eines Workouts. Beim Start
 * werden Bloecke zu einzelnen Items aufgeloest -- danach ist die Liste
 * unabhaengig vom Plan und darf umsortiert, uebersprungen und ergaenzt
 * werden, ohne dass das auf den Plan zurueckschlaegt.
 */
export function useSession() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * Legt eine Session an und materialisiert die Item-Liste aus dem Workout.
   * Gibt die neue Session-ID zurueck.
   */
  async function startFromWorkout(workoutId: string, planId?: string) {
    if (!user.value) throw new Error('Nicht angemeldet')

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .select(`
        id, name,
        workout_items (
          position, block_id, exercise_id,
          target_sets, target_reps, target_seconds, target_weight,
          blocks (
            name,
            block_tags ( tags ( name ) ),
            block_exercises (
              position, exercise_id,
              target_sets, target_reps, target_seconds, target_weight
            )
          )
        )
      `)
      .eq('id', workoutId)
      .single()

    if (wErr || !workout) throw wErr ?? new Error('Workout nicht gefunden')

    const { data: session, error: sErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.value.id,
        workout_id: workoutId,
        plan_id: planId ?? null,
        title: (workout as any).name,
      })
      .select('id')
      .single()

    if (sErr || !session) throw sErr ?? new Error('Session konnte nicht starten')

    // Bloecke aufloesen: ein Block wird zu je einem Item pro Uebung.
    const items: any[] = []
    let pos = 0

    const sorted = [...((workout as any).workout_items ?? [])]
      .sort((a, b) => a.position - b.position)

    for (const wi of sorted) {
      if (wi.block_id && wi.blocks) {
        // Der erste Tag des Blocks wird zum Label ("Warmup", "Reha").
        const label = wi.blocks.block_tags?.[0]?.tags?.name ?? wi.blocks.name
        const bes = [...(wi.blocks.block_exercises ?? [])].sort((a, b) => a.position - b.position)
        for (const be of bes) {
          items.push({
            session_id: session.id,
            exercise_id: be.exercise_id,
            position: pos++,
            source: 'block',
            source_label: label,
          })
        }
      }
      else if (wi.exercise_id) {
        items.push({
          session_id: session.id,
          exercise_id: wi.exercise_id,
          position: pos++,
          source: 'main',
          source_label: 'Übung',
        })
      }
    }

    if (items.length) {
      const { error } = await supabase.from('session_items').insert(items)
      if (error) throw error
    }

    return session.id as string
  }

  /** Laedt Session samt Items, Uebungen und bereits erfassten Saetzen. */
  async function load(sessionId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, workout_id, plan_id, title, started_at, finished_at,
        session_items (
          id, session_id, exercise_id, position, source, source_label, skipped, note,
          exercises ( id, name, muscle_groups, level, image_url, video_links, instructions, is_timed ),
          session_sets ( id, session_item_id, position, reps, weight, duration_seconds, done_at )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) throw error

    const items: SessionItem[] = ((data as any).session_items ?? [])
      .map((it: any) => ({
        ...it,
        exercise: it.exercises,
        sets: [...(it.session_sets ?? [])].sort((a: any, b: any) => a.position - b.position),
      }))
      .sort((a: SessionItem, b: SessionItem) => a.position - b.position)

    return { session: data as any, items }
  }

  /**
   * Schreibt eine neue Reihenfolge. Die Positionen gehen erst auf einen
   * negativen Zwischenstand, weil (session_id, position) eindeutig ist --
   * sonst kollidiert das Update mit sich selbst.
   */
  async function reorder(items: SessionItem[]) {
    const staged = items.map((it, i) => ({ id: it.id, position: -(i + 1) }))
    for (const s of staged) {
      await supabase.from('session_items').update({ position: s.position }).eq('id', s.id)
    }
    for (let i = 0; i < items.length; i++) {
      await supabase.from('session_items').update({ position: i }).eq('id', items[i]!.id)
    }
  }

  async function setSkipped(itemId: string, skipped: boolean) {
    await supabase.from('session_items').update({ skipped }).eq('id', itemId)
  }

  async function saveNote(itemId: string, note: string) {
    await supabase.from('session_items').update({ note }).eq('id', itemId)
  }

  /** Fuegt eine Uebung nur fuer heute hinzu -- der Plan bleibt unberuehrt. */
  async function addAdhoc(sessionId: string, exerciseId: string, position: number) {
    const { data, error } = await supabase
      .from('session_items')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        position,
        source: 'adhoc',
        source_label: 'Nur heute',
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function addSet(itemId: string, position: number, reps: number | null, weight: number | null) {
    const { data, error } = await supabase
      .from('session_sets')
      .insert({ session_item_id: itemId, position, reps, weight })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function completeSet(setId: string, reps: number | null, weight: number | null) {
    await supabase
      .from('session_sets')
      .update({ reps, weight, done_at: new Date().toISOString() })
      .eq('id', setId)
  }

  async function finish(sessionId: string) {
    await supabase
      .from('sessions')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', sessionId)
  }

  return {
    startFromWorkout, load, reorder, setSkipped, saveNote,
    addAdhoc, addSet, completeSet, finish,
  }
}
