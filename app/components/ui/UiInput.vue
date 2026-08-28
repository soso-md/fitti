<script setup lang="ts">
/** Beschriftetes Feld. Der weiche Innenschatten kommt aus den Effekt-Tokens. */
defineProps<{
  label?: string
  type?: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="flex flex-col gap-1.5">
    <span v-if="label" class="text-ink-soft text-sm font-medium">{{ label }}</span>
    <input
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      class="bg-card border-line rounded-md shadow-[inset_0_1px_2px_rgba(33,31,46,0.06)] w-full border px-[18px] py-3.5 text-base outline-none"
    >
  </label>
</template>
