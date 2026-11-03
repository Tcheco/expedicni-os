# Expediční OS – klikací prototyp

Next.js 15 (MIT), React 19 (MIT), Leaflet 1.9 (BSD-2), mapové podklady OpenStreetMap (ODbL, s uvedením zdroje).
Žádné závislosti pod GPL/AGPL.

Testovací data generuje `lib/data.ts` (50 aut a řidičů, ~1 400 zásilek, dopravci simulovaně). Stav se drží v prohlížeči (localStorage), tlačítko „Nová data“ vše vygeneruje znovu.

Role (přepínání přes #hash): `#admin` (ranní přehled včerejška, úkoly), `#dispecer` (zásilky, přiřazení, automatické plánování, mapa vozů), `#ridic` (mobilní pohled řidiče), `#klient` (portál klienta s časovou osou).

## Spuštění
    npm install
    npm run dev     # http://localhost:3000
    npm run build   # statický export do ./out

## Náhled jako Claude Artifact
    npm run build && node scripts-artifact.mjs out
Vznikne `out/artifact.html` a `out/assets/`. V artefaktu se nenačtou mapové dlaždice OSM (bezpečnostní pravidla), vozy a zásilky se ukážou na prázdném podkladu s popisky měst. Na běžném hostingu (např. Vercel) mapa funguje plně.
