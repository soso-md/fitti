<script setup lang="ts">
useHead({ title: 'Statistiken — Fitti' })

const { aktivitaet, diesenMonat, wochenvolumen } = useStats()
const { list: freieListe } = useFreeform()

const zellen = ref<{ datum: string, anzahl: number }[]>([])
const monat = ref(0)
const wochen = ref<number[]>([])
const frei = ref<any[]>([])
const pending = ref(true)

onMounted(async () => {
  ;[zellen.value, monat.value, wochen.value, frei.value] = await Promise.all([
    aktivitaet(), diesenMonat(), wochenvolumen(), freieListe(5),
  ])
  pending.value = false
})

/** Intensitaetsstufen der Lavender-Skala. */
function farbe(anzahl: number) {
  if (anzahl >= 3) return 'bg-lavender-700'
  if (anzahl === 2) return 'bg-lavender-500'
  if (anzahl === 1) return 'bg-lavender-200'
  return 'bg-lavender-100'
}

const maxWoche = computed(() => Math.max(1, ...wochen.value))

function datum(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(new Date(iso))
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Statistiken</h1>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <div v-else class="mt-3.5 flex flex-col gap-4">
      <UiCard>
        <p class="text-sm">
          <b>{{ monat }}</b> {{ monat === 1 ? 'Training' : 'Trainings' }} diesen Monat
        </p>
      </UiCard>

      <div>
        <h2 class="mb-2 font-sans text-base font-semibold">Aktivität (letzte 12 Wochen)</h2>
        <!-- Spaltenweise gefuellt: eine Spalte ist eine Woche, Mo oben. -->
        <div
          class="bg-card rounded-md shadow-card grid h-28 grid-flow-col grid-cols-12 grid-rows-7 gap-[3px] p-2"
        >
          <div
            v-for="z in zellen"
            :key="z.datum"
            class="rounded-[2px]"
            :class="farbe(z.anzahl)"
            :title="`${z.datum}: ${z.anzahl}`"
          />
        </div>
      </div>

      <div>
        <h2 class="mb-2 font-sans text-base font-semibold">Trainings pro Woche</h2>
        <div
          class="bg-card rounded-md shadow-card flex h-24 items-end gap-2 p-2.5"
        >
          <div
            v-for="(w, i) in wochen"
            :key="i"
            class="bg-highlight flex-1 rounded"
            :style="{ height: `${Math.max(4, (w / maxWoche) * 100)}%` }"
            :title="`${w} Trainings`"
          />
        </div>
        <p class="text-muted mt-1 text-xs">Älteste Woche links, diese Woche rechts.</p>
      </div>

      <div>
        <h2 class="mb-2 font-sans text-base font-semibold">Freie Trainings</h2>
        <div v-if="frei.length" class="flex flex-col gap-2">
          <UiCard v-for="f in frei" :key="f.id">
            <div class="text-sm">
              <b>{{ f.sport }}</b>
              <template v-if="f.duration_minutes"> · {{ f.duration_minutes }} min</template>
              <template v-if="f.metric_value"> · {{ f.metric_value }} {{ f.metric_label }}</template>
              · {{ datum(f.performed_at) }}
            </div>
            <p v-if="f.note" class="text-ink-soft mt-1 text-xs">{{ f.note }}</p>
          </UiCard>
        </div>
        <UiCard v-else>
          <p class="text-ink-soft text-sm">Noch nichts geloggt.</p>
        </UiCard>
      </div>
    </div>

    <AppBottomNav />
  </main>
</template>
