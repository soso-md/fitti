<script setup lang="ts">
import type { Exercise } from '~/types/fitti'

const route = useRoute()
const id = route.params.id as string
const { get } = useExercises()

const uebung = ref<Exercise | null>(null)
const pending = ref(true)

useHead({ title: 'Übung bearbeiten — Fitti' })

onMounted(async () => {
  uebung.value = await get(id)
  pending.value = false
})
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink :to="`/uebungen/${id}`" class="text-muted mb-2 block py-2 text-sm">
      ‹ Zurück
    </NuxtLink>
    <h1 class="mb-4 text-xl">Übung bearbeiten</h1>
    <ExerciseForm
      v-if="!pending && uebung"
      :exercise="uebung"
      @gespeichert="navigateTo(`/uebungen/${id}`)"
    />
  </main>
</template>
