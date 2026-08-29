<script setup lang="ts">
import type { Sport } from '~/composables/useSports'
import { METRIK_TYPEN } from '~/composables/useSports'

useHead({ title: 'Sportarten — Fitti' })

const { list, save, archive } = useSports()

const sportarten = ref<Sport[]>([])
const pending = ref(true)
const bearbeitet = ref<Partial<Sport> | null>(null)
const fehler = ref<string | null>(null)

async function laden() {
  sportarten.value = await list()
  pending.value = false
}
onMounted(laden)

function neu() {
  bearbeitet.value = { name: '', metric_label: '', metric_type: 'custom', position: 10 }
}

async function speichern() {
  const b = bearbeitet.value
  if (!b?.name?.trim()) {
    fehler.value = 'Die Sportart braucht einen Namen.'
    return
  }
  fehler.value = null
  try {
    await save({ ...b, name: b.name.trim() } as any)
    bearbeitet.value = null
    await laden()
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Speichern hat nicht geklappt.'
  }
}

async function archivieren(s: Sport) {
  await archive(s.id)
  await laden()
}

const typLabel = (w: string | null) => METRIK_TYPEN.find(t => t.wert === w)?.label
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Bibliothek</h1>
    <div class="mt-3.5">
      <LibraryTabs />
    </div>

    <p class="text-ink-soft mt-4 text-sm">
      Für freie Trainings. Die Kennzahl beschriftet das Feld beim Loggen —
      bei Schwimmen etwa „Bahnen“ statt „Distanz“.
    </p>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <div v-else class="mt-4 flex flex-col gap-2">
      <div
        v-for="s in sportarten"
        :key="s.id"
        class="bg-card rounded-md shadow-card flex items-center justify-between gap-2 px-3.5 py-3"
      >
        <div class="min-w-0">
          <div class="truncate font-semibold">{{ s.name }}</div>
          <div class="text-ink-soft truncate text-xs">
            {{ s.metric_label || typLabel(s.metric_type) || 'ohne Kennzahl' }}
          </div>
        </div>
        <div class="flex shrink-0">
          <button
            type="button"
            class="text-lavender-600 px-2 py-3 text-[13px]"
            @click="bearbeitet = { ...s }"
          >
            ändern
          </button>
          <button
            type="button"
            class="text-muted px-2 py-3 text-[13px]"
            @click="archivieren(s)"
          >
            entfernen
          </button>
        </div>
      </div>

      <p v-if="!sportarten.length" class="text-muted text-sm">
        Noch keine Sportart.
      </p>

      <UiButton class="mt-2" variant="secondary" @click="neu">+ Neue Sportart</UiButton>
    </div>

    <UiSheet
      :model-value="bearbeitet !== null"
      :title="bearbeitet?.id ? 'Sportart ändern' : 'Neue Sportart'"
      @update:model-value="v => !v && (bearbeitet = null)"
    >
      <div v-if="bearbeitet" class="flex flex-col gap-3.5">
        <UiInput v-model="bearbeitet.name as string" label="Name" placeholder="z. B. Klettern" />

        <div>
          <div class="text-ink-soft mb-1.5 text-sm">Was wird gemessen?</div>
          <div class="flex flex-wrap gap-2">
            <UiChip
              v-for="t in METRIK_TYPEN"
              :key="t.wert"
              :active="bearbeitet.metric_type === t.wert"
              @click="bearbeitet.metric_type = t.wert"
            >
              {{ t.label }}
            </UiChip>
          </div>
        </div>

        <UiInput
          v-if="bearbeitet.metric_type !== 'duration'"
          v-model="bearbeitet.metric_label as string"
          label="Beschriftung der Kennzahl"
          placeholder="z. B. Bahnen (à 25 m)"
        />

        <UiInput
          v-model.number="bearbeitet.position as any"
          label="Reihenfolge (kleiner steht weiter vorn)"
          type="number"
        />

        <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

        <UiButton size="lg" @click="speichern">Speichern</UiButton>
        <UiButton variant="ghost" @click="bearbeitet = null">Abbrechen</UiButton>
      </div>
    </UiSheet>

    <AppBottomNav />
  </main>
</template>
