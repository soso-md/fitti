<script setup lang="ts">
import type { WorkoutRow } from '~/composables/useWorkouts'

useHead({ title: 'Workouts — Fitti' })

const { list } = useWorkouts()
const workouts = ref<WorkoutRow[]>([])
const pending = ref(true)

onMounted(async () => {
  workouts.value = await list()
  pending.value = false
})

/** Kurzfassung des Ablaufs fuer die Kachel. */
function ablauf(w: WorkoutRow) {
  return w.items.map(i => i.label).join(' · ') || 'noch leer'
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Bibliothek</h1>
    <div class="mt-3.5">
      <LibraryTabs />
    </div>
    <p class="text-ink-soft mt-4 text-sm">
      Der Ablauf eines Trainingstags. Pläne verweisen darauf.
    </p>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <UiCard v-else-if="!workouts.length" class="mt-4">
      <p class="text-ink-soft text-sm">Noch kein Workout.</p>
    </UiCard>

    <div v-else class="mt-4 flex flex-col gap-2">
      <NuxtLink
        v-for="w in workouts"
        :key="w.id"
        :to="`/workouts/${w.id}`"
        class="bg-card rounded-md shadow-card block px-3.5 py-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="truncate font-semibold">{{ w.name }}</span>
          <span class="text-muted shrink-0" aria-hidden="true">›</span>
        </div>
        <div class="text-ink-soft mt-1 text-xs">{{ ablauf(w) }}</div>
      </NuxtLink>
    </div>

    <UiButton class="mt-4" variant="secondary" @click="navigateTo('/workouts/neu')">
      + Neues Workout
    </UiButton>

    <AppBottomNav />
  </main>
</template>
