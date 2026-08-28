<script setup lang="ts">
useHead({ title: 'Anmeldung …' })

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/')
})
</script>

<template>
  <p class="text-muted p-6 text-center text-sm">Einen Moment, du wirst angemeldet …</p>
</template>
