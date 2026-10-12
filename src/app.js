'use strict';

const app = document.getElementById('app');
let DATA = { recipes: [], grundlagen: '' };

// Zustand der Startseite bleibt beim Hin- und Herwechseln erhalten.
const home = { query: '', filters: new Set() };
// Pro Rezept gewählte Portionen (nur für diese Sitzung).
const servingsBySlug = {};
let wakeLock = null;
let cleanup = [];

/* ---------- Piktogramme (Linien-Icons, 24×24, im Stil von Lucide) ---------- */

const ICON_PATHS = {
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  dumbbell: '<path d="M6 6v12M18 6v12M2.5 9v6M21.5 9v6M6 12h12"/>',
  wheat: '<path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/>',
  sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  snowflake: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  chefHat: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.46.32-.84.73-1.04a4 4 0 0 0-2.13-7.59 5 5 0 0 0-9.19 0 4 4 0 0 0-2.13 7.59c.41.2.72.58.72 1.04V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7M19 12H5"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  coffee: '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
  soup: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"/><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"/><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"/>',
  drumstick: '<path d="M15.4 15.63a7.88 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23"/><path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59"/>',
  fish: '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/>',
  beef: '<circle cx="12.5" cy="8.5" r="2.5"/><path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z"/><path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
};
const icon = (name, cls = '') =>
  `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.utensils}</svg>`;

/* ---------- Hilfsfunktionen ---------- */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function storageGet(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* egal */ }
}

function currentSeason(d = new Date()) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'Frühling';
  if (m >= 6 && m <= 8) return 'Sommer';
  if (m >= 9 && m <= 11) return 'Herbst';
  return 'Winter';
}
const SEASON = currentSeason();
const SEASON_ICON = { Frühling: 'sprout', Sommer: 'sun', Herbst: 'leaf', Winter: 'snowflake' }[SEASON];

// Piktogramm pro Kategorie für Rezepte ohne Foto.
const CATEGORY_ICON = {
  'Frühstück': 'coffee',
  'Suppen': 'soup',
  'Poulet & Truten': 'drumstick',
  'Fisch': 'fish',
  'Fleisch': 'beef',
  'Backen': 'wheat',
};
const PLACEHOLDER = {
  'Frühstück': ['#f6e7c8', '#efc98f'],
  'Suppen': ['#f8dcc4', '#eaa979'],
  'Poulet & Truten': ['#e4ecd2', '#b8cf8f'],
  'Fisch': ['#d6e6ef', '#9cc3d8'],
  'Fleisch': ['#efd6d0', '#d39a8c'],
  'Backen': ['#eee1cf', '#cfb08a'],
};
function media(r, eager = false) {
  if (r.bild) {
    const src = eager ? r.bild : (r.bildKlein || r.bild);
    const q = r.bildQuelle;
    const credit = eager && q
      ? `<span class="credit">Foto: <a href="${esc(q.link)}" target="_blank" rel="noopener">${esc(q.name)}</a> / <a href="${esc(q.quelleLink)}" target="_blank" rel="noopener">${esc(q.quelle)}</a></span>`
      : '';
    return `<div class="media"><img src="${esc(src)}" alt="${esc(r.titel)}" ${eager ? '' : 'loading="lazy"'} decoding="async">${credit}</div>`;
  }
  const [a, b] = PLACEHOLDER[r.kategorie] || ['#dfe9e1', '#b5cfbd'];
  return `<div class="media"><div class="placeholder" style="--ph: linear-gradient(135deg, ${a}, ${b})">${icon(CATEGORY_ICON[r.kategorie] || 'utensils')}</div></div>`;
}

const fmtTime = (min) => (min >= 60 ? `${Math.floor(min / 60)} Std.${min % 60 ? ' ' + (min % 60) + ' Min.' : ''}` : `${min} Min.`);
const isQuick = (r) => r.zeit && r.zeit <= 30;
const inSeason = (r) => r.saison.includes(SEASON);

/* ---------- Mengen umrechnen ---------- */

const GLYPH = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
function fmtFraction(v) {
  const whole = Math.floor(v + 1e-9);
  const frac = Math.round((v - whole) * 4) / 4;
  if (frac === 1) return String(whole + 1);
  if (!frac) return String(whole);
  return (whole ? whole : '') + GLYPH[frac];
}
const fmtDecimal = (v) => String(Math.round(v * 10) / 10).replace('.', ',');

