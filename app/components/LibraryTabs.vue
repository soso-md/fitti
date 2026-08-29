<script setup lang="ts">
/**
 * Reiter der Bibliothek. Hier wird definiert, woraus Trainings bestehen --
 * die vier Ebenen bauen aufeinander auf: Übungen bilden Blöcke, Blöcke und
 * Übungen bilden Workouts. Sportarten stehen daneben, sie gehören zum
 * freien Training.
 */
const route = useRoute()

const tabs = [
  { label: 'Übungen', to: '/uebungen' },
  { label: 'Blöcke', to: '/bloecke' },
  { label: 'Workouts', to: '/workouts' },
  { label: 'Sportarten', to: '/sportarten' },
]

const aktiv = (to: string) => route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <!-- Scrollt seitlich, damit die vier Reiter auf 375 px nicht umbrechen
       oder schrumpfen muessen. -->
  <div class="-mx-5 overflow-x-auto px-5">
    <div class="flex w-max gap-2">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="rounded-pill shadow-card px-4 py-2 text-sm whitespace-nowrap"
        :class="aktiv(t.to) ? 'bg-lavender-300 font-semibold' : 'bg-card'"
      >
        {{ t.label }}
      </NuxtLink>
    </div>
  </div>
</template>
