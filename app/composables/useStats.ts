export function useStats() {
  const supabase = useSupabaseClient()

  /** Tagesraster der letzten 12 Wochen, Montag als Wochenstart. */
  async function aktivitaet() {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const isodow = start.getDay() === 0 ? 7 : start.getDay()
    // Auf den Montag vor 11 Wochen zurueck, damit 12 volle Spalten stehen.
    start.setDate(start.getDate() - (isodow - 1) - 7 * 11)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at')
      .not('finished_at', 'is', null)
      .gte('started_at', start.toISOString())

    const { data: frei } = await supabase
      .from('freeform_logs')
      .select('performed_at')
      .gte('performed_at', start.toISOString())

    const proTag: Record<string, number> = {}
    for (const s of [...(sessions ?? []), ...(frei ?? [])] as any[]) {
      const key = new Date(s.started_at ?? s.performed_at).toISOString().slice(0, 10)
      proTag[key] = (proTag[key] ?? 0) + 1
    }

    // Spaltenweise: 12 Wochen a 7 Tage, wie das Aktivitaetsraster im Handoff.
    const zellen: { datum: string, anzahl: number }[] = []
    for (let i = 0; i < 84; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      zellen.push({ datum: key, anzahl: proTag[key] ?? 0 })
    }
    return zellen
  }

  async function diesenMonat() {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    const { count: a } = await supabase
      .from('sessions').select('id', { count: 'exact', head: true })
      .not('finished_at', 'is', null).gte('started_at', start.toISOString())
    const { count: b } = await supabase
      .from('freeform_logs').select('id', { count: 'exact', head: true })
      .gte('performed_at', start.toISOString())

    return (a ?? 0) + (b ?? 0)
  }

  /** Abgeschlossene Trainings je Woche, letzte vier Wochen. */
  async function wochenvolumen() {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const isodow = start.getDay() === 0 ? 7 : start.getDay()
    start.setDate(start.getDate() - (isodow - 1) - 7 * 3)

    const { data } = await supabase
      .from('sessions')
      .select('started_at')
      .not('finished_at', 'is', null)
      .gte('started_at', start.toISOString())

    const wochen = [0, 0, 0, 0]
    for (const s of (data ?? []) as any[]) {
      const diff = Math.floor(
        (new Date(s.started_at).getTime() - start.getTime()) / (7 * 86400000))
      if (diff >= 0 && diff < 4) wochen[diff]!++
    }
    return wochen
  }

  return { aktivitaet, diesenMonat, wochenvolumen }
}
