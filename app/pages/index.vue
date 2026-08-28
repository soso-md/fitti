<script setup lang="ts">
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
      <h1 class="text-2xl font-semibold tracking-tight">Fitti</h1>
      <p class="text-ink-soft mt-1 text-sm">
        Angemeldet als {{ user?.email }}
      </p>
    </header>

    <div class="border-line rounded-card border p-4">
      <p class="text-ink-soft text-sm">
        Grundgerüst steht: Nuxt 4, Supabase-Auth, Tailwind v4.
        Das Design kommt aus dem Handoff.
      </p>
    </div>

    <button
      class="text-ink-soft self-start text-sm underline underline-offset-4"
      @click="abmelden"
    >
      Abmelden
    </button>
  </main>
</template>
