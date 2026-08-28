<script setup lang="ts">
import type { PlanRow } from '~/composables/usePlans'

const route = useRoute()
const { get } = usePlans()

const plan = ref<PlanRow | null>(null)
const pending = ref(true)

useHead({ title: () => `${plan.value?.name ?? 'Plan'} — Fitti` })

onMounted(async () => {
  plan.value = await get(route.params.id as string)
  pending.value = false
})
</script>

<template>
  <main class="mx-auto min-h-dvh max-w-md px-5 pt-7 pb-10">
    <NuxtLink to="/plan" class="text-muted mb-2 block py-2 text-sm">‹ Zurück</NuxtLink>
    <h1 class="mb-4 text-xl">Plan bearbeiten</h1>
    <PlanForm v-if="!pending && plan" :plan="plan" @gespeichert="navigateTo('/plan')" />
    <p v-else-if="!pending" class="text-muted text-sm">Diesen Plan gibt es nicht.</p>
  </main>
</template>
