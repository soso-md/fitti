<script setup lang="ts">
const route = useRoute()
const { load } = useSession()

useHead({ title: 'Geschafft — Fitti' })

const titel = ref('')
const dauer = ref('')
const anzahl = ref(0)

onMounted(async () => {
  const { session, items } = await load(route.params.id as string)
  titel.value = session.title
  anzahl.value = items.filter((i: any) => !i.skipped).length
  if (session.finished_at) {
    const min = Math.round(
      (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000,
    )
    dauer.value = `${min} min`
  }
})
</script>

<template>
  <main
    class="flex min-h-dvh flex-col items-center justify-center gap-3.5 px-6 py-10 text-center"
    style="background: linear-gradient(160deg, var(--color-lavender-300), var(--color-cream-50) 60%)"
  >
    <div class="text-[64px]">🎉</div>
    <h1 class="text-xl">Stark gemacht!</h1>
    <p class="text-ink-soft text-sm">
      {{ titel }}<template v-if="dauer"> · {{ dauer }}</template> · {{ anzahl }} Übungen
    </p>
    <UiButton size="lg" class="mt-5" @click="navigateTo('/')">Fertig</UiButton>
  </main>
</template>
