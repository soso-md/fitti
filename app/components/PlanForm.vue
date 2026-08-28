<script setup lang="ts">
import type { PlanRow } from '~/composables/usePlans'
import { WOCHENTAGE } from '~/composables/usePlans'
import type { WorkoutRow } from '~/composables/useWorkouts'

const props = defineProps<{ plan?: PlanRow | null }>()
const emit = defineEmits<{ gespeichert: [] }>()

const { save, archive } = usePlans()
const { list: workoutList } = useWorkouts()

const name = ref(props.plan?.name ?? '')
const modus = ref<'weekly' | 'period'>(props.plan?.repeat_mode ?? 'weekly')
const bis = ref(props.plan?.ends_on ?? '')
const nachAblauf = ref(props.plan?.on_expiry ?? 'manual')

/** weekday -> workout_id. Ein Tag traegt genau ein Workout dieses Plans. */
const tage = ref<Record<number, string>>(
  Object.fromEntries((props.plan?.tage ?? []).map(t => [t.weekday, t.workout_id])),
)

const workouts = ref<WorkoutRow[]>([])
const pickerTag = ref<number | null>(null)
const pending = ref(false)
const fehler = ref<string | null>(null)

onMounted(async () => {
  workouts.value = await workoutList()
})

const gewaehlteTage = computed(() =>
  WOCHENTAGE.filter(t => t.iso in tage.value),
)

function toggleTag(iso: number) {
  if (iso in tage.value) {
    const kopie = { ...tage.value }
    delete kopie[iso]
    tage.value = kopie
  }
  else {
    tage.value = { ...tage.value, [iso]: '' }
  }
}

const workoutName = (id: string) => workouts.value.find(w => w.id === id)?.name

const ABLAUF = [
  { wert: 'extend', label: 'Verlängern' },
  { wert: 'archive', label: 'Archivieren' },
  { wert: 'manual', label: 'Manuell' },
]

async function speichern() {
  if (!name.value.trim()) {
    fehler.value = 'Der Plan braucht einen Namen.'
    return
  }
  const ohneWorkout = gewaehlteTage.value.filter(t => !tage.value[t.iso])
  if (ohneWorkout.length) {
    fehler.value = `Ohne Workout: ${ohneWorkout.map(t => t.kurz).join(', ')}.`
    return
  }
  if (modus.value === 'period' && !bis.value) {
    fehler.value = 'Ein Zeitraum-Plan braucht ein Enddatum.'
    return
  }

  pending.value = true
  fehler.value = null
  try {
    await save({
      id: props.plan?.id,
      name: name.value.trim(),
      repeat_mode: modus.value,
      starts_on: props.plan?.starts_on ?? new Date().toISOString().slice(0, 10),
      ends_on: bis.value || null,
      on_expiry: nachAblauf.value,
      tage: gewaehlteTage.value.map(t => ({ weekday: t.iso, workout_id: tage.value[t.iso]! })),
    })
    emit('gespeichert')
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Speichern hat nicht geklappt.'
    pending.value = false
  }
}

async function archivieren() {
  if (!props.plan) return
  await archive(props.plan.id, !props.plan.archived_at)
  emit('gespeichert')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiInput v-model="name" label="Name" placeholder="z. B. Kraft, Joggen, Yoga" />

    <div>
      <h2 class="mb-2 font-sans text-base font-semibold">Tage wählen</h2>
      <div class="flex gap-1.5">
        <button
          v-for="t in WOCHENTAGE"
          :key="t.iso"
          type="button"
          class="rounded-md shadow-card press flex-1 py-2.5 text-center text-sm"
          :class="t.iso in tage ? 'bg-lavender-300' : 'bg-card'"
          @click="toggleTag(t.iso)"
        >
          {{ t.kurz }}
        </button>
      </div>
    </div>

    <div>
      <h2 class="mb-2 font-sans text-base font-semibold">Workout pro Tag</h2>
      <div class="flex flex-col gap-2">
        <button
          v-for="t in gewaehlteTage"
          :key="t.iso"
          type="button"
          class="bg-card rounded-md shadow-card flex items-center gap-2.5 px-3.5 py-3 text-left"
          @click="pickerTag = t.iso"
        >
          <b class="w-6 shrink-0">{{ t.kurz }}</b>
          <span class="flex-1 truncate" :class="!tage[t.iso] && 'text-muted'">
            {{ tage[t.iso] ? workoutName(tage[t.iso]!) : 'Workout wählen …' }}
          </span>
          <span class="text-muted shrink-0" aria-hidden="true">›</span>
        </button>
        <p v-if="!gewaehlteTage.length" class="text-muted text-xs">
          Erst Tage oben wählen.
        </p>
      </div>
    </div>

    <div>
      <h2 class="mb-2 font-sans text-base font-semibold">Wiederholung</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-md shadow-card press flex-1 py-2.5 text-sm"
          :class="modus === 'weekly' ? 'bg-lavender-300' : 'bg-card'"
          @click="modus = 'weekly'"
        >
          Fix, jede Woche
        </button>
        <button
          type="button"
          class="rounded-md shadow-card press flex-1 py-2.5 text-sm"
          :class="modus === 'period' ? 'bg-lavender-300' : 'bg-card'"
          @click="modus = 'period'"
        >
          Zeitraum
        </button>
      </div>

      <div v-if="modus === 'period'" class="mt-3">
        <UiInput v-model="bis" label="Läuft bis" type="date" />
        <div class="text-ink-soft mt-2.5 mb-1.5 text-sm">Nach Ablauf</div>
        <div class="flex gap-1.5">
          <button
            v-for="o in ABLAUF"
            :key="o.wert"
            type="button"
            class="rounded-sm shadow-card press flex-1 px-1 py-2 text-[11px]"
            :class="nachAblauf === o.wert ? 'bg-lavender-100' : 'bg-card'"
            @click="nachAblauf = o.wert"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

    <div class="flex flex-col gap-2">
      <UiButton size="lg" :disabled="pending" @click="speichern">
        {{ pending ? 'Speichert …' : 'Speichern' }}
      </UiButton>
      <UiButton v-if="plan" variant="ghost" @click="archivieren">
        {{ plan.archived_at ? 'Wieder aktivieren' : 'Plan archivieren' }}
      </UiButton>
    </div>

    <UiSheet
      :model-value="pickerTag !== null"
      :title="`Workout wählen`"
      @update:model-value="v => !v && (pickerTag = null)"
    >
      <div class="flex flex-col gap-2">
        <button
          v-for="w in workouts"
          :key="w.id"
          type="button"
          class="bg-card-warm rounded-md px-3.5 py-3 text-left"
          @click="tage = { ...tage, [pickerTag!]: w.id }; pickerTag = null"
        >
          <div class="font-semibold">{{ w.name }}</div>
          <div class="text-ink-soft text-xs">{{ w.items.length }} Einträge</div>
        </button>
        <p v-if="!workouts.length" class="text-muted py-2 text-sm">
          Noch kein Workout angelegt.
        </p>
        <UiButton variant="ghost" @click="navigateTo('/workouts/neu')">
          + Neues Workout erstellen
        </UiButton>
      </div>
    </UiSheet>
  </div>
</template>
