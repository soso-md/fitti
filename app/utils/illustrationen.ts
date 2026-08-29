/**
 * Kuratierte Übungs-Illustrationen.
 *
 * Dateien liegen in `app/assets/uebungen/` und werden von Vite eingesammelt --
 * eine neue Datei dort taucht nach dem Neustart von selbst im Formular auf,
 * ohne dass hier eine Liste gepflegt werden muss. Vite haengt beim Bauen einen
 * Hash an den Dateinamen, deshalb speichert die Datenbank nur den Dateinamen
 * ("beinpresse.svg") und die Aufloesung passiert erst beim Anzeigen.
 */
const dateien = import.meta.glob('~/assets/uebungen/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** Dateiname ohne Pfad -> ausgelieferte URL. */
const nachName: Record<string, string> = Object.fromEntries(
  Object.entries(dateien).map(([pfad, url]) => [pfad.split('/').pop()!, url]),
)

export const ILLUSTRATIONEN = Object.keys(nachName).sort()

/**
 * Macht aus dem gespeicherten Wert eine anzeigbare URL. Externe Links und
 * absolute Pfade gehen unveraendert durch -- so bleibt ein manuell gesetztes
 * `image_url` weiter gueltig.
 */
export function illustration(wert: string | null | undefined): string | null {
  if (!wert) return null
  if (/^(https?:)?\/\//.test(wert) || wert.startsWith('/')) return wert
  return nachName[wert] ?? null
}
