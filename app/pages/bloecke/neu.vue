<script setup lang="ts">
useHead({ title: 'Neuer Block — Fitti' })
const route = useRoute()
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/bloecke" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="text-xl">Neuer Block</h1>
    <p class="text-ink-soft mt-1 mb-4 text-sm">Wiederverwendbar, steuerbar über Tags</p>
    <BlockForm
      :vorschlag-tag="(route.query.tag as string) || undefined"
      @gespeichert="navigateTo('/bloecke')"
    />
  </main>
</template>
