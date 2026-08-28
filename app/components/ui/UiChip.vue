<script setup lang="ts">
/** Auswahl-Pille. Aktiv ist Lavender-300, sonst Kartenweiss. */
withDefaults(defineProps<{ active?: boolean, dashed?: boolean }>(), {
  active: false,
  dashed: false,
})
</script>

<template>
  <button
    type="button"
    class="rounded-pill press px-3.5 py-2.5 text-sm"
    :class="dashed
      ? 'text-ink-soft border border-dashed border-line-strong'
      : active ? 'bg-lavender-300 shadow-card' : 'bg-card shadow-card'"
  >
    <slot />
  </button>
</template>