function roundTo(v, step) { return Math.max(step, Math.round(v / step) * step); }

function formatQty(v, unit) {
  if (v == null) return { qty: '', unit };
  if (unit === 'g' || unit === 'ml') {
    if (unit === 'ml' && v >= 1000) return { qty: fmtDecimal(v / 1000), unit: 'l' };
    if (unit === 'g' && v >= 1000) return { qty: fmtDecimal(v / 1000), unit: 'kg' };
    const step = v >= 100 ? 10 : v >= 20 ? 5 : v >= 5 ? 1 : 0.5;
    return { qty: fmtDecimal(roundTo(v, step)), unit };
  }
  if (unit === 'l' && v < 1) return { qty: fmtDecimal(v * 10), unit: 'dl' };
  if (unit === 'dl' && v >= 10) return { qty: fmtDecimal(v / 10), unit: 'l' };
  if (['kg', 'l', 'dl', 'cl'].includes(unit)) return { qty: fmtDecimal(v), unit };
  // EL, TL, Bund, Stückzahlen …
  const step = v < 2 ? 0.25 : v < 10 ? 0.5 : 1;
  return { qty: fmtFraction(roundTo(v, step)), unit };
}

// Einzahl/Mehrzahl für Stückzahlen ohne Einheit.
const PLURALS = [
  ['Knoblauchzehe', 'Knoblauchzehen'], ['Frühlingszwiebel', 'Frühlingszwiebeln'], ['Zwiebel', 'Zwiebeln'],
  ['Karotte', 'Karotten'], ['Birne', 'Birnen'], ['Limette', 'Limetten'], ['Zitrone', 'Zitronen'],
  ['Schalotte', 'Schalotten'], ['Ei', 'Eier'], ['Apfel', 'Äpfel'], ['Lorbeerblatt', 'Lorbeerblätter'],
  ['Gewürznelke', 'Gewürznelken'], ['Wacholderbeere', 'Wacholderbeeren'], ['Entenbrust', 'Entenbrüste'],
  ['Salatgurke', 'Salatgurken'], ['Reispapierblatt', 'Reispapierblätter'], ['Blatt', 'Blätter'],
  ['Kürbis', 'Kürbisse'], ['Tomate', 'Tomaten'], ['Kartoffel', 'Kartoffeln'], ['Paprika', 'Paprika'],
];
function fixNumber(name, value) {
  const cut = name.search(/[,(]/);
  const head = cut >= 0 ? name.slice(0, cut) : name;
  const tail = cut >= 0 ? name.slice(cut) : '';
  const plural = value > 1;
  for (const [sg, pl] of PLURALS) {
    const from = plural ? sg : pl;
    const to = plural ? pl : sg;
    const re = new RegExp(`(?<![\\p{L}-])${from}(?![\\p{L}])`, 'u');
    const reEnd = new RegExp(`-${from}(?![\\p{L}])`, 'u'); // z. B. Baby-Boo-Kürbis
    if (re.test(head)) return head.replace(re, to) + tail;
    if (reEnd.test(head)) return head.replace(reEnd, '-' + to) + tail;
    if (new RegExp(`(?<![\\p{L}])${to}(?![\\p{L}])`, 'u').test(head)) return name;
  }
  return name;
}

function scaleItem(item, factor) {
  if (item.menge == null) return { qty: '', unit: '', name: item.name };
  const v = item.fix ? item.menge : item.menge * factor;
  const f = item.fix ? { qty: fmtFraction(v), unit: item.einheit } : formatQty(v, item.einheit);
  const name = item.einheit ? item.name : fixNumber(item.name, v);
  return { qty: f.qty, unit: f.unit, name };
}
const qtyText = (s) => [s.qty, s.unit].filter(Boolean).join(' ');

/* ---------- Startseite ---------- */

const FILTERS = [
  { id: 'Hauptmahlzeit', label: 'Hauptmahlzeit' },
  { id: 'Frühstück', label: 'Frühstück' },
  { id: 'Suppe', label: 'Suppen' },
  { id: 'Dessert', label: 'Dessert' },
  { id: 'Backen', label: 'Brot & Backen' },
  { id: 'Geflügel', label: 'Poulet & Truten' },
  { id: 'Fisch', label: 'Fisch' },
  { id: 'Fleisch', label: 'Fleisch' },
  { id: 'Vegetarisch', label: 'Vegetarisch' },
  { id: '_saison', label: 'Saisonal', icon: SEASON_ICON },
  { id: '_schnell', label: 'Schnell (bis 30 Min.)', icon: 'zap' },
];

function matchesFilter(r, id) {
  if (id === '_saison') return inSeason(r);
  if (id === '_schnell') return isQuick(r);
  return r.tags.includes(id) || r.kategorie === id;
}

function searchText(r) {
  if (!r._search) {
    const ings = r.zutaten.flatMap((g) => g.items.map((i) => i.name)).join(' ');
    r._search = norm([r.titel, r.kategorie, r.tags.join(' '), r.saison.join(' '), ings].join(' '));
  }
  return r._search;
}

function filtered() {
  const words = norm(home.query).split(/\s+/).filter(Boolean);
  return DATA.recipes.filter((r) =>
    [...home.filters].every((f) => matchesFilter(r, f)) &&
    words.every((w) => searchText(r).includes(w)));
}

function card(r) {
  const facts = [
    r.zeit ? `${icon('clock')}${fmtTime(r.zeit)}` : '',
    r.protein ? `${icon('dumbbell')}${r.protein} g Protein` : '',
    r.kcal ? `${r.kcal} kcal` : '',
  ].filter(Boolean).map((f) => `<span>${f}</span>`).join('');
  return `<a class="card" href="#/rezept/${encodeURIComponent(r.slug)}">
    ${media(r)}
    <div class="body">
      <span class="kat">${esc(r.kategorie)}</span>
      <h2>${esc(r.titel)}</h2>
      <div class="facts">${facts}</div>
    </div>
  </a>`;
}

function renderHome() {
  document.title = 'Rezepte';
  const available = FILTERS.filter((f) => DATA.recipes.some((r) => matchesFilter(r, f.id)));
  app.innerHTML = `<div class="wrap">
    <section class="home-head">
      <h1>Gesund kochen, viel Protein.</h1>
      <p>${DATA.recipes.length} Rezepte · salzarm, ohne Rahm · standardmässig für 2 Portionen</p>
    </section>
    <div class="search" role="search">
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="Rezept oder Zutat suchen …" value="${esc(home.query)}" autocomplete="off" aria-label="Rezepte durchsuchen">
      <button class="clear" type="button" aria-label="Suche leeren" ${home.query ? '' : 'hidden'}>${icon('x')}</button>
    </div>
    <div class="chips" role="group" aria-label="Filter">
      ${available.map((f) => `<button class="chip" type="button" data-f="${esc(f.id)}" aria-pressed="${home.filters.has(f.id)}">${f.icon ? icon(f.icon) : ''}${esc(f.label)}</button>`).join('')}
    </div>
    <div class="result-info" aria-live="polite"></div>
    <div class="grid"></div>
  </div>`;

  const input = app.querySelector('#q');
  const clear = app.querySelector('.clear');
  const grid = app.querySelector('.grid');
  const info = app.querySelector('.result-info');

  const update = () => {
    const list = filtered();
    grid.innerHTML = list.length ? list.map(card).join('') : '<p class="empty">Keine Rezepte gefunden. Versuch es mit einem anderen Suchbegriff oder weniger Filtern.</p>';
    const active = home.query || home.filters.size;
    info.innerHTML = active ? `${list.length} von ${DATA.recipes.length} Rezepten <button type="button" class="reset">Zurücksetzen</button>` : '';
    clear.hidden = !home.query;
  };

  input.addEventListener('input', () => { home.query = input.value; update(); });
  clear.addEventListener('click', () => { home.query = ''; input.value = ''; input.focus(); update(); });
  app.querySelector('.chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const id = b.dataset.f;
    home.filters.has(id) ? home.filters.delete(id) : home.filters.add(id);
    b.setAttribute('aria-pressed', home.filters.has(id));
    update();
  });
  info.addEventListener('click', (e) => {
    if (!e.target.closest('.reset')) return;
    home.query = ''; home.filters.clear(); input.value = '';
    app.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    update();
  });
  update();
}

