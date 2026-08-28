<script setup lang="ts">
import type { BlockRow } from '~/composables/useBlocks'

useHead({ title: 'Blöcke — Fitti' })

const { list } = useBlocks()
const bloecke = ref<BlockRow[]>([])
const pending = ref(true)

onMounted(async () => {
  bloecke.value = await list()
  pending.value = false
})
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <NuxtLink to="/uebungen" class="text-muted block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="text-xl">Blöcke</h1>
    <p class="text-ink-soft mt-1 text-sm">
      Wiederverwendbar. Eine Änderung wirkt in jedem Workout, das den Block nutzt.
    </p>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <UiCard v-else-if="!bloecke.length" class="mt-4">
      <p class="text-ink-soft text-sm">Noch keine Blöcke.</p>
    </UiCard>

    <div v-else class="mt-4 flex flex-col gap-2">
      <NuxtLink
        v-for="b in bloecke"
        :key="b.id"
        :to="`/bloecke/${b.id}`"
        class="bg-card rounded-md shadow-card block px-3.5 py-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="truncate font-semibold">{{ b.name }}</span>
          <span class="text-muted shrink-0" aria-hidden="true">›</span>
        </div>
        <div class="mt-1 flex flex-wrap gap-1.5">
          <UiTag v-for="t in b.tags" :key="t">{{ t }}</UiTag>
        </div>
        <div class="text-ink-soft mt-1.5 text-xs">
          {{ b.uebungen.map(u => u.name).join(' · ') || 'noch leer' }}
        </div>
      </NuxtLink>
    </div>

    <UiButton class="mt-4" variant="secondary" @click="navigateTo('/bloecke/neu')">
      + Neuer Block
    </UiButton>

    <AppBottomNav />
  </main>
</template>
