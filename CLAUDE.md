# Atlassian-apps: werkafspraken

Begin elke sessie met **STATUS.md**. Keuzes met reden in **BESLISSINGEN.md** (append-only). Onderzoek en keuze:
`C:\Users\olevk\projecten\verkoopklaar\SHOPIFY-ATLASSIAN.md`.

## Afspraken
- Communicatie met Ole in het Nederlands; app-teksten (listing, UI) in het Engels.
- Commit en push alleen als Ole erom vraagt.
- "Runs on Atlassian": geen gegevens naar buiten (geen `permissions.external`), alleen Atlassian-opslag en -rekenkracht.
- Geen persoonsgegevens verzamelen; geen analytics naar derden.

## Techniek
- Node.js 24 (winget), Forge CLI 14 (`npm i -g @forge/cli`; draait in PowerShell, niet in Git Bash).
- Per app een map met `manifest.yml`, `src/` (backend, indien nodig) en `static/app` (Vite + React, Custom UI).
- In `static/app`: `npm test` (vitest), `npm run build` (bouwt `build/viewer` en `build/config`),
  `npm run dev` (lokale voorbeeldweergave met nagebootste Forge-bridge).
