<script setup lang="ts">
import type { Sport } from '~/composables/useSports'

useHead({ title: 'Freies Training — Fitti' })

const { create } = useFreeform()
const { list: sportList, save: sportSave } = useSports()

const sportarten = ref<Sport[]>([])
const sport = ref<string>('')
const neueSportart = ref('')
const zeigeNeue = ref(false)
const dauer = ref('')
const kennzahl = ref('')
const intensitaet = ref(6)
const notiz = ref('')
const pending = ref(false)
const fehler = ref<string | null>(null)

onMounted(async () => {
  sportarten.value = await sportList()
  sport.value = sportarten.value[0]?.name ?? ''
})

/** Label und Bedeutung der Kennzahl kommen aus der Bibliothek. */
const feld = computed(() => {
  const s = sportarten.value.find(x => x.name === sport.value)
  if (s?.metric_type === 'duration') return null
  return {
    label: s?.metric_label || 'Zusätzliche Kennzahl (optional)',
    type: s?.metric_type || 'custom',
    hint: 'z. B. 12',
  }
})

/** Eine hier angelegte Sportart landet in der Bibliothek, nicht nur im Log. */
async function sportartAnlegen() {
  const name = neueSportart.value.trim()
  if (!name) return
  await sportSave({ name, metric_type: 'custom', position: 10 })
  sportarten.value = await sportList()
  sport.value = name
  neueSportart.value = ''
  zeigeNeue.value = false
}

async function speichern() {
  pending.value = true
  fehler.value = null
  try {
    await create({
      sport: sport.value,
      duration_minutes: dauer.value ? Number(dauer.value) : null,
      metric_label: kennzahl.value && feld.value ? feld.value.label : null,
      metric_value: kennzahl.value ? Number(kennzahl.value) : null,
      metric_type: kennzahl.value && feld.value ? feld.value.type : 'duration',
      intensity: intensitaet.value,
      note: notiz.value.trim() || null,
    })
    await navigateTo('/')
  }
  catch (e: any) {
    fehler.value = e?.message ?? 'Speichern hat nicht geklappt.'
    pending.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="text-xl">Freies Training loggen</h1>
    <p class="text-ink-soft mt-1 text-sm">Für unstrukturierte Trainings ohne festen Plan</p>

    <div class="mt-5 flex flex-col gap-4">
      <div>
        <div class="text-ink-soft mb-1.5 text-sm">Art — häufigste zuerst</div>
        <div class="flex flex-wrap gap-2">
          <UiChip
            v-for="s in sportarten"
            :key="s.id"
            :active="sport === s.name"
            @click="sport = s.name"
          >
            {{ s.name }}
          </UiChip>
          <UiChip dashed @click="zeigeNeue = true">+ eigene Sportart</UiChip>
        </div>
        <div v-if="zeigeNeue" class="mt-2 flex gap-2">
          <input
            v-model="neueSportart"
            placeholder="z. B. Klettern"
            class="bg-card rounded-md w-full px-4 py-3 shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
            @keydown.enter.prevent="sportartAnlegen"
          >
          <UiButton size="sm" @click="sportartAnlegen">Hinzufügen</UiButton>
        </div>
      </div>

      <UiInput v-model="dauer" label="Dauer (Minuten)" type="number" placeholder="60" />

      <UiInput
        v-if="feld"
        v-model="kennzahl"
        :label="feld.label"
        type="number"
        :placeholder="feld.hint"
      />

      <div>
        <div class="text-ink-soft mb-1.5 text-sm">
          Gefühlte Intensität ({{ intensitaet }}/10)
        </div>
        <div class="flex gap-1">
          <button
            v-for="n in 10"
            :key="n"
            type="button"
            :aria-label="`Intensität ${n}`"
            class="rounded-sm shadow-card h-8 flex-1"
            :class="n <= intensitaet ? 'bg-highlight' : 'bg-card'"
            @click="intensitaet = n"
          />
        </div>
      </div>

      <div>
        <div class="text-ink-soft mb-1.5 text-sm">Notiz / Symptome</div>
        <textarea
          v-model="notiz"
          placeholder="Wie war’s? Irgendwas aufgefallen?"
          class="bg-card rounded-md min-h-[70px] w-full p-3.5 shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
        />
      </div>

      <p v-if="fehler" class="text-coral-600 text-sm">{{ fehler }}</p>

      <UiButton size="lg" :disabled="pending" @click="speichern">
        {{ pending ? 'Speichert …' : 'Speichern' }}
      </UiButton>
    </div>
  </main>
</template>
