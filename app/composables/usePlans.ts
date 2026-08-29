export const WOCHENTAGE = [
  { iso: 1, kurz: 'Mo' }, { iso: 2, kurz: 'Di' }, { iso: 3, kurz: 'Mi' },
  { iso: 4, kurz: 'Do' }, { iso: 5, kurz: 'Fr' }, { iso: 6, kurz: 'Sa' },
  { iso: 7, kurz: 'So' },
]

export interface PlanRow {
  id: string
  name: string
  repeat_mode: 'weekly' | 'period'
  starts_on: string | null
  ends_on: string | null
  on_expiry: 'extend' | 'archive' | 'manual' | null
  archived_at: string | null
  tage: { weekday: number, workout_id: string | null, workout_name: string | null }[]
}

export function usePlans() {
  const supabase = useSupabaseClient()

  async function list(mitArchiv = false): Promise<PlanRow[]> {
    let q = supabase
      .from('plans')
      .select(`
        id, name, repeat_mode, starts_on, ends_on, on_expiry, archived_at,
        plan_days ( weekday, workout_id, workouts ( name ) )
      `)
      .order('name')
    if (!mitArchiv) q = q.is('archived_at', null)

    const { data, error } = await q
    if (error) throw error

    return ((data ?? []) as any[]).map(p => ({
      ...p,
      tage: (p.plan_days ?? [])
        .map((d: any) => ({
          weekday: d.weekday, workout_id: d.workout_id,
          workout_name: d.workouts?.name ?? null,
        }))
        .sort((a: any, b: any) => a.weekday - b.weekday),
    }))
  }

  async function get(id: string) {
    return (await list(true)).find(p => p.id === id) ?? null
  }

  async function save(werte: {
    id?: string
    name: string
    repeat_mode: 'weekly' | 'period'
    starts_on: string | null
    ends_on: string | null
    on_expiry: string | null
    tage: { weekday: number, workout_id: string | null }[]
  }) {
    const stamm = {
      name: werte.name,
      repeat_mode: werte.repeat_mode,
      starts_on: werte.starts_on,
      // Ein Wochenplan laeuft unbefristet -- Enddatum und Nachlaufregel
      // muessen leer sein, sonst greift der Check in der DB.
      ends_on: werte.repeat_mode === 'period' ? werte.ends_on : null,
      on_expiry: werte.repeat_mode === 'period' ? werte.on_expiry : null,
    }

    let id = werte.id
    if (id) {
      const { error } = await supabase
        .from('plans')
        .update({ ...stamm, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await supabase.from('plan_days').delete().eq('plan_id', id)
    }
    else {
      const { data, error } = await supabase
        .from('plans').insert(stamm).select('id').single()
      if (error) throw error
      id = data.id as string
    }

    if (werte.tage.length) {
      const { error } = await supabase
        .from('plan_days')
        .insert(werte.tage.map(t => ({ ...t, plan_id: id })))
      if (error) throw error
    }
    return id
  }

  async function archive(id: string, archivieren = true) {
    await supabase
      .from('plans')
      .update({ archived_at: archivieren ? new Date().toISOString() : null })
      .eq('id', id)
  }

  return { list, get, save, archive }
}
