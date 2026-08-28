<script setup lang="ts">
import type { Exercise } from '~/types/fitti'
import type { BlockRow } from '~/composables/useBlocks'
import { STANDARD_TAGS } from '~/composables/useTags'

const props = defineProps<{ block?: BlockRow | null, vorschlagTag?: string }>()
const emit = defineEmits<{ gespeichert: [id: string] }>()

const { save } = useBlocks()
const { list: tagList } = useTags()

const name = ref(props.block?.name ?? '')
const tags = ref<string[]>(props.block?.tags ?? (props.vorschlagTag ? [props.vorschlagTag] : []))
const uebungen = ref(
  (props.block?.uebungen ?? []).map(u => ({
    exercise_id: u.exercise_id, name: u.name,
    target_sets: u.target_sets, target_reps: u.target_reps, target_seconds: u.target_seconds,
  })),
)

const eigeneTags = ref<string[]>([])
const neuerTag = ref('')
const picker = ref(false)
const pending = ref(false)
const fehler = ref<string | null>(null)

onMounted(async () => {
  // Vorhandene Tags mit anbieten, nicht nur die vier Standardwerte.
  eigeneTags.value = (await tagList()).map(t => t.name)
})

const alleTags = computed(() =>
  [...new Set([...STANDARD_TAGS, ...eigeneTags.value, ...tags.value])],
)

function toggleTag(t: string) {
  tags.value = tags.value.includes(t) ? tags.value.filter(x => x !== t) : [...tags.value, t]
}

function tagAnlegen() {
  const t = neuerTag.value.trim()
  if (!t) return
  if (!tags.value.includes(t)) tags.value.push(t)
  if (!eigeneTags.value.includes(t)) eigeneTags.value.push(t)
  neuerTag.value = ''
}

function uebungHinzufuegen(e: Exercise) {
  uebungen.value.push({
    exercise_id: e.id, name: e.name,
    target_sets: e.is_timed ? 1 : 3,
    target_reps: e.is_timed ? null : 10,
    target_seconds: e.is_timed ? 30 : null,
  })
}

async function speichern() {
  if (!name.value.trim()) {
    fehler.value = 'Der Block braucht einen Namen.'
    return
  }
  pending.value = true
  fehler.value = null
  try {
    const id = await save({
      id: props.block?.id,
      name: name.value.trim(),
      tags: tags.value,
      uebungen: uebungen.value.map(u => ({
        exercise_id: u.exercise_id, target_sets: u.target_sets,
        target_reps: u.target_reps, target_seconds: u.target_seconds,
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
    <UiInput v-model="name" label="Name" placeholder="z. B. Sprunggelenk Reha" />

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Tags</div>
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="t in alleTags" :key="t" :active="tags.includes(t)" @click="toggleTag(t)">
          {{ t }}
        </UiChip>
      </div>
      <div class="mt-2 flex gap-2">
        <input
          v-model="neuerTag"
          placeholder="Eigener Tag …"
          class="bg-card rounded-md w-full px-4 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
          @keydown.enter.prevent="tagAnlegen"
        >
        <UiButton size="sm" variant="secondary" @click="tagAnlegen">Hinzufügen</UiButton>
      </div>
    </div>

    <div>
      <div class="text-ink-soft mb-1.5 text-sm">Übungen</div>
      <div class="flex flex-col gap-2">
        <div
          v-for="(u, i) in uebungen"
          :key="i"
          class="bg-card rounded-md shadow-card flex items-center justify-between gap-2 px-3.5 py-2.5"
        >
          <div class="min-w-0">
            <div class="truncate font-semibold">{{ u.name }}</div>
            <div class="text-ink-soft text-xs">
              {{ u.target_sets }}×{{ u.target_seconds ? `${u.target_seconds}s` : u.target_reps }}
            </div>
          </div>
          <button
            type="button"
            aria-label="Entfernen"
            class="text-muted size-11 shrink-0"
            @click="uebungen = uebungen.filter((_, j) => j !== i)"
          >
            ×
          </button>
        </div>
        <UiButton variant="ghost" @click="picker = true">+ Übung hinzufügen</UiButton>
      </div>
    </div>

    <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

    <UiButton size="lg" :disabled="pending" @click="speichern">
      {{ pending ? 'Speichert …' : 'Block speichern' }}
    </UiButton>

    <ExercisePicker v-model="picker" @gewaehlt="uebungHinzufuegen" />
  </div>
</template>
