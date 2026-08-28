/**
 * Das Kennzahl-Feld ist generisch: je Sportart passt sich das Label an,
 * damit "12" bei Schwimmen als Bahnen und bei Rad als Kilometer gelesen
 * werden kann. metric_type haelt fest, wie zu interpretieren ist.
 */
export const SPORTARTEN = ['Volleyball', 'Schwimmen', 'Wandern', 'Radfahren']

export const KENNZAHL: Record<string, { label: string, type: string, hint: string }> = {
  Schwimmen: { label: 'Bahnen (à 25 m)', type: 'distance_time', hint: 'z. B. 12' },
  Radfahren: { label: 'Distanz (km)', type: 'distance_time', hint: 'z. B. 24' },
  Wandern: { label: 'Distanz (km)', type: 'distance_time', hint: 'z. B. 8' },
}

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

  /** Bisher genutzte eigene Sportarten, damit sie als Chips wiederkommen. */
  async function eigeneSportarten() {
    const { data } = await supabase.from('freeform_logs').select('sport').limit(200)
    const alle = [...new Set((data ?? []).map((r: any) => r.sport))]
    return alle.filter(s => !SPORTARTEN.includes(s))
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
