<script setup lang="ts">
useHead({ title: 'Neuer Plan — Fitti' })
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/plan" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="text-xl">Neuer Plan</h1>
    <p class="text-ink-soft mt-1 mb-4 text-sm">z. B. Gym, Joggen, oder ein fixer Termin</p>
    <PlanForm @gespeichert="navigateTo('/plan')" />
  </main>
</template>
