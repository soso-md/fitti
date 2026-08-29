<script setup lang="ts">
import type { WorkoutRow } from '~/composables/useWorkouts'

const route = useRoute()
const id = route.params.id as string
const { get } = useWorkouts()
const { startFromWorkout } = useSession()

const workout = ref<WorkoutRow | null>(null)
const pending = ref(true)
const starting = ref(false)
const fehler = ref<string | null>(null)

useHead({ title: () => `${workout.value?.name ?? 'Workout'} — Fitti` })

onMounted(async () => {
  workout.value = await get(id)
  pending.value = false
})

/**
 * Startet das Workout ausserhalb des Plans -- ohne plan_id, weil es hier
 * nicht an einem Plantag haengt. Damit laesst sich Plan B auch samstags
 * trainieren, ohne den Plan anzufassen.
 */
async function starten() {
  starting.value = true
  fehler.value = null
  try {
    const sessionId = await startFromWorkout(id)
    await navigateTo(`/session/${sessionId}`)
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Das Training konnte nicht starten.'
    starting.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/workouts" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>

    <template v-if="!pending && workout">
      <h1 class="text-xl">{{ workout.name }}</h1>
      <p class="text-ink-soft mt-1 text-sm">
        {{ workout.items.map(i => i.label).join(' · ') || 'noch leer' }}
      </p>

      <p v-if="fehler" class="text-coral-600 mt-3 text-sm">{{ fehler }}</p>

      <UiButton
        v-if="workout.items.length"
        size="lg"
        class="mt-4 w-full"
        :disabled="starting"
        @click="starten"
      >
        {{ starting ? 'Startet …' : '▶ Training starten' }}
      </UiButton>

      <h2 class="mt-8 mb-3 font-sans text-base font-semibold">Bearbeiten</h2>
    </template>

    <WorkoutForm v-if="!pending && workout" :workout="workout" @gespeichert="navigateTo('/workouts')" />
    <p v-else-if="!pending" class="text-muted text-sm">Dieses Workout gibt es nicht.</p>
  </main>
</template>
