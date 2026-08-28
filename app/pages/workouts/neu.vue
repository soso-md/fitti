<script setup lang="ts">
useHead({ title: 'Neues Workout — Fitti' })
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/plan" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="mb-4 text-xl">Workout erstellen</h1>
    <WorkoutForm @gespeichert="navigateTo('/plan')" />
  </main>
</template>
