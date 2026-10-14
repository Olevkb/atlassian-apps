# Beslissingen (append-only)

## 2026-10-14 — Start openapi-viewer

- **Keuze (Ole):** OpenAPI-weergave voor Confluence als eerste Atlassian-app, ondanks lage prijzen in deze niche
  ($10–15 per 100 gebruikers per maand). Reden: klanten zoeken er actief naar (vindbaar zonder acquisitie), korte
  bouwtijd, geen serveronderhoud; leert ook het Forge-platform en de Marketplace-procedure.
- **Weergave:** Redoc 2.5 (MIT; zet ook Swagger 2.0 om). Niet Redoc 3: stuurt telemetrie (redoc-opentelemetry).
  Niet Swagger UI: "Try it out" doet verzoeken naar API-servers (gegevens naar buiten).
- **Bron:** bijlage van de Confluence-pagina (versies via Confluence, altijd de nieuwste). Geen URL's (zou egress
  zijn) en in versie 1 geen geplakte specificaties (Atlassian raadt af bestanden in KVS te bewaren; max. 240 KB).
- **Geen backend in versie 1:** alles in de browser via `requestConfluence` (granulaire scopes). Minder kan stuk.
- **Doorzoekbaar:** samenvatting van de API (titel, endpoints, omschrijvingen) als macro-parameter met indexing,
  zodat Confluence-zoeken pagina's op endpointnamen vindt (klacht bij een concurrent).

## 2026-10-14 — Versie 1 gebouwd en getest onder strikte CSP

- **Getest onder Forge-achtige CSP** (`script-src 'self'`, geen workers, geen externe hosts): Redoc rendert. De
  `new Function` in de bundel (Ajv) wordt bij het tonen niet aangeroepen; daarom géén `unsafe-eval` in het manifest.
- **Logo van Redocly:** Redoc laadt een logo van cdn.redoc.ly (geen optie om uit te zetten). Een bouwstap
  (`vite.shared.js`) vervangt alleen dat adres door een leeg ingebouwd plaatje; de tekst "API docs by Redocly" blijft
  (netjes richting de makers). Gemeten: nul verzoeken buiten de eigen bron.
- **Overige externe adressen** in de bundel (json-schema.org, raw.githubusercontent.com, api.redocly.com) zijn
  kenmerken in code, geen verzoeken.
- **Zoekfunctie van Redoc uit:** die gebruikt een web worker uit een blob (niet toegestaan zonder extra CSP); de
  Confluence-zoekfunctie neemt het over via `searchText`.
- **Lettertype:** Atlassians systeemlettertype, zodat de documentatie past bij de rest van de pagina.
- **Geen core-js-polyfill:** Confluence Cloud ondersteunt alleen moderne browsers; scheelt ± 300–480 KB.

## 2026-10-14 — Conceptpagina's

- **Probleem:** Confluence geeft de inhoud van bijlagen op een nooit gepubliceerde pagina (concept) niet aan apps
  (download-endpoint 404; `?status=draft` helpt volgens de community niet). De lijst met bijlagen werkt wel.
- **Oplossing:** bij 404 controleert de app via `/wiki/api/v2/pages/{id}` of de pagina gepubliceerd is. Zo niet: uitleg
  ("verschijnt na publiceren") in plaats van "niet gevonden", en opslaan blijft mogelijk (zoeksamenvatting volgt bij
  opnieuw opslaan na publiceren). De terugval via `downloadLink` is weggehaald: volgens de community weigert Forge
  die paden (401 / path manipulation).
