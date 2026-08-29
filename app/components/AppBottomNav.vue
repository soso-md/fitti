<script setup lang="ts">
/**
 * Schwebendes Milchglas-Dock. Laut Guidelines nie eine durchgehende
 * Tab-Bar und nie deckend -- der Blur muss zeigen, was darunter liegt.
 */
const route = useRoute()

const items = [
  { key: 'home', label: 'Heute', to: '/', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { key: 'plan', label: 'Plan', to: '/plan', d: 'M3 3v18h18M8 17V9m5 8V5m5 12v-5' },
  {
    key: 'exercises', label: 'Bibliothek', to: '/uebungen',
    d: 'M6.5 6.5l11 11M4 9l5-5M15 20l5-5',
    // Die Bibliothek hat vier Reiter unter eigenen Pfaden -- alle sollen
    // dasselbe Symbol hervorheben.
    auch: ['/bloecke', '/workouts', '/sportarten'],
  },
  { key: 'stats', label: 'Stats', to: '/stats', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2' },
]

const active = computed(() =>
  items.find(i => i.to !== '/'
    && [i.to, ...(i.auch ?? [])].some(p => route.path.startsWith(p)))?.key ?? 'home',
)
</script>

<template>
  <nav class="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-4">
    <div
      class="rounded-pill pointer-events-auto flex w-fit items-center gap-2 border border-white/25 px-3.5 py-2.5 shadow-float"
      style="background: rgba(33, 31, 46, 0.45); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%)"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.to"
        :aria-label="item.label"
        :aria-current="active === item.key ? 'page' : undefined"
        class="flex size-11 items-center justify-center rounded-full transition-colors duration-[120ms]"
        :class="active === item.key ? 'bg-white/90 text-ink-900' : 'text-cream-50'"
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
        >
          <path :d="item.d" />
        </svg>
      </NuxtLink>
    </div>
  </nav>
</template>
