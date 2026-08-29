/**
 * Das Kennzahl-Feld ist generisch: je Sportart passt sich das Label an,
 * damit "12" bei Schwimmen als Bahnen und bei Rad als Kilometer gelesen
 * werden kann. Was womit gemessen wird, steht seit der Bibliothek in der
 * Tabelle `sports` -- siehe useSports().
 */
export function useFreeform() {
  const supabase = useSupabaseClient()

  async function list(limit = 20) {
    const { data, error } = await supabase
      .from('freeform_logs')
      .select('id, sport, performed_at, duration_minutes, metric_label, metric_value, intensity, note')
      .order('performed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  }

  async function create(werte: {
    sport: string
    duration_minutes: number | null
    metric_label: string | null
    metric_value: number | null
    metric_type: string | null
    intensity: number | null
    note: string | null
  }) {
    const { error } = await supabase.from('freeform_logs').insert(werte)
    if (error) throw error
  }

  return { list, eigeneSportarten, create }
}
