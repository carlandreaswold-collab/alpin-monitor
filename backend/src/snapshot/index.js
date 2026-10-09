import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/alpin.db')
const REPO_ROOT = path.join(__dirname, '../../../..')
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
.header{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;padding:0 20px}
.header-top{display:flex;align-items:center;gap:12px;padding:10px 0 8px;flex-wrap:wrap}
.logo{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;letter-spacing:.04em}
.logo span{color:var(--sportslig)}
.season{font-size:11px;font-family:'IBM Plex Mono',monospace;color:var(--goy);padding:3px 9px;border:1px solid #52c78a50;border-radius:5px}
.updated{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3);margin-left:auto;white-space:nowrap}
.readonly-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--fg3);padding:2px 7px;border:1px solid var(--border);border-radius:4px}
.controls{display:flex;gap:0;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:4px 20px 0}
.controls::-webkit-scrollbar{display:none}
.ctrl-btn{font-family:'Figtree',sans-serif;font-size:12px;font-weight:500;padding:7px 14px;color:var(--fg3);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:color .15s,border-color .15s}
.ctrl-btn:hover{color:var(--fg2)}
.ctrl-btn.active{color:var(--sportslig);border-bottom-color:var(--sportslig)}
.search-wrap{padding:8px 0 4px;display:flex;gap:8px;align-items:center}
.search-input{flex:1;max-width:340px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:6px 12px;color:var(--fg);font-family:'Figtree',sans-serif;font-size:13px;outline:none}
.search-input:focus{border-color:var(--sportslig)}
.search-input::placeholder{color:var(--fg3)}
.count{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--fg3)}
.feed{max-width:760px;margin:0 auto;padding:16px 20px 60px}
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
  <div class="controls">
    <button class="ctrl-btn active" data-filter="">Alle</button>
    <button class="ctrl-btn" data-filter="NOR">🇳🇴 Norge</button>
    <button class="ctrl-btn" data-filter="INT">🌐 Internasjonalt</button>
    <button class="ctrl-btn" data-filter="AUT">🇦🇹 Østerrike</button>
    <button class="ctrl-btn" data-filter="SUI">🇨🇭 Sveits</button>
    <button class="ctrl-btn" data-filter="ITA">🇮🇹 Italia</button>
    <button class="ctrl-btn" data-filter="SWE">🇸🇪 Sverige</button>
    <button class="ctrl-btn" data-filter="FRA">🇫🇷 Frankrike</button>
  </div>
  <div class="search-wrap">
    <input class="search-input" type="search" id="search" placeholder="Søk i titler, utøvere…">
    <span class="count" id="count"></span>
  </div>
</div>

<div class="feed" id="feed"></div>

<script>
const CATS = ${JSON.stringify(Object.fromEntries(CATEGORIES.map(c => [c.id, c.label])))};
const ARTICLES = ${JSON.stringify(articles)};
const RACES = ${JSON.stringify(RACES)};

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
  const today = d.toISOString().slice(0,10);
  return RACES.find(r => today >= r.date && today <= r.end) || null;
}

function fmt(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return '';
  return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + ' kl. ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

let activeFilter = '';
let searchQ = '';

function render() {
  const feed = document.getElementById('feed');
  const q = searchQ.toLowerCase();
  const visible = ARTICLES.filter(a => {
    if (activeFilter && a.country !== activeFilter) return false;
    if (q && !(a.title_no||a.title_orig||'').toLowerCase().includes(q) && !(a.athletes||'').toLowerCase().includes(q) && !(a.source_name||'').toLowerCase().includes(q)) return false;
    return true;
  });
  document.getElementById('count').textContent = visible.length + ' saker';
  if (!visible.length) { feed.innerHTML = '<div class="empty">Ingen saker</div>'; return; }
  feed.innerHTML = visible.map(a => {
    const title = a.title_no || a.title_orig;
    const cat = a.category;
    const race = getRace(a.pub_date || a.fetched_at);
    return \`<div class="card">
      <div class="card-meta">
        <span class="src src-\${a.country}">\${a.source_name}</span>
        \${a.lang_orig && a.lang_orig !== 'no' ? \`<span class="lang">\${a.lang_orig.toUpperCase()} → NO</span>\` : ''}
        \${a.athletes ? \`<span style="font-size:10px;color:var(--sportslig)">👤 \${a.athletes.split(',')[0]}</span>\` : ''}
        \${cat ? \`<span class="cat-chip cat-\${cat}">\${CATS[cat]||cat}</span>\` : ''}
        \${race ? \`<span class="race-chip">🏁 \${race.venue}</span>\` : ''}
        <span class="time">\${fmt(a.pub_date || a.fetched_at)}</span>
      </div>
      <a href="\${a.url}" target="_blank" rel="noopener noreferrer" class="card-title">\${title}</a>
      \${a.summary_no ? \`<p class="card-summary">\${a.summary_no}</p>\` : ''}
      \${a.spik_no ? \`<div class="card-spik"><span class="spik-label">📻 SPIK</span><span class="spik-text">\${a.spik_no}</span></div>\` : ''}
    </div>\`;
  }).join('');
}

document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

document.getElementById('search').addEventListener('input', e => {
  searchQ = e.target.value;
  render();
});

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

    // Git commit + push kun hvis filen er endret
    try {
      execSync('git diff --quiet docs/index.html', { cwd: REPO_ROOT })
      console.log('  Ingen endringer i snapshot — skipper push')
    } catch {
      // git diff returnerer exit 1 = endringer finnes
      execSync('git add docs/index.html', { cwd: REPO_ROOT })
      execSync(`git commit -m "snapshot: ${updatedAt} (${articles.length} saker)\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, { cwd: REPO_ROOT })
      execSync('git push', { cwd: REPO_ROOT })
      console.log('  Snapshot pushet til GitHub Pages')
    }
  } catch (err) {
    console.error('Snapshot feil:', err.message)
  }
}
