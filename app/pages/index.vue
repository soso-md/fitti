<script setup lang="ts">
useHead({ title: 'Heute — Fitti' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function abmelden() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
    <header>
      <h1 class="text-2xl">Heute</h1>
      <p class="text-ink-soft mt-1 text-sm">{{ user?.email }}</p>
    </header>

    <UiCard>
      <p class="text-ink-soft text-sm">
        Das Grundgerüst steht: Nuxt 4, Supabase-Auth, Tailwind 4 mit den
        Fitti-Tokens. Die Screens aus dem Handoff kommen als Nächstes.
      </p>
      <div class="mt-4 flex gap-2">
        <UiTag>Kraft</UiTag>
        <UiTag tone="success">Reha</UiTag>
        <UiTag tone="energy">Cardio</UiTag>
      </div>
    </UiCard>

    <UiCard tint>
      <UiProgressBar :value="3" :max="5" label="Workouts diese Woche" />
    </UiCard>

    <div class="flex flex-wrap gap-3">
      <UiButton>Training starten</UiButton>
      <UiButton variant="secondary">Frei loggen</UiButton>
      <UiButton variant="ghost" @click="abmelden">Abmelden</UiButton>
    </div>
  </main>
</template>
