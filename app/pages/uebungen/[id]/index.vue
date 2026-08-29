<script setup lang="ts">
import type { Exercise } from '~/types/fitti'
import { LEVELS } from '~/composables/useExercises'
import { illustration } from '~/utils/illustrationen'

const route = useRoute()
const id = route.params.id as string
const { get, archive, letztesErgebnis } = useExercises()

const uebung = ref<Exercise | null>(null)
const letztes = ref<{ text: string, datum: string } | null>(null)
const pending = ref(true)
const loeschen = ref(false)

useHead({ title: () => `${uebung.value?.name ?? 'Übung'} — Fitti` })

onMounted(async () => {
  uebung.value = await get(id)
  letztes.value = await letztesErgebnis(id)
  pending.value = false
})

const bild = computed(() => illustration(uebung.value?.image_url))

const levelLabel = computed(() => LEVELS.find(l => l.wert === uebung.value?.level)?.label)

function vorTagen(iso: string) {
  const tage = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (tage <= 0) return 'heute'
  if (tage === 1) return 'gestern'
  return `vor ${tage} Tagen`
}

async function archivieren() {
  await archive(id)
  await navigateTo('/uebungen')
}
</script>

<template>
  <main v-if="!pending && uebung" class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <div class="flex items-center justify-between gap-2">
      <NuxtLink to="/uebungen" class="text-muted py-2 text-sm">‹ Zurück</NuxtLink>
      <div class="flex gap-2">
        <UiButton size="sm" variant="ghost" @click="navigateTo(`/uebungen/${id}/bearbeiten`)">
          Bearbeiten
        </UiButton>
        <UiButton size="sm" variant="ghost" @click="loeschen = true">Löschen</UiButton>
      </div>
    </div>

    <h1 class="mt-2.5 text-xl">{{ uebung.name }}</h1>

    <div class="mt-2 flex flex-wrap gap-1.5">
      <UiTag v-for="m in uebung.muscle_groups" :key="m">{{ m }}</UiTag>
      <UiTag v-if="levelLabel" tone="success">{{ levelLabel }}</UiTag>
      <UiTag v-if="uebung.is_timed" tone="highlight">Auf Zeit</UiTag>
    </div>

    <div
      v-if="bild"
      class="bg-card rounded-lg shadow-card mt-4 overflow-hidden"
    >
      <img :src="bild" alt="" class="h-44 w-full object-contain">
    </div>
    <div
      v-else
      class="bg-card rounded-lg shadow-card text-muted mt-4 flex h-44 items-center justify-center text-sm"
    >
      Kein Bild
    </div>

    <div v-if="uebung.video_links?.length" class="mt-3 flex flex-col gap-1.5">
      <a
        v-for="l in uebung.video_links"
        :key="l"
        :href="l"
        target="_blank"
        rel="noopener noreferrer"
        class="text-lavender-600 truncate font-semibold"
      >
        🔗 {{ l }}
      </a>
    </div>

    <template v-if="uebung.instructions">
      <h2 class="mt-4 font-sans text-base font-semibold">Hinweise zur Ausführung</h2>
      <p class="text-ink-soft mt-1.5 leading-relaxed">{{ uebung.instructions }}</p>
    </template>

    <h2 class="mt-4 font-sans text-base font-semibold">Letztes Training</h2>
    <UiCard class="mt-1.5">
      <p v-if="letztes" class="text-sm">
        {{ letztes.text }} — {{ vorTagen(letztes.datum) }}
      </p>
      <p v-else class="text-ink-soft text-sm">Noch nichts geloggt.</p>
    </UiCard>

    <UiSheet v-model="loeschen" title="Übung löschen?">
      <p class="text-ink-soft text-sm">
        Die Übung verschwindet aus der Bibliothek, bestehende Trainingsprotokolle
        bleiben erhalten.
      </p>
      <div class="mt-4 flex flex-col gap-2">
        <UiButton variant="dark" @click="archivieren">Ja, löschen</UiButton>
        <UiButton variant="ghost" @click="loeschen = false">Abbrechen</UiButton>
      </div>
    </UiSheet>
  </main>

  <p v-else-if="!pending" class="text-muted p-6 text-center text-sm">
    Diese Übung gibt es nicht.
  </p>
</template>
