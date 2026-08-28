export interface BlockRow {
  id: string
  name: string
  tags: string[]
  uebungen: { id: string, exercise_id: string, name: string, position: number,
    target_sets: number | null, target_reps: number | null, target_seconds: number | null }[]
}

export function useBlocks() {
  const supabase = useSupabaseClient()
  const { ensure } = useTags()

  async function list(): Promise<BlockRow[]> {
    const { data, error } = await supabase
      .from('blocks')
      .select(`
        id, name,
        block_tags ( tags ( name ) ),
        block_exercises ( id, exercise_id, position, target_sets, target_reps, target_seconds,
                          exercises ( name ) )
      `)
      .is('deleted_at', null)
      .order('name')
    if (error) throw error

    return ((data ?? []) as any[]).map(b => ({
      id: b.id,
      name: b.name,
      tags: (b.block_tags ?? []).map((t: any) => t.tags?.name).filter(Boolean),
      uebungen: (b.block_exercises ?? [])
        .sort((x: any, y: any) => x.position - y.position)
        .map((e: any) => ({
          id: e.id, exercise_id: e.exercise_id, name: e.exercises?.name ?? '?',
          position: e.position, target_sets: e.target_sets,
          target_reps: e.target_reps, target_seconds: e.target_seconds,
        })),
    }))
  }

  async function get(id: string) {
    return (await list()).find(b => b.id === id) ?? null
  }

  /**
   * Legt an oder aktualisiert. Uebungen und Tags werden ersetzt statt
   * gemergt -- der Editor schickt immer den vollstaendigen Stand.
   */
  async function save(werte: {
    id?: string
    name: string
    tags: string[]
    uebungen: { exercise_id: string, target_sets: number | null,
      target_reps: number | null, target_seconds: number | null }[]
  }) {
    let id = werte.id
    if (id) {
      const { error } = await supabase
        .from('blocks')
        .update({ name: werte.name, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await supabase.from('block_exercises').delete().eq('block_id', id)
      await supabase.from('block_tags').delete().eq('block_id', id)
    }
    else {
      const { data, error } = await supabase
        .from('blocks').insert({ name: werte.name }).select('id').single()
      if (error) throw error
      id = data.id as string
    }

    const tagIds = await Promise.all(werte.tags.map(t => ensure(t)))
    if (tagIds.length) {
      const { error } = await supabase
        .from('block_tags').insert(tagIds.map(tag_id => ({ block_id: id, tag_id })))
      if (error) throw error
    }

    if (werte.uebungen.length) {
      const { error } = await supabase.from('block_exercises').insert(
        werte.uebungen.map((u, i) => ({ ...u, block_id: id, position: i })),
      )
      if (error) throw error
    }

    return id
  }

  async function archive(id: string) {
    await supabase.from('blocks')
      .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  }

  return { list, get, save, archive }
}