/* ---------- Rezeptseite ---------- */

function ingredientKeys(name) {
  // Nomen (grossgeschrieben) als Suchschlüssel; Präfix, damit "Knoblauchzehen" auch "Knoblauch" trifft.
  const head = name.split(/[,(]/)[0];
  return (head.match(/\p{Lu}[\p{L}-]{2,}/gu) || []).map((w) => norm(w.split('-').pop()).slice(0, 6)).filter((w) => w.length >= 3);
}
function ingredientsForStep(r, step) {
  const text = norm(step);
  const words = text.match(/[a-zß]+/g) || [];
  const found = [];
  for (const g of r.zutaten) {
    for (const item of g.items) {
      const keys = ingredientKeys(item.name);
      if (keys.some((k) => words.some((w) => w.startsWith(k) || (w.length >= 5 && k.startsWith(w))))) found.push(item);
    }
  }
  return found;
}

function servingLabel(r, n) {
  if (r.einheit) return r.einheit === 'Brot' ? (n === 1 ? 'Brot' : 'Brote') : r.einheit;
  return n === 1 ? 'Portion' : 'Portionen';
}

function renderRecipe(slug, mode) {
  const r = DATA.recipes.find((x) => x.slug === slug);
  if (!r) {
    app.innerHTML = `<div class="wrap"><p class="loading">Dieses Rezept gibt es nicht. <a href="#/">Zur Übersicht</a></p></div>`;
    return;
  }
  document.title = `${r.titel} · Rezepte`;
  if (servingsBySlug[slug] == null) servingsBySlug[slug] = r.standardportionen;
  mode = mode || storageGet('modus', 'normal');
  let cookStep = 0;

  const stats = [
    r.zeit ? `<span class="stat">${icon('clock')}<b>${fmtTime(r.zeit)}</b></span>` : '',
    r.kcal ? `<span class="stat">${icon('flame')}<b>${r.kcal}</b> kcal</span>` : '',
    r.protein ? `<span class="stat">${icon('dumbbell')}<b>${r.protein} g</b> Protein</span>` : '',
    r.ballaststoffe ? `<span class="stat">${icon('wheat')}<b>${r.ballaststoffe} g</b> Ballaststoffe</span>` : '',
  ].join('');
  const statNote = [
    r.einheit ? r.portionenHinweis : `Nährwerte pro Portion (geschätzt)${r.portionenHinweis ? ' · ' + r.portionenHinweis : ''}`,
    r.zeitHinweis ? `Zeit ${r.zeitHinweis}` : '',
  ].filter(Boolean).join(' · ');

  app.innerHTML = `
    <div class="hero${r.bild ? ' has-img' : ''}">${media(r, true)}<a class="back" href="#/">${icon('arrowLeft')}Alle Rezepte</a></div>
    <div class="wrap">
      <header class="recipe-head">
        <span class="kat">${esc(r.kategorie)}</span>
        <h1>${esc(r.titel)}</h1>
        <div class="stats">${stats}</div>
        <p class="stat-note">${esc(statNote)}</p>
      </header>
      <div class="controls">
        <div class="servings">
          <label for="servings">Für</label>
          <div class="stepper">
            <button type="button" data-d="-1" aria-label="Weniger">−</button>
            <input id="servings" type="number" inputmode="numeric" min="1" max="50" value="${servingsBySlug[slug]}">
            <button type="button" data-d="1" aria-label="Mehr">+</button>
          </div>
          <span class="unit"></span>
        </div>
        <div class="toggle" role="group" aria-label="Ansicht">
          <button type="button" data-mode="normal" aria-pressed="${mode === 'normal'}">${icon('book')}Normal</button>
          <button type="button" data-mode="kochen" aria-pressed="${mode === 'kochen'}">${icon('chefHat')}Kochmodus</button>
        </div>
      </div>
      <div id="content"></div>
    </div>`;

  const input = app.querySelector('#servings');
  const unit = app.querySelector('.unit');
  const content = app.querySelector('#content');
  const minus = app.querySelector('[data-d="-1"]');
  const factor = () => servingsBySlug[slug] / r.portionen;

  function ingredientList() {
    return r.zutaten.map((g) => `
      ${g.titel ? `<h3>${esc(g.titel)}</h3>` : ''}
      <ul>${g.items.map((it) => {
        const s = scaleItem(it, factor());
        return `<li><span class="qty">${esc(qtyText(s))}</span><span>${inline(s.name)}</span></li>`;
      }).join('')}</ul>`).join('');
  }

  function renderNormal() {
    content.innerHTML = `<div class="recipe-body">
      <section class="panel ingredients" aria-labelledby="h-zut">
        <h2 class="section" id="h-zut">Zutaten</h2>
        ${ingredientList()}
      </section>
      <div>
        <section class="panel" aria-labelledby="h-zub">
          <h2 class="section" id="h-zub">Zubereitung</h2>
          <ol class="steps">${r.schritte.map((s) => `<li>${inline(s)}</li>`).join('')}</ol>
        </section>
        ${r.notizen.length ? `<section class="panel notes" style="margin-top:20px" aria-labelledby="h-not">
          <h2 class="section" id="h-not">Notizen</h2>
          <ul>${r.notizen.map((n) => `<li>${inline(n)}</li>`).join('')}</ul>
        </section>` : ''}
        <div class="tags">${[...r.tags, ...r.saison.filter((s) => s !== 'ganzjährig')].map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>`;
    content.querySelectorAll('.ingredients li').forEach((li) => li.addEventListener('click', () => li.classList.toggle('done')));
  }

  function renderCook() {
    const total = r.schritte.length;
    const done = cookStep >= total;
    const pct = Math.round((Math.min(cookStep + (done ? 0 : 1), total) / total) * 100);
    let card;
    if (done) {
      card = `<div class="cook-card cook-done"><div class="big">${icon('check')}</div><div class="text">Fertig! En Guete.</div></div>`;
    } else {
      const step = r.schritte[cookStep];
      const ings = [...new Set(ingredientsForStep(r, step).map((it) => {
        const s = scaleItem(it, factor());
        return `<li>${qtyText(s) ? `<b>${esc(qtyText(s))}</b> ` : ''}${inline(s.name.split(',')[0])}</li>`;
      }))];
      card = `<div class="cook-card">
        <div class="num">Schritt ${cookStep + 1} von ${total}</div>
        <div class="text">${inline(step)}</div>
        ${ings.length ? `<div class="cook-ings"><h3>Zutaten in diesem Schritt</h3><ul>${ings.join('')}</ul></div>` : ''}
      </div>`;
    }
    content.innerHTML = `<div class="cook">
      <div class="cook-progress" aria-hidden="true"><div style="width:${done ? 100 : pct}%"></div></div>
      <div class="cook-meta">
        <span class="wakelock">${wakeLock ? icon('sun') + 'Bildschirm bleibt an' : ''}</span>
        <button type="button" class="show-ings">Alle Zutaten</button>
      </div>
      ${card}
      <div class="cook-nav">
        <button type="button" class="prev" ${cookStep === 0 ? 'disabled' : ''}>${icon('arrowLeft')}Zurück</button>
        ${done
          ? '<button type="button" class="primary restart">Von vorne</button>'
          : `<button type="button" class="primary next">${cookStep === total - 1 ? 'Fertig' + icon('check') : 'Weiter' + icon('arrowRight')}</button>`}
      </div>
    </div>`;
    content.querySelector('.prev').addEventListener('click', () => go(-1));
    content.querySelector('.next')?.addEventListener('click', () => go(1));
    content.querySelector('.restart')?.addEventListener('click', () => { cookStep = 0; renderCook(); });
    content.querySelector('.show-ings').addEventListener('click', showIngredientSheet);

    const cardEl = content.querySelector('.cook-card');
    let x0 = null;
    cardEl.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    cardEl.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    });
  }

  function go(d) {
    const next = Math.max(0, Math.min(r.schritte.length, cookStep + d));
    if (next === cookStep) return;
    cookStep = next;
    renderCook();
    const top = content.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) content.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function showIngredientSheet() {
    const bd = document.createElement('div');
    bd.className = 'sheet-backdrop';
    bd.innerHTML = `<div class="sheet ingredients" role="dialog" aria-modal="true" aria-label="Zutaten">
      <div class="sheet-head"><h2 class="section" style="margin:0">Zutaten · ${servingsBySlug[slug]} ${esc(servingLabel(r, servingsBySlug[slug]))}</h2><button type="button" aria-label="Schliessen">${icon('x')}</button></div>
      ${ingredientList()}
    </div>`;
    const close = () => { bd.remove(); document.removeEventListener('keydown', onEsc); };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('.sheet-head button')) close(); });
    bd.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => li.classList.toggle('done')));
    document.addEventListener('keydown', onEsc);
    document.body.appendChild(bd);
    bd.querySelector('.sheet-head button').focus();
  }

  function renderContent() {
    const n = servingsBySlug[slug];
    unit.textContent = servingLabel(r, n);
    minus.disabled = n <= 1;
    app.classList.toggle('cooking', mode === 'kochen');
    if (mode === 'kochen') { renderCook(); requestWakeLock(); } else { renderNormal(); releaseWakeLock(); }
  }

  function setServings(n) {
    n = Math.max(1, Math.min(50, Math.round(Number(n)) || r.standardportionen));
    servingsBySlug[slug] = n;
    input.value = n;
    renderContent();
  }

  app.querySelectorAll('.stepper button').forEach((b) => b.addEventListener('click', () => setServings(servingsBySlug[slug] + Number(b.dataset.d))));
  input.addEventListener('change', () => setServings(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

  app.querySelector('.toggle').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    storageSet('modus', mode);
    app.querySelectorAll('.toggle button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.mode === mode));
    renderContent();
  });

  const onKey = (e) => {
    if (mode !== 'kochen' || e.target.matches('input') || document.querySelector('.sheet-backdrop')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };
  document.addEventListener('keydown', onKey);
  const onVisible = () => { if (document.visibilityState === 'visible' && mode === 'kochen') requestWakeLock(); };
  document.addEventListener('visibilitychange', onVisible);
  cleanup.push(() => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisible);
    document.querySelector('.sheet-backdrop')?.remove();
    releaseWakeLock();
  });

  renderContent();
}

