/** Block-Etiketten. Warmup/Cooldown/Reha sind gesetzt, eigene kommen dazu. */
export const STANDARD_TAGS = ['Warmup', 'Cooldown', 'Reha', 'Mobility']

export function useTags() {
  const supabase = useSupabaseClient()

  async function list() {
    const { data } = await supabase.from('tags').select('id, name').order('name')
    return data ?? []
  }

  /** Legt den Tag an, falls es ihn noch nicht gibt, und gibt die ID zurueck. */
  async function ensure(name: string) {
    const sauber = name.trim()
    const { data: vorhanden } = await supabase
      .from('tags').select('id').eq('name', sauber).maybeSingle()
    if (vorhanden) return vorhanden.id as string

    const { data, error } = await supabase
      .from('tags').insert({ name: sauber }).select('id').single()
    if (error) throw error
    return data.id as string
  }

  return { list, ensure }
}
