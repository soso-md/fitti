<script setup lang="ts">
import type { Exercise } from '~/types/fitti'
import type { WorkoutRow } from '~/composables/useWorkouts'
import type { BlockRow } from '~/composables/useBlocks'

const props = defineProps<{ workout?: WorkoutRow | null }>()
const emit = defineEmits<{ gespeichert: [id: string] }>()

const { save } = useWorkouts()
const { list: blockList } = useBlocks()

interface Eintrag {
  art: 'block' | 'uebung'
  ref_id: string
  label: string
  target_sets: number | null
  target_reps: number | null
  target_seconds: number | null
  target_weight: number | null
}

const name = ref(props.workout?.name ?? '')
const eintraege = ref<Eintrag[]>(
  (props.workout?.items ?? []).map(i => ({
    art: i.block_id ? 'block' : 'uebung',
    ref_id: (i.block_id ?? i.exercise_id)!,
    label: i.label,
    target_sets: i.target_sets,
    target_reps: i.target_reps,
    target_seconds: i.target_seconds,
    target_weight: i.target_weight,
  })),
)

const bloecke = ref<BlockRow[]>([])
const blockPicker = ref(false)
const uebungPicker = ref(false)
const tagFilter = ref<string | null>(null)
const pending = ref(false)
const fehler = ref<string | null>(null)

onMounted(async () => {
  bloecke.value = await blockList()
})

const alleTags = computed(() =>
  [...new Set(bloecke.value.flatMap(b => b.tags))].sort(),
)

const sichtbareBloecke = computed(() =>
  tagFilter.value ? bloecke.value.filter(b => b.tags.includes(tagFilter.value!)) : bloecke.value,
)

function blockHinzufuegen(b: BlockRow) {
  eintraege.value.push({
    art: 'block', ref_id: b.id, label: b.name,
    target_sets: null, target_reps: null, target_seconds: null, target_weight: null,
  })
  blockPicker.value = false
}

function uebungHinzufuegen(e: Exercise) {
  eintraege.value.push({
    art: 'uebung', ref_id: e.id, label: e.name,
    target_sets: e.is_timed ? 3 : 3,
    target_reps: e.is_timed ? null : 10,
    target_seconds: e.is_timed ? 30 : null,
    target_weight: null,
  })
}

function verschieben(i: number, richtung: -1 | 1) {
  const ziel = i + richtung
  if (ziel < 0 || ziel >= eintraege.value.length) return
  const kopie = [...eintraege.value]
  const [x] = kopie.splice(i, 1)
  kopie.splice(ziel, 0, x!)
  eintraege.value = kopie
}

async function speichern() {
  if (!name.value.trim()) {
    fehler.value = 'Das Workout braucht einen Namen.'
    return
  }
  pending.value = true
  fehler.value = null
  try {
    const id = await save({
      id: props.workout?.id,
      name: name.value.trim(),
      items: eintraege.value.map(e => ({
        block_id: e.art === 'block' ? e.ref_id : null,
        exercise_id: e.art === 'uebung' ? e.ref_id : null,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        target_seconds: e.target_seconds,
        target_weight: e.target_weight,
      })),
    })
    emit('gespeichert', id!)
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Speichern hat nicht geklappt.'
    pending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <UiInput v-model="name" label="Name" placeholder="z. B. Push Day" />

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Ablauf</div>
      <div class="flex flex-col gap-2">
        <div
          v-for="(e, i) in eintraege"
          :key="i"
          class="rounded-md px-3.5 py-2.5"
          :class="e.art === 'block' ? 'bg-lavender-100' : 'bg-card shadow-card'"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="text-muted text-[11px]">
                {{ e.art === 'block' ? 'Block — Änderungen wirken überall' : 'Übung' }}
              </div>
              <div class="truncate font-semibold">{{ e.label }}</div>
            </div>
            <div class="flex shrink-0 items-center">
              <button
                type="button" aria-label="Nach oben"
                class="text-muted size-11 disabled:opacity-30"
                :disabled="i === 0" @click="verschieben(i, -1)"
              >↑</button>
              <button
                type="button" aria-label="Nach unten"
                class="text-muted size-11 disabled:opacity-30"
                :disabled="i === eintraege.length - 1" @click="verschieben(i, 1)"
              >↓</button>
              <button
                type="button" aria-label="Entfernen" class="text-muted size-11"
                @click="eintraege = eintraege.filter((_, j) => j !== i)"
              >×</button>
            </div>
          </div>

          <!-- Zielvorgaben nur bei Einzeluebungen; ein Block bringt seine mit. -->
          <div v-if="e.art === 'uebung'" class="mt-2 flex items-center gap-2">
            <input
              v-model.number="e.target_sets" type="number" inputmode="numeric"
              placeholder="Sätze" aria-label="Sätze"
              class="bg-app rounded-sm w-full px-2.5 py-2 text-sm"
            >
            <input
              v-if="e.target_seconds !== null"
              v-model.number="e.target_seconds" type="number" inputmode="numeric"
              placeholder="Sek." aria-label="Sekunden"
              class="bg-app rounded-sm w-full px-2.5 py-2 text-sm"
            >
            <input
              v-else
              v-model.number="e.target_reps" type="number" inputmode="numeric"
              placeholder="Wdh." aria-label="Wiederholungen"
              class="bg-app rounded-sm w-full px-2.5 py-2 text-sm"
            >
            <input
              v-model.number="e.target_weight" type="number" inputmode="decimal" step="0.5"
              placeholder="kg" aria-label="Gewicht"
              class="bg-app rounded-sm w-full px-2.5 py-2 text-sm"
            >
          </div>
        </div>

        <p v-if="!eintraege.length" class="text-muted text-sm">
          Noch nichts drin. Füge Blöcke für Warmup und Cooldown hinzu und dazwischen
          die Hauptübungen.
        </p>
      </div>

      <div class="mt-2 flex flex-col gap-2">
        <UiButton variant="ghost" @click="blockPicker = true">+ Block verknüpfen</UiButton>
        <UiButton variant="ghost" @click="uebungPicker = true">+ Übung hinzufügen</UiButton>
      </div>
    </div>

    <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

    <UiButton size="lg" :disabled="pending" @click="speichern">
      {{ pending ? 'Speichert …' : 'Workout speichern' }}
    </UiButton>

    <UiSheet v-model="blockPicker" title="Block wählen">
      <div v-if="alleTags.length" class="mb-3 flex flex-wrap gap-2">
        <UiChip :active="tagFilter === null" @click="tagFilter = null">Alle</UiChip>
        <UiChip
          v-for="t in alleTags" :key="t"
          :active="tagFilter === t" @click="tagFilter = t"
        >
          {{ t }}
        </UiChip>
      </div>
      <div class="flex flex-col gap-2">
        <button
          v-for="b in sichtbareBloecke" :key="b.id" type="button"
          class="bg-card-warm rounded-md px-3.5 py-3 text-left"
          @click="blockHinzufuegen(b)"
        >
          <div class="font-semibold">{{ b.name }}</div>
          <div class="text-ink-soft text-xs">
            {{ b.uebungen.map(u => u.name).join(' · ') || 'noch leer' }}
          </div>
        </button>
        <p v-if="!sichtbareBloecke.length" class="text-muted py-2 text-sm">
          Kein Block mit diesem Tag.
        </p>
        <UiButton variant="ghost" @click="navigateTo('/bloecke/neu')">
          + Neuen Block erstellen
        </UiButton>
      </div>
    </UiSheet>

    <ExercisePicker v-model="uebungPicker" @gewaehlt="uebungHinzufuegen" />
  </div>
</template>
