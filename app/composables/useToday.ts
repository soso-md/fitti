import type { PlannedWorkout } from '~/types/fitti'

/**
 * Was heute ansteht: alle aktiven Plaene, die den heutigen Wochentag
 * belegen. Ein Zeitraum-Plan zaehlt nur innerhalb seines Fensters.
 */
export function useToday() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  /** ISO-Wochentag wie in der DB: 1 = Montag ... 7 = Sonntag. */
  const isoWeekday = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay())

  const planned = ref<PlannedWorkout[]>([])
  const recent = ref<{ id: string, title: string, meta: string, tone: string }[]>([])
  const doneThisWeek = ref(0)
  const pending = ref(true)

  async function load() {
    if (!user.value) return
    pending.value = true

    const today = new Date()
    const iso = today.toISOString().slice(0, 10)

    const { data: days } = await supabase
      .from('plan_days')
      .select('workout_id, workouts(name), plans(id, name, repeat_mode, starts_on, ends_on, archived_at)')
      .eq('weekday', isoWeekday(today))

    planned.value = (days ?? [])
      .filter((d: any) => {
        const p = d.plans
        if (!p || p.archived_at) return false
        // Wochenplaene laufen unbefristet, Zeitraum-Plaene nur im Fenster.
        if (p.repeat_mode === 'weekly') return true
        return (!p.starts_on || p.starts_on <= iso) && (!p.ends_on || p.ends_on >= iso)
      })
      .map((d: any) => ({
        workout_id: d.workout_id,
        workout_name: d.workouts?.name ?? 'Trainingstag',
        plan_id: d.plans.id,
        plan_name: d.plans.name,
        // Ohne Workout laesst sich nichts starten -- die Karte zeigt den
        // Tag trotzdem an, damit er nicht stillschweigend verschwindet.
        meta: d.workout_id ? d.plans.name : `${d.plans.name} · noch kein Workout`,
      }))

    // Montag dieser Woche als Startpunkt der Wochenzaehlung.
    const monday = new Date(today)
    monday.setDate(today.getDate() - (isoWeekday(today) - 1))
    monday.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .not('finished_at', 'is', null)
      .gte('started_at', monday.toISOString())

    doneThisWeek.value = count ?? 0

    const { data: last } = await supabase
      .from('sessions')
      .select('id, title, started_at, finished_at')
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(3)

    recent.value = (last ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      meta: formatDuration(s.started_at, s.finished_at),
      tone: 'neutral',
    }))

    pending.value = false
  }

  function formatDuration(start: string, end: string) {
    const min = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    return `${min} min`
  }

  watchEffect(() => {
    if (user.value) load()
  })

  return { planned, recent, doneThisWeek, pending, load }
}
