<script setup lang="ts">
useHead({ title: 'Heute — Fitti' })

const user = useSupabaseUser()
const { planned, recent, doneThisWeek, pending } = useToday()
const { startFromWorkout } = useSession()

const starting = ref<string | null>(null)
const error = ref<string | null>(null)

const wochentag = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(new Date())

/** Der Teil vor dem @ ist als Anrede besser als die ganze Adresse. */
const anrede = computed(() => user.value?.email?.split('@')[0] ?? '')

async function starten(workoutId: string, planId: string) {
  starting.value = workoutId
  error.value = null
  try {
    const id = await startFromWorkout(workoutId, planId)
    await navigateTo(`/session/${id}`)
  }
  catch (e: any) {
    error.value = e?.message ?? 'Das Training konnte nicht starten.'
    starting.value = null
  }
}
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-32">
    <h1 class="text-xl">Hallo, {{ anrede }}</h1>
    <p class="text-ink-soft mt-1 text-sm">Heute ist {{ wochentag }}</p>

    <p v-if="error" class="text-coral-600 mt-4 text-sm">{{ error }}</p>

    <h2 class="mt-5 font-sans text-base font-semibold">Heute geplant</h2>

    <p v-if="pending" class="text-muted mt-2 text-sm">Einen Moment …</p>

    <UiCard v-else-if="!planned.length" class="mt-2">
      <p class="text-ink-soft text-sm">
        Für heute steht nichts an. Leg einen Plan an oder logg ein freies
        Training.
      </p>
    </UiCard>

    <div v-else class="mt-2 flex flex-col gap-2.5">
      <UiCard v-for="p in planned" :key="p.workout_id">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate font-semibold">{{ p.workout_name }}</div>
            <div class="text-ink-soft truncate text-[13px]">{{ p.meta }}</div>
          </div>
          <UiButton
            size="sm"
            :disabled="starting === p.workout_id"
            @click="starten(p.workout_id, p.plan_id)"
          >
            {{ starting === p.workout_id ? '…' : 'Starten' }}
          </UiButton>
        </div>
      </UiCard>
    </div>

    <UiCard class="mt-5">
      <UiProgressBar
        :value="doneThisWeek"
        :max="5"
        label="Workouts diese Woche"
        tone="success"
      />
    </UiCard>

    <template v-if="recent.length">
      <h2 class="mt-6 font-sans text-base font-semibold">Zuletzt</h2>
      <div class="mt-2 flex flex-col gap-2.5">
        <UiCard v-for="r in recent" :key="r.id">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate font-semibold">{{ r.title }}</div>
              <div class="text-ink-soft text-[13px]">{{ r.meta }}</div>
            </div>
            <UiTag>Training</UiTag>
          </div>
        </UiCard>
      </div>
    </template>

    <NuxtLink
      to="/frei"
      class="text-lavender-600 mt-5 block text-center text-sm font-semibold"
    >
      + Freies Training loggen
    </NuxtLink>

    <AppBottomNav />
  </main>
</template>
