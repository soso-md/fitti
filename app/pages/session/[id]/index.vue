<script setup lang="ts">
import type { SessionItem } from '~/types/fitti'

const route = useRoute()
const sessionId = route.params.id as string

const { load, reorder, setSkipped } = useSession()

const titel = ref('')
const items = ref<SessionItem[]>([])
const pending = ref(true)
const dragIdx = ref<number | null>(null)

useHead({ title: () => `${titel.value || 'Training'} — Fitti` })

onMounted(async () => {
  const { session, items: geladen } = await load(sessionId)
  titel.value = session.title
  items.value = geladen
  pending.value = false
})

/** Das erste noch nicht übersprungene Item ist der Einstieg. */
const naechstes = computed(() => items.value.find(i => !i.skipped) ?? null)

function onDrop(ziel: number) {
  const von = dragIdx.value
  dragIdx.value = null
  if (von === null || von === ziel) return

  const kopie = [...items.value]
  const [bewegt] = kopie.splice(von, 1)
  kopie.splice(ziel, 0, bewegt!)
  items.value = kopie
  reorder(kopie)
}

async function ueberspringen(item: SessionItem) {
  item.skipped = !item.skipped
  await setSkipped(item.id, item.skipped)
}

function meta(item: SessionItem) {
  const e = item.exercise
  if (!e) return ''
  if (e.is_timed) return 'Auf Zeit'
  return e.muscle_groups.join(' · ')
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-7">
    <h1 class="text-xl">{{ titel }}</h1>
    <p class="text-ink-soft mt-1 text-sm">
      Übersicht — Reihenfolge per Drag &amp; Drop anpassbar
    </p>

    <p v-if="pending" class="text-muted mt-4 text-sm">Einen Moment …</p>

    <div v-else class="mt-3.5 flex flex-1 flex-col gap-2.5 pb-44">
      <div
        v-for="(item, i) in items"
        :key="item.id"
        draggable="true"
        class="bg-card rounded-md shadow-card flex items-center justify-between gap-3 px-3.5 py-3 transition-opacity"
        :class="[dragIdx === i && 'opacity-40', item.skipped && 'opacity-50']"
        @dragstart="dragIdx = i"
        @dragover.prevent
        @drop="onDrop(i)"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <!-- Anfasser: 44px Touch-Ziel, damit er am Daumen sicher trifft. -->
          <span
            class="text-muted flex size-11 shrink-0 cursor-grab items-center justify-center text-md"
            aria-hidden="true"
          >⠿</span>
          <div class="min-w-0">
            <div class="text-muted text-[11px]">{{ item.source_label }}</div>
            <div class="truncate font-semibold" :class="item.skipped && 'line-through'">
              {{ item.exercise?.name }}
            </div>
            <div class="text-ink-soft truncate text-xs">{{ meta(item) }}</div>
          </div>
        </div>
        <button
          type="button"
          class="text-lavender-600 shrink-0 px-2 py-3 text-[13px]"
          @click="ueberspringen(item)"
        >
          {{ item.skipped ? 'zurück' : 'überspr.' }}
        </button>
      </div>

      <UiButton variant="ghost" disabled>
        + Übung zu heute hinzufügen (nicht zum Plan)
      </UiButton>
    </div>

    <!-- Fixierte Aktionsleiste, unabhängig von der Listenlänge. -->
    <div
      v-if="!pending"
      class="bg-card shadow-float safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md flex-col gap-2 px-5 pt-5"
    >
      <UiButton
        v-if="naechstes"
        size="lg"
        @click="navigateTo(`/session/${sessionId}/player`)"
      >
        ▶ {{ naechstes.source_label }} starten: {{ naechstes.exercise?.name }}
      </UiButton>
      <UiButton v-else size="lg" @click="navigateTo(`/session/${sessionId}/fertig`)">
        Training abschließen
      </UiButton>
      <button
        v-if="naechstes"
        type="button"
        class="text-muted pb-1 text-center text-[13px]"
        @click="ueberspringen(naechstes)"
      >
        {{ naechstes.source_label }} überspringen
      </button>
    </div>
  </div>
</template>
