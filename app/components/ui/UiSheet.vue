<script setup lang="ts">
/**
 * Bottom-Sheet. Faehrt von unten ein, Klick auf das Overlay schliesst.
 * Die Hoehe ist gedeckelt, damit der Griff zum Schliessen erreichbar
 * bleibt; der Inhalt scrollt darin.
 */
defineProps<{ title?: string }>()
const offen = defineModel<boolean>({ required: true })

// Hintergrund nicht mitscrollen lassen, solange das Sheet offen ist.
watch(offen, (o) => {
  if (import.meta.client) document.body.style.overflow = o ? 'hidden' : ''
})
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="offen"
        class="fixed inset-0 z-40 flex items-end"
        style="background: rgba(33, 31, 46, 0.45)"
        @click="offen = false"
      >
        <div
          class="bg-card safe-bottom max-h-[75dvh] w-full overflow-y-auto rounded-t-xl p-5"
          @click.stop
        >
          <h2 v-if="title" class="mb-3 font-sans text-base font-semibold">{{ title }}</h2>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
