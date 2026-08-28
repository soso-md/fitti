<script setup lang="ts">
/** Grundflaeche: weiss oder lavendel getoent, grosser Radius, farbiger
 *  Schatten. Nie mit sichtbarem Rand. */
withDefaults(defineProps<{ tint?: boolean }>(), { tint: false })
</script>

<template>
  <div
    class="rounded-lg p-6 shadow-card"
    :class="tint ? 'bg-card-tint' : 'bg-card'"
  >
    <slot />
  </div>
</template>
