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
  <!-- Der Verlauf ist laut Guidelines dem Einstieg vorbehalten, sonst flaches Creme. -->
  <main
    class="flex min-h-dvh flex-col justify-center gap-4 px-6 py-11"
    style="background: linear-gradient(160deg, var(--color-lavender-200), var(--color-cream-50) 55%)"
  >
    <div class="mx-auto w-full max-w-sm">
      <div class="mb-6 text-center">
        <!-- Kein Logo im Handoff — die Wortmarke im Display-Serif steht dafür. -->
        <h1 class="text-3xl">Fitti</h1>
        <p class="text-ink-soft mt-1 text-sm">Kleine Schritte. Echter Fortschritt.</p>
      </div>

      <UiCard v-if="confirmationSent">
        <p class="text-ink-soft text-sm">
          Wir haben dir eine Bestätigungsmail geschickt. Öffne den Link darin,
          dann geht es weiter.
        </p>
      </UiCard>

      <form v-else class="flex flex-col gap-4" @submit.prevent="submit">
        <UiInput
          v-model="email"
          label="E-Mail"
          type="email"
          placeholder="du@beispiel.de"
          autocomplete="email"
          required
        />
        <UiInput
          v-model="password"
          label="Passwort"
          type="password"
          :placeholder="isSignUp ? 'Mind. 8 Zeichen' : '••••••••'"
          :autocomplete="isSignUp ? 'new-password' : 'current-password'"
          required
        />

        <p v-if="error" class="text-coral-600 text-sm">{{ error }}</p>

        <UiButton type="submit" variant="dark" size="lg" :disabled="pending">
          {{ isSignUp ? 'Registrieren' : 'Anmelden' }}
        </UiButton>

        <button
          type="button"
          class="text-muted text-center text-sm"
          @click="mode = isSignUp ? 'signin' : 'signup'"
        >
          {{ isSignUp ? 'Zurück zum Login' : 'Noch kein Konto? Registrieren' }}
        </button>
      </form>
    </div>
  </main>
</template>
