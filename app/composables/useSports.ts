export interface Sport {
  id: string
  name: string
  metric_label: string | null
  metric_type: string | null
  position: number
  archived_at: string | null
}

export const METRIK_TYPEN = [
  { wert: 'duration', label: 'Nur Dauer' },
  { wert: 'distance_time', label: 'Distanz / Menge' },
  { wert: 'custom', label: 'Eigene Kennzahl' },
]

export function useSports() {
  const supabase = useSupabaseClient()

  const FELDER = 'id, name, metric_label, metric_type, position, archived_at'

  async function list(mitArchiv = false) {
    let q = supabase.from('sports').select(FELDER).order('position').order('name')
    if (!mitArchiv) q = q.is('archived_at', null)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as unknown as Sport[]
  }

  async function save(werte: Partial<Sport> & { name: string }) {
    if (werte.id) {
      const { error } = await supabase
        .from('sports')
        .update({
          name: werte.name,
          metric_label: werte.metric_label || null,
          metric_type: werte.metric_type || null,
          position: werte.position ?? 0,
        })
        .eq('id', werte.id)
      if (error) throw error
      return werte.id
    }
    const { data, error } = await supabase
      .from('sports')
      .insert({
        name: werte.name,
        metric_label: werte.metric_label || null,
        metric_type: werte.metric_type || 'custom',
        position: werte.position ?? 10,
      })
      .select('id').single()
    if (error) throw error
    return data.id as string
  }

  /** Archivieren statt loeschen -- alte Logs nennen die Sportart weiter. */
  async function archive(id: string, archivieren = true) {
    const { error } = await supabase
      .from('sports')
      .update({ archived_at: archivieren ? new Date().toISOString() : null })
      .eq('id', id)
    if (error) throw error
  }

  return { list, save, archive }
}
