// Připraví statický export pro zveřejnění jako Claude Artifact (stránka bez vlastní kostry dokumentu).
import fs from 'node:fs';
const out = process.argv[2] ?? 'out';
let h = fs.readFileSync(`${out}/index.html`, 'utf8');
h = h.replace(/<!DOCTYPE html>/i, '').replace(/<html[^>]*>/, '').replace('<head>', '').replace('</head>', '').replace('<body>', '').replace('</body></html>', '');

// title musí být na začátku souboru (prvních 8 KB)
const t = h.match(/<title>[^<]*<\/title>/)[0];
h = t + h.replace(t, '');
h = h.replace(/<script src="[^"]*polyfills[^"]*" noModule=""><\/script>/, ''); // starší prohlížeče nepotřebujeme
fs.writeFileSync(`${out}/artifact.html`, h);
console.log('ok', h.length);

// služba artefaktů nepovoluje cesty začínající "_", proto _next -> assets
fs.rmSync(`${out}/assets`, { recursive: true, force: true });
fs.cpSync(`${out}/_next`, `${out}/assets`, { recursive: true });
const fix = (f, fn) => fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8')));
fix(`${out}/artifact.html`, (s) => s.replaceAll('./_next/', './assets/').replaceAll('/_next/', '/assets/'));
for (const f of fs.readdirSync(`${out}/assets/static/chunks`)) if (f.startsWith('webpack')) fix(`${out}/assets/static/chunks/${f}`, (s) => s.replaceAll('"./_next/"', '"./assets/"'));
for (const f of fs.readdirSync(`${out}/assets/static/css`)) fix(`${out}/assets/static/css/${f}`, (s) => s.replaceAll('url(_next/static/media/', 'url(../media/'));
console.log('assets ok');
