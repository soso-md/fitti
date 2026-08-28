<script setup lang="ts">
import type { WorkoutRow } from '~/composables/useWorkouts'

const route = useRoute()
const { get } = useWorkouts()

const workout = ref<WorkoutRow | null>(null)
const pending = ref(true)

useHead({ title: () => `${workout.value?.name ?? 'Workout'} — Fitti` })

onMounted(async () => {
  workout.value = await get(route.params.id as string)
  pending.value = false
})
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/plan" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="mb-4 text-xl">Workout bearbeiten</h1>
    <WorkoutForm v-if="!pending && workout" :workout="workout" @gespeichert="navigateTo('/plan')" />
    <p v-else-if="!pending" class="text-muted text-sm">Dieses Workout gibt es nicht.</p>
  </main>
</template>