// Bildschirm im Kochmodus anlassen (wo der Browser es unterstützt).
async function requestWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; updateWakeLabel(); });
    updateWakeLabel();
  } catch { wakeLock = null; }
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
function updateWakeLabel() {
  const el = document.querySelector('.wakelock');
  if (el) el.innerHTML = wakeLock ? icon('sun') + 'Bildschirm bleibt an' : '';
}

/* ---------- Grundlagen ---------- */

function renderGrundlagen() {
  document.title = 'Grundlagen · Rezepte';
  const html = DATA.grundlagen.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('# ')) return `<h1>${esc(b.slice(2))}</h1>`;
    return `<p>${inline(b)}</p>`;
  }).join('');
  app.innerHTML = `<div class="wrap"><article class="prose">${html}</article></div>`;
}

/* ---------- Hell / Dunkel ---------- */

const themeButton = document.querySelector('.theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : systemDark.matches;
}
function applyTheme() {
  const dark = isDark();
  document.documentElement.classList.toggle('is-dark', dark);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#171a17' : '#f6f3ee';
  themeButton.setAttribute('aria-label', dark ? 'Helles Design einschalten' : 'Dunkles Design einschalten');
  themeButton.title = dark ? 'Helles Design' : 'Dunkles Design';
}
themeButton.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('theme', next);
  applyTheme();
});
systemDark.addEventListener('change', applyTheme);
applyTheme();

/* ---------- Routing ---------- */

function route() {
  cleanup.forEach((fn) => fn());
  app.classList.remove('cooking');
  cleanup = [];
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const m = hash.match(/^\/rezept\/([^/]+)(?:\/(kochen))?$/);
  if (m) renderRecipe(m[1], m[2]);
  else if (hash === '/grundlagen') renderGrundlagen();
  else renderHome();
  window.scrollTo(0, 0);
  if (m) app.focus({ preventScroll: true });
}

fetch('recipes.json')
  .then((r) => r.json())
  .then((d) => { DATA = d; route(); window.addEventListener('hashchange', route); })
  .catch(() => { app.innerHTML = '<p class="loading">Die Rezepte konnten nicht geladen werden.</p>'; });
