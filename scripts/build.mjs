// Baut die Website: liest rezepte/*.md, erzeugt dist/ mit recipes.json und den statischen Dateien.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const UNITS = ['kg', 'g', 'ml', 'dl', 'cl', 'l', 'EL', 'TL', 'Prisen', 'Prise', 'Bund', 'Msp.', 'cm', 'Dose', 'Dosen', 'Pck.', 'Becher'];
// Mengen mit diesen Einheiten werden beim Umrechnen nicht verändert.
const FIXED_UNITS = ['Prise', 'Prisen', 'Msp.'];

function parseNumber(s) {
  s = s.trim();
  let total = 0;
  const m = s.match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?$/);
  if (!m) return null;
  if (m[1]) total += parseFloat(m[1].replace(',', '.'));
  if (m[2]) total += FRACTIONS[m[2]];
  return total;
}

export function parseIngredient(line) {
  let text = line.trim();
  let fix = false;
  if (/\(fix\)\s*$/i.test(text)) { fix = true; text = text.replace(/\s*\(fix\)\s*$/i, ''); }
  const m = text.match(/^(\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])(?:\s+|(?=[A-Za-zÄÖÜäöü]))(.*)$/);
  if (!m) return { menge: null, einheit: '', name: text, fix: true };
  const menge = parseNumber(m[1]);
  let rest = m[2];
  let einheit = '';
  for (const u of UNITS) {
    const re = new RegExp('^' + u.replace('.', '\\.') + '(?=\\s|$)');
    if (re.test(rest)) { einheit = u; rest = rest.slice(u.length).trim(); break; }
  }
  if (FIXED_UNITS.includes(einheit)) fix = true;
  return { menge, einheit, name: rest, fix };
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Frontmatter fehlt');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const num = (v) => (v === undefined || v === '' ? null : Number(String(v).replace(',', '.')));

export function parseRecipe(src, slug) {
  const { meta, body } = parseFrontmatter(src);
  const sections = {};
  let current = null;
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) { current = h[1].trim().toLowerCase(); sections[current] = []; continue; }
    if (current) sections[current].push(line);
  }
  const zutaten = [];
  let group = { titel: null, items: [] };
  for (const line of sections['zutaten'] || []) {
    const g = line.match(/^###\s+(.+)$/);
    if (g) { if (group.items.length || group.titel) zutaten.push(group); group = { titel: g[1].trim(), items: [] }; continue; }
    const li = line.match(/^\s*[-*]\s+(.+)$/);
    if (li) group.items.push(parseIngredient(li[1]));
  }
  if (group.items.length) zutaten.push(group);

  const schritte = [];
  for (const line of sections['zubereitung'] || []) {
    const s = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (s) schritte.push(s[1].trim());
    else if (line.trim() && schritte.length) schritte[schritte.length - 1] += ' ' + line.trim();
  }
  const notizen = (sections['notizen'] || []).map((l) => l.match(/^\s*[-*]\s+(.+)$/)).filter(Boolean).map((m) => m[1].trim());

  if (!meta.titel) throw new Error(`${slug}: "titel" fehlt`);
  const portionen = num(meta.portionen) || 2;
  return {
    slug,
    titel: meta.titel,
    kategorie: meta.kategorie || 'Weitere',
    portionen,
    standardportionen: num(meta.standardportionen) || 2,
    einheit: meta.einheit || null,
    portionenHinweis: meta.portionen_hinweis || null,
    kcal: num(meta.kcal),
    protein: num(meta.protein),
    ballaststoffe: num(meta.ballaststoffe),
    zeit: num(meta.zeit),
    zeitHinweis: meta.zeit_hinweis || null,
    tags: list(meta.tags),
    saison: list(meta.saison),
    emoji: meta.emoji || '🍽️',
    bild: meta.bild || null,
    bildKlein: meta.bild || null,
    bildQuelle: null,
    bildsuche: meta.bildsuche || null,
    zutaten,
    schritte,
    notizen,
  };
}

// Sucht ein passendes Foto auf Unsplash. Braucht die Umgebungsvariable UNSPLASH_ACCESS_KEY
// (kostenlos unter unsplash.com/developers). Ohne Schlüssel bleibt der Platzhalter.
async function unsplashPhoto(query, key) {
  const url = 'https://api.unsplash.com/search/photos?' + new URLSearchParams({
    query, orientation: 'landscape', per_page: '1', content_filter: 'high',
  });
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } });
  if (!res.ok) throw new Error(`Unsplash ${res.status} ${res.statusText}`);
  const photo = (await res.json()).results?.[0];
  if (!photo) return null;
  const utm = 'utm_source=rezepte&utm_medium=referral';
  return {
    bild: `${photo.urls.raw}&w=1800&q=80&fit=crop&auto=format`,
    bildKlein: `${photo.urls.raw}&w=800&h=500&q=75&fit=crop&auto=format`,
    bildQuelle: { name: photo.user.name, link: `${photo.user.links.html}?${utm}`, quelle: 'Unsplash', quelleLink: `https://unsplash.com/?${utm}` },
  };
}

async function build() {
  const dir = join(root, 'rezepte');
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const recipes = files.map((f) => parseRecipe(readFileSync(join(dir, f), 'utf8'), f.replace(/\.md$/, '')));
  for (const r of recipes) {
    if (!r.zutaten.length) console.warn(`Warnung: ${r.slug} hat keine Zutaten`);
    if (!r.schritte.length) console.warn(`Warnung: ${r.slug} hat keine Schritte`);
  }
  recipes.sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
  // Bild automatisch finden: bilder/<slug>.jpg|jpeg|png|webp, falls im Rezept kein "bild" angegeben ist.
  const bilder = existsSync(join(root, 'bilder')) ? readdirSync(join(root, 'bilder')) : [];
  for (const r of recipes) {
    if (r.bild) continue;
    const f = bilder.find((b) => /\.(jpe?g|png|webp|avif)$/i.test(b) && b.replace(/\.[^.]+$/, '') === r.slug);
    if (f) r.bild = r.bildKlein = 'bilder/' + f;
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  const ohneBild = recipes.filter((r) => !r.bild);
  if (key && ohneBild.length) {
    let found = 0;
    await Promise.all(ohneBild.map(async (r) => {
      try {
        const photo = await unsplashPhoto(r.bildsuche || r.titel, key);
        if (photo) { Object.assign(r, photo); found++; }
        else console.warn(`Kein Foto gefunden für ${r.slug} ("${r.bildsuche || r.titel}")`);
      } catch (e) {
        console.warn(`Fotosuche fehlgeschlagen für ${r.slug}: ${e.message}`);
      }
    }));
    console.log(`Unsplash: ${found} von ${ohneBild.length} Fotos gefunden`);
  } else if (ohneBild.length) {
    console.log(`${ohneBild.length} Rezepte ohne Bild (UNSPLASH_ACCESS_KEY nicht gesetzt) → Platzhalter`);
  }
  for (const r of recipes) delete r.bildsuche;

  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  cpSync(join(root, 'src'), dist, { recursive: true });
  if (existsSync(join(root, 'bilder'))) cpSync(join(root, 'bilder'), join(dist, 'bilder'), { recursive: true });
  const grundlagen = existsSync(join(root, 'grundlagen.md')) ? readFileSync(join(root, 'grundlagen.md'), 'utf8') : '';
  writeFileSync(join(dist, 'recipes.json'), JSON.stringify({ recipes, grundlagen }));
  console.log(`${recipes.length} Rezepte gebaut → dist/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((e) => { console.error(e); process.exit(1); });
}
