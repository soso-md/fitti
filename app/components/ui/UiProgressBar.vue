<script setup lang="ts">
/** Fortschritt. Zahlen laut Guidelines immer mit Bezug: "3/5 diese Woche". */
const props = withDefaults(defineProps<{
  value: number
  max?: number
  label?: string
  tone?: 'primary' | 'success' | 'energy'
}>(), { max: 100, tone: 'primary' })

const pct = computed(() =>
  Math.max(0, Math.min(100, (props.value / props.max) * 100)),
)

const tones = {
  primary: 'bg-accent',
  success: 'bg-success',
  energy: 'bg-energy',
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="label"
      class="text-ink-soft mb-2 flex justify-between text-sm"
    >
      <span>{{ label }}</span>
      <span>{{ value }}/{{ max }}</span>
    </div>
    <div class="rounded-pill bg-lavender-100 h-2.5 overflow-hidden">
      <div
        class="rounded-pill h-full transition-[width] duration-[360ms] ease-out-soft"
        :class="tones[tone]"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>
