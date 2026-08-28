<script setup lang="ts">
import type { Exercise } from '~/types/fitti'

/** Bottom-Sheet zur Auswahl einer Uebung aus der Bibliothek. */
const offen = defineModel<boolean>({ required: true })
const emit = defineEmits<{ gewaehlt: [e: Exercise] }>()

const { list } = useExercises()
const alle = ref<Exercise[]>([])
const suche = ref('')

watch(offen, async (o) => {
  // Erst beim Oeffnen laden, und jedes Mal frisch -- neue Uebungen sollen
  // ohne Reload auftauchen.
  if (o) alle.value = await list()
})

const gefiltert = computed(() => {
  const q = suche.value.trim().toLowerCase()
  return q ? alle.value.filter(e => e.name.toLowerCase().includes(q)) : alle.value
})
</script>

<template>
  <UiSheet v-model="offen" title="Übung wählen">
    <UiInput v-model="suche" placeholder="Suchen …" />
    <div class="mt-3 flex flex-col gap-2">
      <button
        v-for="e in gefiltert"
        :key="e.id"
        type="button"
        class="bg-card-warm rounded-md px-3.5 py-3 text-left"
        @click="emit('gewaehlt', e); offen = false"
      >
        <div class="font-semibold">{{ e.name }}</div>
        <div class="text-ink-soft text-xs">
          {{ e.muscle_groups.join(' · ') || 'ohne Muskelgruppe' }}
        </div>
      </button>
      <p v-if="!gefiltert.length" class="text-muted py-2 text-sm">
        Keine Übung gefunden.
      </p>
      <UiButton variant="ghost" @click="navigateTo('/uebungen/neu')">
        + Neue Übung anlegen
      </UiButton>
    </div>
  </UiSheet>
</template>
