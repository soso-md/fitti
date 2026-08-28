<script setup lang="ts">
import type { Exercise } from '~/types/fitti'
import { LEVELS } from '~/composables/useExercises'

useHead({ title: 'Übungen — Fitti' })

const { list } = useExercises()

const alle = ref<Exercise[]>([])
const pending = ref(true)
const suche = ref('')
const level = ref<string | null>(null)
// Mehrfachauswahl, wie im Handoff gefordert.
const muskeln = ref<string[]>([])

onMounted(async () => {
  alle.value = await list()
  pending.value = false
})

/** Nur Gruppen anbieten, die auch wirklich vorkommen. */
const verfuegbareMuskeln = computed(() =>
  [...new Set(alle.value.flatMap(e => e.muscle_groups))].sort(),
)

function toggleMuskel(m: string) {
  muskeln.value = muskeln.value.includes(m)
    ? muskeln.value.filter(x => x !== m)
    : [...muskeln.value, m]
}

const gefiltert = computed(() => {
  const q = suche.value.trim().toLowerCase()
  return alle.value.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q)) return false
    if (level.value && e.level !== level.value) return false
    // Mehrfachauswahl ist ein ODER: eine Treffergruppe reicht.
    if (muskeln.value.length && !e.muscle_groups.some(m => muskeln.value.includes(m))) return false
    return true
  })
})

const levelLabel = (w: string | null) => LEVELS.find(l => l.wert === w)?.label
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Übungen</h1>

    <div class="mt-3.5">
      <UiInput v-model="suche" placeholder="Übung suchen …" />
    </div>

    <div class="mt-2.5 flex flex-wrap gap-2">
      <UiChip :active="level === null" @click="level = null">Alle</UiChip>
      <UiChip
        v-for="l in LEVELS"
        :key="l.wert"
        :active="level === l.wert"
        @click="level = l.wert"
      >
        {{ l.label }}
      </UiChip>
    </div>

    <div v-if="verfuegbareMuskeln.length" class="mt-2 flex flex-wrap gap-2">
      <UiChip
        v-for="m in verfuegbareMuskeln"
        :key="m"
        :active="muskeln.includes(m)"
        @click="toggleMuskel(m)"
      >
        {{ m }}
      </UiChip>
    </div>

    <!-- Oben fixiert, nicht im Scrollbereich -- so im Handoff verlangt. -->
    <div class="mt-3 flex gap-2">
      <UiButton size="sm" variant="secondary" @click="navigateTo('/uebungen/neu')">
        + Neue Übung
      </UiButton>
      <UiButton size="sm" variant="ghost" @click="navigateTo('/bloecke/neu')">
        + Neuer Block
      </UiButton>
    </div>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <UiCard v-else-if="!gefiltert.length" class="mt-3.5">
      <p class="text-ink-soft text-sm">
        {{ alle.length ? 'Keine Übung passt zu diesen Filtern.' : 'Noch keine Übungen. Leg die erste an.' }}
      </p>
    </UiCard>

    <div v-else class="mt-3.5 flex flex-col gap-2">
      <NuxtLink
        v-for="e in gefiltert"
        :key="e.id"
        :to="`/uebungen/${e.id}`"
        class="bg-card rounded-md shadow-card flex items-center justify-between gap-3 px-3.5 py-3"
      >
        <div class="min-w-0">
          <div class="truncate font-semibold">{{ e.name }}</div>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <UiTag v-for="m in e.muscle_groups" :key="m">{{ m }}</UiTag>
            <UiTag v-if="e.level" tone="success">{{ levelLabel(e.level) }}</UiTag>
          </div>
        </div>
        <span class="text-muted shrink-0" aria-hidden="true">›</span>
      </NuxtLink>
    </div>

    <AppBottomNav />
  </main>
</template>
