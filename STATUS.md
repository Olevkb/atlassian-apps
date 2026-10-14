# Status (bijgewerkt 14 oktober 2026)

## openapi-viewer (Confluence-macro)
OpenAPI/Swagger-documentatie tonen in Confluence uit een bijlage van de pagina, met Redoc 2.5; volledig binnen
Atlassian (Runs on Atlassian). Gekozen op 14-10 (zie BESLISSINGEN.md en verkoopklaar/SHOPIFY-ATLASSIAN.md).

**Stand:** project opgezet, nog niet gedeployed.
**Nodig van Ole:** Atlassian-account, gratis developer site (https://go.atlassian.com/cloud-dev), API-token voor
`forge login`, later een Marketplace-partneraccount.

## 14-10: eerste installatie bij Atlassian
- Forge CLI in Oles eigen omgeving (`npm.cmd install -g @forge/cli`; PowerShell blokkeert npm.ps1, daarom npm.cmd en
  het volle pad naar forge.cmd in AppData/Roaming/npm). Ole ingelogd, Developer Space "Lowlands Data",
  app geregistreerd (id 4e289cfc-...), gedeployed (development) en geinstalleerd op Oles developer site.
- Forge meldt: **eligible for Runs on Atlassian** (versie 2.1.0).
- Getest in echt Confluence: bijlage ophalen en tonen werkt op een gepubliceerde pagina, hoogte past zich aan.
- Gevonden: op een nooit gepubliceerde pagina geeft het download-endpoint 404 (concept). Opgelost (tweede deploy):
  uitleg in instellingen en weergave, opslaan blijft mogelijk.
- Nog te testen door Ole: nieuwe pagina direct met macro; zoeken op een endpointnaam (indexering).
