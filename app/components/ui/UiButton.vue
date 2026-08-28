<script setup lang="ts">
/**
 * Knopf aus dem Design System. Immer Pill-Form, Press-State schrumpft auf
 * 97 % — laut Guidelines ist Bewegung das Feedback, nicht ein Farbwechsel.
 */
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
})

const variants = {
  primary: 'bg-accent text-on-accent',
  secondary: 'bg-card-tint text-accent-strong',
  ghost: 'bg-transparent text-ink border border-line-strong',
  dark: 'bg-inverse text-on-inverse',
}

const sizes = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-[26px] py-3.5 text-base',
  lg: 'px-8 py-[18px] text-md',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="press rounded-pill font-semibold disabled:cursor-not-allowed disabled:opacity-45"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
