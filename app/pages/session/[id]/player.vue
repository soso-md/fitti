<script setup lang="ts">
import type { SessionItem, SessionSet } from '~/types/fitti'

const route = useRoute()
const sessionId = route.params.id as string
const { load, addSet, completeSet, saveNote, finish } = useSession()

const items = ref<SessionItem[]>([])
const idx = ref(0)
const pending = ref(true)
const startedAt = ref<Date | null>(null)

useHead({ title: 'Training läuft — Fitti' })

/** Nur nicht übersprungene Items laufen durch den Player. */
const aktiv = computed(() => items.value.filter(i => !i.skipped))
const item = computed(() => aktiv.value[idx.value] ?? null)
const saetze = computed<SessionSet[]>(() => item.value?.sets ?? [])

onMounted(async () => {
  const { session, items: geladen } = await load(sessionId)
  items.value = geladen
  startedAt.value = new Date(session.started_at)
  pending.value = false
  tick()
})

// --- Verstrichene Zeit -------------------------------------------------
const jetzt = ref(Date.now())
let uhr: ReturnType<typeof setInterval> | null = null
function tick() {
  uhr = setInterval(() => {
    jetzt.value = Date.now()
    if (pause.value !== null && pause.value > 0) pause.value--
    if (laeuft.value && timer.value > 0) timer.value--
  }, 1000)
}
onUnmounted(() => uhr && clearInterval(uhr))

