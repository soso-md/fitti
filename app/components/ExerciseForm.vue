<script setup lang="ts">
import type { Exercise } from '~/types/fitti'
import { MUSKELGRUPPEN, LEVELS } from '~/composables/useExercises'

/** Gemeinsames Formular fuer Anlegen und Bearbeiten. */
const props = defineProps<{ exercise?: Exercise | null }>()
const emit = defineEmits<{ gespeichert: [id: string] }>()

const { create, update } = useExercises()

const name = ref(props.exercise?.name ?? '')
const muskeln = ref<string[]>([...(props.exercise?.muscle_groups ?? [])])
const level = ref<string | null>(props.exercise?.level ?? null)
const istZeit = ref(props.exercise?.is_timed ?? false)
const hinweise = ref(props.exercise?.instructions ?? '')
const links = ref<string[]>(
  props.exercise?.video_links?.length ? [...props.exercise.video_links] : [''],
)

const pending = ref(false)
const fehler = ref<string | null>(null)

function toggleMuskel(m: string) {
  muskeln.value = muskeln.value.includes(m)
    ? muskeln.value.filter(x => x !== m)
    : [...muskeln.value, m]
}

async function speichern() {
  if (!name.value.trim()) {
    fehler.value = 'Die Übung braucht einen Namen.'
    return
  }
  pending.value = true
  fehler.value = null

  const werte = {
    name: name.value.trim(),
    muscle_groups: muskeln.value,
    level: level.value,
    is_timed: istZeit.value,
    instructions: hinweise.value.trim() || null,
    video_links: links.value.map(l => l.trim()).filter(Boolean),
  }

  try {
    const id = props.exercise
      ? (await update(props.exercise.id, werte as any), props.exercise.id)
      : await create(werte as any)
    emit('gespeichert', id)
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Speichern hat nicht geklappt.'
    pending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <UiInput v-model="name" label="Name" placeholder="z. B. Bulgarian Split Squat" />

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Muskelgruppen (mehrere möglich)</div>
      <div class="flex flex-wrap gap-2">
        <UiChip
          v-for="m in MUSKELGRUPPEN"
          :key="m"
          :active="muskeln.includes(m)"
          @click="toggleMuskel(m)"
        >
          {{ m }}
        </UiChip>
      </div>
    </div>

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Level</div>
      <div class="flex gap-2">
        <UiChip
          v-for="l in LEVELS"
          :key="l.wert"
          :active="level === l.wert"
          @click="level = level === l.wert ? null : l.wert"
        >
          {{ l.label }}
        </UiChip>
      </div>
    </div>

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Art</div>
      <div class="flex gap-2">
        <UiChip :active="!istZeit" @click="istZeit = false">Sätze &amp; Wiederholungen</UiChip>
        <UiChip :active="istZeit" @click="istZeit = true">Auf Zeit</UiChip>
      </div>
      <p class="text-muted mt-1.5 text-xs">
        „Auf Zeit“ zeigt im Training einen Sekunden-Timer statt der Satz-Liste.
      </p>
    </div>

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Video-Links (mehrere möglich)</div>
      <div class="flex flex-col gap-2">
        <div v-for="(_, i) in links" :key="i" class="flex items-center gap-2">
          <input
            v-model="links[i]"
            inputmode="url"
            placeholder="youtube.com/…"
            class="bg-card rounded-md w-full px-4 py-3.5 shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
          >
          <button
            v-if="links.length > 1"
            type="button"
            aria-label="Link entfernen"
            class="text-muted size-11 shrink-0"
            @click="links = links.filter((_, j) => j !== i)"
          >
            ×
          </button>
        </div>
      </div>
      <UiButton variant="ghost" size="sm" class="mt-2" @click="links = [...links, '']">
        + Weiteren Link hinzufügen
      </UiButton>
    </div>

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Hinweise zur Ausführung</div>
      <textarea
        v-model="hinweise"
        placeholder="Kurzbeschreibung …"
        class="bg-card rounded-md min-h-20 w-full p-3.5 shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
      />
    </div>

    <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

    <UiButton size="lg" :disabled="pending" @click="speichern">
      {{ pending ? 'Speichert …' : 'Übung speichern' }}
    </UiButton>
  </div>
</template>
