<script setup lang="ts">
useHead({ title: 'Anmelden — Fitti' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const pending = ref(false)
const error = ref<string | null>(null)
const confirmationSent = ref(false)

watchEffect(() => {
  if (user.value) navigateTo('/')
})

watch(mode, () => {
  error.value = null
})

const isSignUp = computed(() => mode.value === 'signup')

/** Supabase antwortet auf Englisch — die geläufigen Fälle übersetzen. */
function translate(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'E-Mail oder Passwort stimmt nicht.'],
    [/email not confirmed/i, 'Bestätige zuerst den Link in deiner Bestätigungsmail.'],
    [/user already registered|already been registered/i, 'Für diese E-Mail gibt es schon ein Konto. Melde dich an.'],
    [/password should be at least (\d+)/i, 'Das Passwort braucht mindestens $1 Zeichen.'],
    [/unable to validate email|invalid email/i, 'Diese E-Mail-Adresse sieht nicht gültig aus.'],
    [/rate limit|too many requests/i, 'Zu viele Versuche. Warte einen Moment.'],
  ]
  for (const [pattern, text] of map) {
    if (pattern.test(message)) return message.replace(pattern, text)
  }
  return message
}

async function submit() {
  if (!email.value.trim() || !password.value) return
  pending.value = true
  error.value = null

  const credentials = { email: email.value.trim(), password: password.value }

  if (isSignUp.value) {
    const { data, error: err } = await supabase.auth.signUp({
      ...credentials,
      options: { emailRedirectTo: `${window.location.origin}/confirm` },
    })
    pending.value = false
    if (err) {
      error.value = translate(err.message)
      return
    }
    // Ist die E-Mail-Bestätigung im Projekt aktiv, kommt noch keine Session zurück.
    if (!data.session) confirmationSent.value = true
    return
  }

  const { error: err } = await supabase.auth.signInWithPassword(credentials)
  pending.value = false
  if (err) error.value = translate(err.message)
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
    <h1 class="text-2xl font-semibold tracking-tight">Fitti</h1>

    <p v-if="confirmationSent" class="text-ink-soft text-sm">
      Wir haben dir eine Bestätigungsmail geschickt. Öffne den Link darin.
    </p>

    <form v-else class="flex flex-col gap-3" @submit.prevent="submit">
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="E-Mail"
        required
        class="border-line rounded-card border px-4 py-3"
      >
      <input
        v-model="password"
        type="password"
        :autocomplete="isSignUp ? 'new-password' : 'current-password'"
        placeholder="Passwort"
        required
        class="border-line rounded-card border px-4 py-3"
      >

      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>

      <button
        type="submit"
        :disabled="pending"
        class="bg-accent rounded-card px-4 py-3 text-white disabled:opacity-60"
      >
        {{ isSignUp ? 'Konto anlegen' : 'Anmelden' }}
      </button>

      <button
        type="button"
        class="text-ink-soft text-sm underline underline-offset-4"
        @click="mode = isSignUp ? 'signin' : 'signup'"
      >
        {{ isSignUp ? 'Ich habe schon ein Konto' : 'Neues Konto anlegen' }}
      </button>
    </form>
  </main>
</template>
