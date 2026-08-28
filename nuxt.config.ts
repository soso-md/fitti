import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-08-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
    },
    // Standard des Moduls sind 8 Stunden — danach ist man ausgeloggt.
    // Ein Jahr ist das Maximum, das Browser für Cookies akzeptieren (400 Tage).
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'Mantis — Fitti',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'description', content: 'Fitti — Training im Blick.' },
        // Ohne diese beiden startet iOS die Verknüpfung im Safari-Fenster
        // statt als eigenständige App.
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Fitti' },
      ],
    },
  },
})
