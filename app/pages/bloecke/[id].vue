<script setup lang="ts">
import type { BlockRow } from '~/composables/useBlocks'

const route = useRoute()
const { get } = useBlocks()

const block = ref<BlockRow | null>(null)
const pending = ref(true)

useHead({ title: () => `${block.value?.name ?? 'Block'} — Fitti` })

onMounted(async () => {
  block.value = await get(route.params.id as string)
  pending.value = false
})
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/bloecke" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="mb-4 text-xl">Block bearbeiten</h1>
    <BlockForm v-if="!pending && block" :block="block" @gespeichert="navigateTo('/bloecke')" />
    <p v-else-if="!pending" class="text-muted text-sm">Diesen Block gibt es nicht.</p>
  </main>
</template>
