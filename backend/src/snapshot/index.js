import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/alpin.db')
const REPO_ROOT = path.join(__dirname, '../../..')
const OUT = path.join(REPO_ROOT, 'docs/index.html')

const CATEGORIES = [
  { id: 'viktig',    label: '⚡ Viktig' },
  { id: 'sportslig', label: '🎿 Sportslig' },
  { id: 'nyheter',   label: '📰 Nyhet' },
  { id: 'goy',       label: '😄 Gøy' },
  { id: 'nerding',   label: '🔬 Nerding' },
  { id: 'kjendis',   label: '🌟 Kjendis' },
]

const RACES = [
  { date: '2026-10-24', end: '2026-10-26', venue: 'Sölden',      disciplines: ['GS'] },
  { date: '2026-11-14', end: '2026-11-16', venue: 'Levi',         disciplines: ['SL'] },
  { date: '2026-11-22', end: '2026-11-23', venue: 'Gurgl',        disciplines: ['GS','SL'] },
  { date: '2026-11-28', end: '2026-11-30', venue: 'Beaver Creek', disciplines: ['DH','SG','GS'] },
  { date: '2026-12-05', end: '2026-12-07', venue: 'Killington',   disciplines: ['GS','SL'] },
  { date: '2026-12-12', end: '2026-12-14', venue: "Val d'Isère",  disciplines: ['DH','SG','GS'] },
  { date: '2026-12-19', end: '2026-12-21', venue: 'Courchevel',   disciplines: ['SL','GS'] },
  { date: '2027-01-09', end: '2027-01-12', venue: 'Adelboden',    disciplines: ['GS','SL'] },
  { date: '2027-01-16', end: '2027-01-19', venue: 'Kitzbühel',    disciplines: ['DH','SG','SL'] },
  { date: '2027-01-23', end: '2027-01-25', venue: 'Wengen',       disciplines: ['DH','SL'] },
  { date: '2027-03-12', end: '2027-03-14', venue: 'Kvitfjell',    disciplines: ['DH','SG','GS'] },
  { date: '2027-03-19', end: '2027-03-21', venue: 'Soldeu',       disciplines: ['Finale'] },
]

function buildHtml(articles, updatedAt) {
  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AlpinMonitor — NRK</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Figtree:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#12151c;--surface:#1a1e28;--surface2:#222736;
  --border:#2c3347;--border2:#3a4160;
  --fg:#dde2f0;--fg2:#8892b0;--fg3:#4a5470;
  --viktig:#e05555;--sportslig:#4a9eff;--nyheter:#8892b0;
  --goy:#52c78a;--nerding:#a87ef0;--kjendis:#f0a04a;
}
body{background:var(--bg);color:var(--fg);font-family:'Figtree',sans-serif;font-size:14px;line-height:1.5;min-height:100vh}
a{color:inherit;text-decoration:none}

/* HEADER */
.header{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;padding:0 20px}
.header-top{display:flex;align-items:center;gap:12px;padding:10px 0 6px;flex-wrap:wrap}
.logo{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:.04em}
.logo span{color:var(--sportslig)}
.season{font-size:11px;font-family:'IBM Plex Mono',monospace;color:var(--goy);padding:3px 9px;border:1px solid #52c78a50;border-radius:5px}
.updated{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3);margin-left:auto;white-space:nowrap}
.readonly-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--fg3);padding:2px 7px;border:1px solid var(--border);border-radius:4px}

