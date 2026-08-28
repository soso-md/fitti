<script setup lang="ts">
import type { PlanRow } from '~/composables/usePlans'
import { WOCHENTAGE } from '~/composables/usePlans'

useHead({ title: 'Trainingspläne — Fitti' })

const { list } = usePlans()
const plaene = ref<PlanRow[]>([])
const pending = ref(true)

onMounted(async () => {
  plaene.value = await list()
  pending.value = false
})

/** Alle Plaene in eine Woche gelegt -- mehrere Workouts pro Tag moeglich. */
const woche = computed(() => {
  const map: Record<number, string[]> = {}
  for (const p of plaene.value)
    for (const t of p.tage) (map[t.weekday] ??= []).push(t.workout_name)
  return map
})

function zeitraum(p: PlanRow) {
  if (p.repeat_mode === 'weekly') return 'Fix, jede Woche'
  const bis = p.ends_on ? new Date(p.ends_on).toLocaleDateString('de-DE') : '?'
  return `Zeitraum bis ${bis}`
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Trainingspläne</h1>
    <p class="text-ink-soft mt-1 text-sm">Alle Pläne kombiniert</p>

    <div class="my-4 flex gap-1.5">
      <div
        v-for="t in WOCHENTAGE"
        :key="t.iso"
        class="rounded-md shadow-card flex-1 px-0.5 py-2 text-center"
        :class="woche[t.iso] ? 'bg-lavender-100' : 'bg-card'"
      >
        <div class="text-[13px] font-semibold">{{ t.kurz }}</div>
        <div class="text-ink-soft mt-1 text-[9px] leading-tight">
          {{ (woche[t.iso] ?? ['–']).join(' + ') }}
        </div>
      </div>
    </div>

    <h2 class="mb-2 font-sans text-base font-semibold">Meine Pläne</h2>

    <p v-if="pending" class="text-muted text-sm">Einen Moment …</p>

    <UiCard v-else-if="!plaene.length">
      <p class="text-ink-soft text-sm">Noch kein Plan. Leg den ersten an.</p>
    </UiCard>

    <div v-else class="flex flex-col gap-2.5">
      <NuxtLink v-for="p in plaene" :key="p.id" :to="`/plan/${p.id}`">
        <UiCard>
          <div class="flex items-center justify-between gap-2">
            <b class="truncate">{{ p.name }}</b>
            <span class="text-muted shrink-0" aria-hidden="true">›</span>
          </div>
          <div class="text-ink-soft mt-0.5 text-[13px]">{{ zeitraum(p) }}</div>
          <div class="text-muted mt-1 text-xs">
            {{ p.tage.length ? p.tage.map(t => WOCHENTAGE[t.weekday - 1]!.kurz).join(', ') : 'keine Tage' }}
          </div>
        </UiCard>
      </NuxtLink>
    </div>

    <div class="mt-4 flex flex-col gap-2">
      <UiButton variant="secondary" @click="navigateTo('/plan/neu')">+ Neuer Plan</UiButton>
      <UiButton variant="ghost" @click="navigateTo('/workouts/neu')">
        + Neues Workout erstellen
      </UiButton>
      <UiButton variant="ghost" @click="navigateTo('/bloecke')">Blöcke verwalten</UiButton>
    </div>

    <AppBottomNav />
  </main>
</template>
