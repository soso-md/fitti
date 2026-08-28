<script setup lang="ts">
/** Pill-Label. Semantische Toene nur als Fuellung, nie als Hintergrund
 *  ganzer Flaechen. */
withDefaults(defineProps<{
  tone?: 'neutral' | 'success' | 'energy' | 'highlight'
}>(), { tone: 'neutral' })

const tones = {
  neutral: 'bg-lavender-100 text-lavender-700',
  success: 'bg-[#E7F6EE] text-mint-600',
  energy: 'bg-[#FBEAE5] text-coral-600',
  highlight: 'bg-[#FDF3D9] text-[#8A6A0E]',
}
</script>

<template>
  <span
    class="rounded-pill inline-flex items-center px-3.5 py-1.5 text-xs font-semibold"
    :class="tones[tone]"
  >
    <slot />
  </span>
</template>