/* FILTER TABS */
.filter-row{display:flex;align-items:center;gap:0;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px}
.filter-row::-webkit-scrollbar{display:none}
.ftab{font-family:'Figtree',sans-serif;font-size:12px;font-weight:500;padding:7px 14px;color:var(--fg3);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:color .15s,border-color .15s;flex-shrink:0}
.ftab:hover{color:var(--fg2)}
.ftab.active{color:var(--sportslig);border-bottom-color:var(--sportslig)}
.ftab.cat-viktig.active{color:var(--viktig);border-bottom-color:var(--viktig)}
.ftab.cat-sportslig.active{color:var(--sportslig);border-bottom-color:var(--sportslig)}
.ftab.cat-nyheter.active{color:var(--nyheter);border-bottom-color:var(--nyheter)}
.ftab.cat-goy.active{color:var(--goy);border-bottom-color:var(--goy)}
.ftab.cat-nerding.active{color:var(--nerding);border-bottom-color:var(--nerding)}
.ftab.cat-kjendis.active{color:var(--kjendis);border-bottom-color:var(--kjendis)}
.divider{width:1px;height:18px;background:var(--border2);margin:0 4px;flex-shrink:0}
.cbadge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;margin-left:4px;vertical-align:middle}
.cbadge-viktig{background:#e0555530;color:var(--viktig)}
.cbadge-sportslig{background:#4a9eff30;color:var(--sportslig)}
.cbadge-nyheter{background:#8892b030;color:var(--nyheter)}
.cbadge-goy{background:#52c78a30;color:var(--goy)}
.cbadge-nerding{background:#a87ef030;color:var(--nerding)}
.cbadge-kjendis{background:#f0a04a30;color:var(--kjendis)}

/* SEARCH ROW */
.search-row{display:flex;gap:8px;align-items:center;padding:6px 0 6px}
.search-input{flex:1;max-width:300px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 11px;color:var(--fg);font-family:'Figtree',sans-serif;font-size:13px;outline:none}
.search-input:focus{border-color:var(--sportslig)}
.search-input::placeholder{color:var(--fg3)}
.athlete-select{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 10px;color:var(--fg);font-family:'Figtree',sans-serif;font-size:12px;outline:none;cursor:pointer}
.athlete-select:focus{border-color:var(--sportslig)}
.count{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3);white-space:nowrap}

/* LAYOUT */
.main{display:grid;grid-template-columns:1fr 340px;gap:0;max-width:1200px;margin:0 auto;padding:14px 20px 60px;align-items:start}
@media(max-width:900px){.main{grid-template-columns:1fr}.sidebar{display:none}}

/* CARDS */
.card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:11px 14px;margin-bottom:7px}
.card-meta{display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap}
.src{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px}
.src-NOR{background:#52c78a18;color:var(--goy)}
.src-INT,.src-USA{background:#4a9eff18;color:var(--sportslig)}
.src-AUT{background:#e0555518;color:var(--viktig)}
.src-SUI{background:#f0a04a18;color:var(--kjendis)}
.src-SWE,.src-FIN{background:#a87ef018;color:var(--nerding)}
.src-ITA,.src-FRA{background:#4a9eff18;color:var(--sportslig)}
.lang{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3);background:var(--bg);border:1px solid var(--border);padding:1px 5px;border-radius:3px}
.cat-chip{font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:3px}
.cat-viktig{background:#e0555520;color:var(--viktig)}
.cat-sportslig{background:#4a9eff20;color:var(--sportslig)}
.cat-nyheter{background:#8892b020;color:var(--nyheter)}
.cat-goy{background:#52c78a20;color:var(--goy)}
.cat-nerding{background:#a87ef020;color:var(--nerding)}
.cat-kjendis{background:#f0a04a20;color:var(--kjendis)}
.race-chip{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#f0a04a;background:#f0a04a15;border:1px solid #f0a04a40;padding:1px 6px;border-radius:3px}
.time{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3);margin-left:auto}
.card-title{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:600;line-height:1.2;color:var(--fg);display:block;margin-bottom:3px}
.card-title:hover{color:var(--sportslig)}
.card-summary{font-size:12px;color:var(--fg2);margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-spik{display:flex;gap:8px;align-items:baseline;margin-top:7px;padding:7px 10px;background:#4a9eff0d;border-left:2px solid var(--sportslig);border-radius:0 4px 4px 0}
.spik-label{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:500;letter-spacing:.08em;color:var(--sportslig);white-space:nowrap;flex-shrink:0}
.spik-text{font-size:12px;color:var(--fg2);line-height:1.5;font-style:italic}
.empty{text-align:center;padding:60px 0;color:var(--fg3);font-size:13px}

/* SIDEBAR */
.sidebar{position:sticky;top:90px;max-height:calc(100vh - 110px);overflow-y:auto;padding-left:16px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.section-label{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--fg3);padding:0 0 8px;margin-bottom:4px;border-bottom:1px solid var(--border)}
.spik-card{background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:10px 12px;margin-bottom:6px}
.spik-card-meta{display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap}
.spik-card-title{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:600;line-height:1.2;color:var(--fg);display:block;margin-bottom:5px}
.spik-card-title:hover{color:var(--sportslig)}
.spik-card-body{font-size:12px;color:var(--fg2);font-style:italic;line-height:1.5;border-left:2px solid var(--sportslig);padding-left:8px}
.sidebar-empty{font-size:12px;color:var(--fg3);padding:16px 0;text-align:center}
</style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <div class="logo">⛷ Alpin<span>Monitor</span></div>
    <div class="season" id="season-badge"></div>
    <span class="readonly-badge">👁 Lesevisning</span>
    <span class="updated">Oppdatert ${updatedAt}</span>
  </div>
  <div class="filter-row" id="filter-row"></div>
  <div class="search-row">
    <input class="search-input" type="search" id="search" placeholder="Søk i titler, utøvere…">
    <select class="athlete-select" id="athlete-select"><option value="">Alle utøvere</option></select>
    <span class="count" id="count"></span>
  </div>
</div>

<div class="main">
  <div id="feed"></div>
  <div class="sidebar">
    <div class="section-label" id="spik-label">Spik-liste</div>
    <div id="spik-list"></div>
  </div>
</div>

<script>
const CATS = ${JSON.stringify(CATEGORIES)};
const ARTICLES = ${JSON.stringify(articles)};
const RACES = ${JSON.stringify(RACES)};

// Sesongstatus
function seasonStatus() {
  const today = new Date().toISOString().slice(0,10);
  const cur = RACES.find(r => today >= r.date && today <= r.end);
  if (cur) return '🏁 Renn nå — ' + cur.venue;
  const nxt = RACES.find(r => r.date > today);
  if (!nxt) return '⛷ Sesong avsluttet';
  const days = Math.ceil((new Date(nxt.date) - Date.now()) / 86400000);
  if (today >= '2026-10-24' && today <= '2027-03-21') return '⛷ Sesong pågår — ' + nxt.venue + ' om ' + days + ' dager';
  if (days <= 45) return '🎿 Forsesong — ' + nxt.venue + ' om ' + days + ' dager';
  return '💤 Sommerpause';
}
document.getElementById('season-badge').textContent = seasonStatus();

function getRace(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  const s = d.toISOString().slice(0,10);
  return RACES.find(r => s >= r.date && s <= r.end) || null;
}

function fmt(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return '';
  return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + ' kl. ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

// Bygg utøver-liste
const athleteMap = {};
ARTICLES.forEach(a => {
  if (!a.athletes) return;
  a.athletes.split(',').forEach(n => {
    n = n.trim();
    if (n) athleteMap[n] = (athleteMap[n] || 0) + 1;
  });
});
const athleteList = Object.entries(athleteMap).sort((a,b) => b[1]-a[1]).map(([n]) => n);
const athleteEl = document.getElementById('athlete-select');
athleteList.forEach(n => {
  const o = document.createElement('option');
  o.value = n; o.textContent = n;
  athleteEl.appendChild(o);
});

// Kategori-teller
const catCounts = {};
ARTICLES.forEach(a => { if (a.category) catCounts[a.category] = (catCounts[a.category] || 0) + 1; });

// Bygg filter-rad
const COUNTRIES = [
  {code:'',label:'Alle'},
  {code:'NOR',label:'🇳🇴 Norge'},
  {code:'INT',label:'🌐 Internasjonalt'},
  {code:'AUT',label:'🇦🇹 Østerrike'},
  {code:'SUI',label:'🇨🇭 Sveits'},
  {code:'ITA',label:'🇮🇹 Italia'},
  {code:'SWE',label:'🇸🇪 Sverige'},
  {code:'FRA',label:'🇫🇷 Frankrike'},
];

let activeCountry = '';
let activeCat = '';
let searchQ = '';
let activeAthlete = '';

const filterRow = document.getElementById('filter-row');

COUNTRIES.forEach(c => {
  const btn = document.createElement('button');
  btn.className = 'ftab' + (c.code === '' ? ' active' : '');
  btn.dataset.country = c.code;
  btn.textContent = c.label;
  btn.addEventListener('click', () => {
    activeCountry = c.code;
    activeCat = '';
    renderFilterRow();
    render();
  });
  filterRow.appendChild(btn);
});

if (Object.keys(catCounts).length) {
  const div = document.createElement('div');
  div.className = 'divider';
  filterRow.appendChild(div);

  CATS.forEach(cat => {
    const count = catCounts[cat.id] || 0;
    if (!count) return;
    const btn = document.createElement('button');
    btn.className = 'ftab cat-' + cat.id;
    btn.dataset.cat = cat.id;
    btn.innerHTML = cat.label + \`<span class="cbadge cbadge-\${cat.id}">\${count}</span>\`;
    btn.addEventListener('click', () => {
      activeCat = activeCat === cat.id ? '' : cat.id;
      activeCountry = '';
      renderFilterRow();
      render();
    });
    filterRow.appendChild(btn);
  });
}

function renderFilterRow() {
  filterRow.querySelectorAll('.ftab').forEach(b => {
    b.classList.toggle('active',
      (b.dataset.country !== undefined && b.dataset.country === activeCountry && !activeCat) ||
      (b.dataset.cat !== undefined && b.dataset.cat === activeCat)
    );
  });
}

document.getElementById('search').addEventListener('input', e => { searchQ = e.target.value; render(); });
document.getElementById('athlete-select').addEventListener('change', e => { activeAthlete = e.target.value; render(); });

function cardHtml(a, compact) {
  const title = a.title_no || a.title_orig;
  const race = getRace(a.pub_date || a.fetched_at);
  if (compact) {
    return \`<div class="spik-card">
      <div class="spik-card-meta">
        <span class="src src-\${a.country}">\${a.source_name}</span>
        \${a.category ? \`<span class="cat-chip cat-\${a.category}">\${CATS.find(c=>c.id===a.category)?.label||a.category}</span>\` : ''}
        <span class="time">\${fmt(a.pub_date||a.fetched_at)}</span>
      </div>
      <a href="\${a.url}" target="_blank" rel="noopener noreferrer" class="spik-card-title">\${title}</a>
      \${a.spik_no ? \`<div class="spik-card-body">\${a.spik_no}</div>\` : ''}
    </div>\`;
  }
  return \`<div class="card">
    <div class="card-meta">
      <span class="src src-\${a.country}">\${a.source_name}</span>
      \${a.lang_orig && a.lang_orig !== 'no' ? \`<span class="lang">\${a.lang_orig.toUpperCase()} → NO</span>\` : ''}
      \${a.athletes ? \`<span style="font-size:10px;color:var(--sportslig)">👤 \${a.athletes.split(',')[0]}</span>\` : ''}
      \${a.category ? \`<span class="cat-chip cat-\${a.category}">\${CATS.find(c=>c.id===a.category)?.label||a.category}</span>\` : ''}
      \${race ? \`<span class="race-chip">🏁 \${race.venue}</span>\` : ''}
      <span class="time">\${fmt(a.pub_date||a.fetched_at)}</span>
    </div>
    <a href="\${a.url}" target="_blank" rel="noopener noreferrer" class="card-title">\${title}</a>
    \${a.summary_no ? \`<p class="card-summary">\${a.summary_no}</p>\` : ''}
    \${a.spik_no ? \`<div class="card-spik"><span class="spik-label">📻 SPIK</span><span class="spik-text">\${a.spik_no}</span></div>\` : ''}
  </div>\`;
}

function render() {
  const q = searchQ.toLowerCase();
  const visible = ARTICLES.filter(a => {
    if (activeCountry && a.country !== activeCountry) return false;
    if (activeCat && a.category !== activeCat) return false;
    if (activeAthlete && !(a.athletes||'').split(',').map(s=>s.trim()).includes(activeAthlete)) return false;
    if (q && !(a.title_no||a.title_orig||'').toLowerCase().includes(q) && !(a.athletes||'').toLowerCase().includes(q) && !(a.source_name||'').toLowerCase().includes(q)) return false;
    return true;
  });

  document.getElementById('count').textContent = visible.length + ' saker';

  const feed = document.getElementById('feed');
  const uncategorized = visible.filter(a => !a.category);
  feed.innerHTML = uncategorized.length
    ? uncategorized.map(a => cardHtml(a, false)).join('')
    : \`<div class="empty">\${q || activeCountry || activeCat || activeAthlete ? 'Ingen treff' : 'Ingen saker i innboksen'}</div>\`;

  // Spik-liste: vis alle kategoriserte (ufiltrert på land/utøver/søk for sidepanelet, men respekter kategori-filter)
  const spikFilter = activeCat
    ? ARTICLES.filter(a => a.category === activeCat)
    : ARTICLES.filter(a => a.category);

  const spikEl = document.getElementById('spik-list');
  const spikLabel = document.getElementById('spik-label');
  spikLabel.textContent = 'Spik-liste (' + spikFilter.length + ')';

  if (!spikFilter.length) {
    spikEl.innerHTML = '<div class="sidebar-empty">Ingen saker valgt ut ennå</div>';
    return;
  }

  // Grupper etter kategori
  const grouped = {};
  CATS.forEach(c => { grouped[c.id] = []; });
  spikFilter.forEach(a => { if (grouped[a.category]) grouped[a.category].push(a); });

  spikEl.innerHTML = CATS.map(cat => {
    const items = grouped[cat.id];
    if (!items.length) return '';
    return \`<div style="margin-bottom:12px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--\${cat.id === 'goy' ? 'goy' : cat.id});padding:4px 0 6px;border-bottom:1px solid var(--border);margin-bottom:6px">\${cat.label}</div>
      \${items.map(a => cardHtml(a, true)).join('')}
    </div>\`;
  }).join('');
}

render();
</script>
</body>
</html>`
}

export async function generateSnapshot() {
  try {
    const db = new Database(DB_PATH, { readonly: true })

    const articles = db.prepare(`
      SELECT
        a.id, a.source_name, a.country, a.title_no, a.title_orig,
        a.summary_no, a.spik_no, a.url, a.pub_date, a.fetched_at,
        a.lang_orig, c.category,
        GROUP_CONCAT(CASE WHEN t.tag_type='athlete' THEN t.tag_value END) as athletes
      FROM articles a
      LEFT JOIN categorizations c ON c.article_id = a.id
      LEFT JOIN article_tags t ON t.article_id = a.id
      WHERE a.fact_ok = 1 AND a.is_duplicate = 0
      GROUP BY a.id
      ORDER BY COALESCE(a.pub_date, a.fetched_at) DESC
      LIMIT 120
    `).all()

    db.close()

    const updatedAt = new Date().toLocaleString('nb-NO', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })

    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, buildHtml(articles, updatedAt), 'utf8')
    console.log(`✓ Snapshot generert: ${articles.length} saker → docs/index.html`)

    try {
      execSync('git diff --quiet docs/index.html', { cwd: REPO_ROOT })
      console.log('  Ingen endringer i snapshot — skipper push')
    } catch {
      execSync('git add docs/index.html', { cwd: REPO_ROOT })
      execSync(`git commit -m "snapshot: ${updatedAt} (${articles.length} saker)\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, { cwd: REPO_ROOT })
      execSync('git push', { cwd: REPO_ROOT })
      console.log('  Snapshot pushet til GitHub Pages')
    }
  } catch (err) {
    console.error('Snapshot feil:', err.message)
  }
}