const dauer = computed(() => {
  if (!startedAt.value) return '0:00'
  const s = Math.max(0, Math.floor((jetzt.value - startedAt.value.getTime()) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

// --- Pause-Timer -------------------------------------------------------
// Laut Handoff immer oben sichtbar und getrennt vom Übungs-Timer.
const pause = ref<number | null>(null)

// --- Zeitbasierte Übungen ---------------------------------------------
const timer = ref(45)
const laeuft = ref(false)

watch(item, (neu) => {
  pause.value = null
  laeuft.value = false
  timer.value = neu?.sets?.[0]?.duration_seconds ?? 45
  notiz.value = neu?.note ?? ''
})

// --- Satz-Eingabe ------------------------------------------------------
const reps = ref<string>('')
const gewicht = ref<string>('')

/** Der erste offene Satz ist der einzige, der editierbar ist. */
const aktuellerIdx = computed(() =>
  saetze.value.findIndex(s => !s.done_at),
)

/**
 * An den Satz selbst gebunden, nicht an seinen Index: beim Wechsel auf die
 * naechste Uebung bleibt der Index 0 und ein Index-Watcher wuerde schweigen
 * -- die Felder behielten dann die Werte der vorherigen Uebung.
 */
const aktuellerSatz = computed(() => saetze.value[aktuellerIdx.value] ?? null)

watch(aktuellerSatz, (s) => {
  reps.value = s?.reps != null ? String(s.reps) : ''
  gewicht.value = s?.weight != null ? String(s.weight) : ''
}, { immediate: true })

async function satzFertig(s: SessionSet) {
  const r = reps.value === '' ? null : Number(reps.value)
  const g = gewicht.value === '' ? null : Number(gewicht.value)
  await completeSet(s.id, r, g)
  s.reps = r
  s.weight = g
  s.done_at = new Date().toISOString()
  // Pause startet automatisch nach jedem Satz.
  pause.value = 60
}

async function satzHinzufuegen() {
  if (!item.value) return
  const letzter = saetze.value[saetze.value.length - 1]
  const neu = await addSet(
    item.value.id,
    saetze.value.length,
    letzter?.reps ?? null,
    letzter?.weight ?? null,
  )
  item.value.sets = [...saetze.value, neu as any]
}

// --- Notiz -------------------------------------------------------------
const notiz = ref('')
let notizTimer: ReturnType<typeof setTimeout> | null = null
watch(notiz, (wert) => {
  if (!item.value) return
  const id = item.value.id
  if (notizTimer) clearTimeout(notizTimer)
  notizTimer = setTimeout(() => saveNote(id, wert), 600)
})

// --- Navigation --------------------------------------------------------
async function weiter() {
  if (idx.value < aktiv.value.length - 1) {
    idx.value++
    return
  }
  await finish(sessionId)
  await navigateTo(`/session/${sessionId}/fertig`)
}
</script>

<template>
  <main v-if="!pending && item" class="mx-auto min-h-dvh max-w-md px-5 pt-5.5 pb-10">
    <div class="flex items-center justify-between">
      <NuxtLink :to="`/session/${sessionId}`" class="text-muted py-2 text-sm">
        ‹ Übersicht
      </NuxtLink>
      <span class="bg-card rounded-pill shadow-card px-3 py-1 text-sm font-semibold">
        ⏱ {{ dauer }}
      </span>
    </div>

    <!-- Fortschritt über alle Items der Session. -->
    <div class="my-3 flex gap-1">
      <div
        v-for="(x, i) in aktiv"
        :key="x.id"
        class="h-1.5 flex-1 rounded-[3px]"
        :class="i < idx ? 'bg-success' : i === idx ? 'bg-highlight' : 'bg-lavender-100'"
      />
    </div>

    <div class="text-muted text-xs">{{ item.source_label }}</div>
    <h1 class="mb-2 text-2xl">{{ item.exercise?.name }}</h1>

    <div
      v-if="item.exercise?.image_url"
      class="bg-card rounded-lg shadow-card mb-2.5 overflow-hidden"
    >
      <img :src="item.exercise.image_url" alt="" class="h-32 w-full object-cover">
    </div>
    <div
      v-else
      class="bg-card rounded-lg shadow-card text-muted mb-2.5 flex h-32 items-center justify-center text-sm"
    >
      Kein Bild
    </div>

    <a
      v-if="item.exercise?.video_links?.length"
      :href="item.exercise.video_links[0]"
      target="_blank"
      rel="noopener noreferrer"
      class="text-lavender-600 mb-3.5 block font-semibold"
    >
      🔗 Video-Link ansehen
    </a>

    <!-- Zeitbasiert: großer Sekunden-Timer statt Satz-Liste. -->
    <div v-if="item.exercise?.is_timed" class="text-center">
      <div class="bg-card rounded-lg shadow-card my-2.5 py-6 text-4xl tabular-nums">
        {{ timer }}s
      </div>
      <div class="flex gap-2.5">
        <UiButton class="flex-1" @click="laeuft = !laeuft">
          {{ laeuft ? 'Stop' : 'Start' }}
        </UiButton>
        <UiButton variant="ghost" class="flex-1" @click="laeuft = false; timer = 45">
          Reset
        </UiButton>
      </div>
    </div>

    <div v-else class="flex flex-col gap-2.5">
      <!-- Pause-Timer, getrennt vom Übungs-Timer und immer oben. -->
      <div
        v-if="pause !== null"
        class="bg-butter-300 rounded-md flex items-center justify-between px-3.5 py-3"
      >
        <div>
          <div class="text-xs">⏸ Pause</div>
          <b class="text-lg tabular-nums">{{ pause }}s</b>
        </div>
        <div class="flex gap-3 text-[13px]">
          <button type="button" class="px-2 py-2" @click="pause = (pause ?? 0) + 15">+15s</button>
          <button type="button" class="px-2 py-2" @click="pause = null">Skip</button>
        </div>
      </div>

      <template v-for="(s, i) in saetze" :key="s.id">
        <!-- Erledigt: kompakte Zeile. -->
        <div v-if="s.done_at" class="text-muted flex items-center gap-2.5 py-1.5">
          <span class="w-5">{{ i + 1 }}</span>
          <span class="flex-1 text-sm">
            {{ s.reps ?? '–' }} Wdh.<template v-if="s.weight"> · {{ s.weight }} kg</template>
          </span>
          <span aria-label="erledigt">✓</span>
        </div>

        <!-- Aktueller Satz: als einziger editierbar. -->
        <div v-else-if="i === aktuellerIdx" class="bg-lavender-100 rounded-md p-3.5">
          <div class="text-ink-soft mb-2 text-xs">
            Satz {{ i + 1 }} von {{ saetze.length }} — jetzt eintragen
          </div>
          <div class="flex gap-2">
            <input
              v-model="reps"
              type="number"
              inputmode="numeric"
              placeholder="Wdh."
              class="bg-card rounded-md w-full p-3 text-md shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
            >
            <input
              v-model="gewicht"
              type="number"
              inputmode="decimal"
              step="0.5"
              placeholder="kg"
              class="bg-card rounded-md w-full p-3 text-md shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
            >
          </div>
          <UiButton class="mt-2.5 w-full" @click="satzFertig(s)">
            ✓ Satz {{ i + 1 }} fertig
          </UiButton>
        </div>

        <!-- Noch offen: ausgegraut. -->
        <div v-else class="text-muted flex items-center gap-2.5 py-1.5 opacity-50">
          <span class="w-5">{{ i + 1 }}</span>
          <span class="flex-1 text-sm">noch offen</span>
          <span aria-hidden="true">○</span>
        </div>
      </template>

      <UiButton variant="ghost" @click="satzHinzufuegen">+ Satz</UiButton>

      <textarea
        v-model="notiz"
        placeholder="Notiz zur Übung (z. B. Sprunggelenk, Schmerz) …"
        class="bg-card rounded-md min-h-[50px] p-3 text-sm shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)]"
      />
    </div>

    <UiButton size="lg" class="mt-5 w-full" @click="weiter">
      {{ idx < aktiv.length - 1 ? 'Weiter' : 'Fertig — Training abschließen' }}
    </UiButton>
    <UiButton variant="ghost" class="mt-2.5 w-full" @click="weiter">
      Überspringen
    </UiButton>
  </main>

  <p v-else-if="!pending" class="text-muted p-6 text-center text-sm">
    In dieser Session ist nichts mehr offen.
  </p>
</template>
