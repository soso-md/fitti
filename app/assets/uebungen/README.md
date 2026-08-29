# Übungs-Illustrationen

Dateien hier ablegen (`svg`, `png`, `jpg`, `webp`), Dateiname klein und ohne
Umlaute, z. B. `beinpresse.svg`. Nach einem Neustart des Dev-Servers stehen sie
im Übungsformular zur Auswahl.

In der Datenbank landet nur der Dateiname, nicht der Pfad — Vite hängt beim
Bauen einen Hash an, die Auflösung passiert in `app/utils/illustrationen.ts`.

SVG passt am besten zum Design: scharf auf jedem Display, wenige Kilobyte, und
die Linienstärke lässt sich an die Lucide-Icons angleichen (2 px, runde Enden).
