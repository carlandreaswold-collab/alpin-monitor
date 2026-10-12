import Database from 'better-sqlite3';
import path from 'path';
import { TRACKED_ATHLETES } from '../config/sources.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/alpin.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id   TEXT NOT NULL,
      source_name TEXT NOT NULL,
      country     TEXT NOT NULL,
      lang_orig   TEXT NOT NULL,
      title_orig  TEXT NOT NULL,
      title_no    TEXT,
      summary_no  TEXT,
      url         TEXT NOT NULL UNIQUE,
      pub_date    TEXT,
      fetched_at  TEXT NOT NULL DEFAULT (datetime('now')),
      translated  INTEGER NOT NULL DEFAULT 0,
      fact_ok     INTEGER,
      fact_notes  TEXT,
      hash        TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_type    TEXT NOT NULL,  -- 'athlete' | 'nation' | 'keyword'
      tag_value   TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_type, tag_value)
    );

    CREATE TABLE IF NOT EXISTS categorizations (
      article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      category    TEXT NOT NULL,  -- sportslig | nyheter | viktig | goy | nerding | kjendis
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (article_id)
    );

    CREATE INDEX IF NOT EXISTS idx_articles_fetched ON articles(fetched_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_source  ON articles(source_id);
    CREATE INDEX IF NOT EXISTS idx_articles_country ON articles(country);
  `);

  // Migrasjoner for nye kolonner
  try { db.exec(`ALTER TABLE articles ADD COLUMN is_duplicate INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { db.exec(`ALTER TABLE articles ADD COLUMN duplicate_of INTEGER`); } catch {}
  // Utøverens nasjonalitet som tag, utledd fra eksisterende utøver-tags (idempotent)
  for (const a of TRACKED_ATHLETES) {
    if (!a.nation) continue;
    db.prepare(`INSERT OR IGNORE INTO article_tags (article_id, tag_type, tag_value)
                SELECT article_id, 'athlete_nation', ? FROM article_tags WHERE tag_type='athlete' AND tag_value=?`)
      .run(a.nation, a.name);
  }
  try { db.exec(`ALTER TABLE articles ADD COLUMN ai_tagged INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_dupof ON articles(duplicate_of)`); } catch {}
  try { db.exec(`ALTER TABLE articles ADD COLUMN spik_no TEXT`); } catch {}
  try { db.exec(`ALTER TABLE articles ADD COLUMN body_text TEXT`); } catch {}
  migratePubDates(db);
}

// pub_date lagres som ISO-8601 (UTC) slik at tekstsortering = tidssortering.
// RSS gir "Sat, 10 Oct 2026 12:47:14 +0000", Atom gir ISO — begge normaliseres her.
export function toIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d.toISOString();
}

// Engangs/idempotent: konverter eldre rader med RFC-822-datoer til ISO
function migratePubDates(db) {
  const rows = db.prepare(`SELECT id, pub_date FROM articles WHERE pub_date IS NOT NULL AND pub_date NOT LIKE '____-__-__T%'`).all();
  if (rows.length === 0) return;
  const upd = db.prepare('UPDATE articles SET pub_date = ? WHERE id = ?');
  db.transaction(() => {
    for (const r of rows) upd.run(toIsoDate(r.pub_date), r.id);
  })();
  console.log(`✓ Migrerte ${rows.length} pub_date-verdier til ISO`);
}

// ── QUERIES ──

export function insertArticle(a) {
  const db = getDb();
  return db.prepare(`
    INSERT OR IGNORE INTO articles
      (source_id, source_name, country, lang_orig, title_orig, url, pub_date, hash)
    VALUES
      (@source_id, @source_name, @country, @lang_orig, @title_orig, @url, @pub_date, @hash)
  `).run({ ...a, pub_date: toIsoDate(a.pub_date) });
}

export function updateTranslation(id, title_no, summary_no) {
  getDb().prepare(`
    UPDATE articles SET title_no=?, summary_no=?, translated=1 WHERE id=?
  `).run(title_no, summary_no, id);
}

export function insertTag(article_id, tag_type, tag_value) {
  try {
    getDb().prepare(`
      INSERT OR IGNORE INTO article_tags (article_id, tag_type, tag_value) VALUES (?,?,?)
    `).run(article_id, tag_type, tag_value);
  } catch {}
}

export function categorize(article_id, category) {
  getDb().prepare(`
    INSERT OR REPLACE INTO categorizations (article_id, category) VALUES (?,?)
  `).run(article_id, category);
}

export function uncategorize(article_id) {
  getDb().prepare(`DELETE FROM categorizations WHERE article_id=?`).run(article_id);
}

export function getRecentArticles({ limit = 60, country, athlete } = {}) {
  const db = getDb();
  let sql = `
    SELECT
      a.*,
      c.category,
      c.created_at as cat_created_at,
      GROUP_CONCAT(CASE WHEN t.tag_type='athlete' THEN t.tag_value END) as athletes,
      GROUP_CONCAT(CASE WHEN t.tag_type='nation'  THEN t.tag_value END) as nations,
      GROUP_CONCAT(DISTINCT CASE WHEN t.tag_type='athlete_nation' THEN t.tag_value END) as athlete_nations,
      (SELECT GROUP_CONCAT(DISTINCT x.source_name) FROM articles x
        WHERE x.duplicate_of = a.id AND x.source_id != a.source_id) as also_sources
    FROM articles a
    LEFT JOIN categorizations c ON c.article_id = a.id
    LEFT JOIN article_tags t    ON t.article_id  = a.id
  `;
  const where = ['a.is_duplicate = 0', "(a.fact_ok = 1 OR a.fact_ok IS NULL)"];
  const params = [];
  // Landsflagg = saker med utøvere fra landet. INT er en kildekategori, ikke et land.
  if (country === 'INT') { where.push("a.country = 'INT'"); }
  else if (country) {
    where.push("EXISTS (SELECT 1 FROM article_tags tn WHERE tn.article_id = a.id AND tn.tag_type = 'athlete_nation' AND tn.tag_value = ?)");
    params.push(country);
  }
  if (athlete) {
    sql += ` JOIN article_tags ta ON ta.article_id=a.id AND ta.tag_type='athlete' AND ta.tag_value=? `;
    params.push(athlete);
  }
  sql += ' WHERE ' + where.join(' AND ');
  sql += ` GROUP BY a.id ORDER BY COALESCE(a.pub_date, strftime('%Y-%m-%dT%H:%M:%fZ', a.fetched_at)) DESC LIMIT ?`;
  params.push(limit);
  return db.prepare(sql).all(...params).map(a => ({
    ...a,
    athlete_nations: a.athlete_nations ? a.athlete_nations.split(',') : [],
    norwegian: !!a.athlete_nations?.split(',').includes('NOR'),
    also_sources: a.also_sources ? a.also_sources.split(',') : [],
  }));
}

export function getUntranslated(limit = 100) {
  return getDb().prepare(`
    SELECT id, lang_orig, title_orig, summary_no AS snippet
    FROM articles
    WHERE translated = 0
    ORDER BY fetched_at DESC
    LIMIT ?
  `).all(limit);
}

export function getUnchecked(limit = 100) {
  return getDb().prepare(`
    SELECT id, title_orig, title_no, summary_no, source_name
    FROM articles
    WHERE translated = 1 AND fact_ok IS NULL
    ORDER BY fetched_at DESC
    LIMIT ?
  `).all(limit);
}

export function updateFactCheck(id, fact_ok, fact_notes) {
  getDb().prepare(`
    UPDATE articles SET fact_ok=?, fact_notes=? WHERE id=?
  `).run(fact_ok, fact_notes, id);
}

export function markDuplicate(id, duplicateOf = null) {
  getDb().prepare(`UPDATE articles SET is_duplicate=1, duplicate_of=? WHERE id=?`).run(duplicateOf, id);
}

export function getUnlinkedDuplicates() {
  return getDb().prepare(`
    SELECT id, title_orig, title_no, source_id, fetched_at FROM articles
    WHERE is_duplicate = 1 AND duplicate_of IS NULL
  `).all();
}

export function getDedupCandidates(sinceIso, untilIso) {
  return getDb().prepare(`
    SELECT id, title_orig, title_no, source_id, fetched_at FROM articles
    WHERE is_duplicate = 0 AND fetched_at >= ? AND fetched_at <= ?
  `).all(sinceIso, untilIso);
}

export function getWithoutSpik(limit = 50) {
  return getDb().prepare(`
    SELECT id, title_no, summary_no, body_text, source_name, url
    FROM articles
    WHERE fact_ok = 1 AND is_duplicate = 0 AND spik_no IS NULL
    ORDER BY fetched_at DESC
    LIMIT ?
  `).all(limit);
}

export function updateSpik(id, spik_no) {
  getDb().prepare(`UPDATE articles SET spik_no=? WHERE id=?`).run(spik_no, id);
}

export function updateBodyText(id, body_text) {
  getDb().prepare(`UPDATE articles SET body_text=? WHERE id=?`).run(body_text, id);
}

export function dismissArticle(id) {
  getDb().prepare(`UPDATE articles SET fact_ok=0, fact_notes='Manuelt avvist' WHERE id=?`).run(id);
}

export function approveArticle(id) {
  getDb().prepare(`UPDATE articles SET fact_ok=1, fact_notes='Manuelt godkjent' WHERE id=?`).run(id);
}

// Redaktørens egne valg, brukt som eksempler i faktasjekk-prompten
export function getFeedbackExamples(rejectLimit = 25, approveLimit = 15) {
  const q = (note, limit) => getDb().prepare(`
    SELECT source_name AS source, COALESCE(title_no, title_orig) AS title
    FROM articles WHERE fact_notes = ?
    ORDER BY id DESC LIMIT ?
  `).all(note, limit);
  return { rejected: q('Manuelt avvist', rejectLimit), approved: q('Manuelt godkjent', approveLimit) };
}

// Alpint-andel per kilde (kun kilder med nok sjekkede saker)
export function getSourceAlpineRates(minChecked = 20) {
  return getDb().prepare(`
    SELECT source_name AS source, COUNT(*) AS checked,
           ROUND(100.0 * SUM(fact_ok = 1) / COUNT(*)) AS rate
    FROM articles WHERE fact_ok IS NOT NULL
    GROUP BY source_name HAVING COUNT(*) >= ?
  `).all(minChecked);
}

export function getAllForFactcheck(limit = 300) {
  return getDb().prepare(`
    SELECT
      a.id, a.source_name, a.country, a.title_no, a.title_orig,
      a.url, a.pub_date, a.fetched_at, a.fact_ok, a.fact_notes, a.is_duplicate
    FROM articles a
    WHERE a.is_duplicate = 0
    ORDER BY COALESCE(a.pub_date, strftime('%Y-%m-%dT%H:%M:%fZ', a.fetched_at)) DESC
    LIMIT ?
  `).all(limit);
}

export function getUnscraped(limit = 60) {
  return getDb().prepare(`
    SELECT id, url
    FROM articles
    WHERE body_text IS NULL
    ORDER BY fetched_at DESC
    LIMIT ?
  `).all(limit);
}

export function getStats() {
  const db = getDb();

  const bySource = db.prepare(`
    SELECT
      source_name,
      country,
      COUNT(*) as total,
      SUM(CASE WHEN fact_ok = 1 THEN 1 ELSE 0 END) as alpine,
      SUM(CASE WHEN fact_ok = 0 THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN fact_ok IS NULL THEN 1 ELSE 0 END) as pending
    FROM articles
    WHERE is_duplicate = 0
    GROUP BY source_name
    ORDER BY total DESC
  `).all();

  const rawDates = db.prepare(`
    SELECT pub_date, fetched_at, fact_ok FROM articles WHERE is_duplicate = 0
  `).all();
  const cutoff = Date.now() - 14 * 86400 * 1000;
  const dayMap = {};
  for (const a of rawDates) {
    const d = new Date(a.pub_date || a.fetched_at);
    if (isNaN(d) || d.getTime() < cutoff) continue;
    const day = d.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { day, total: 0, alpine: 0 };
    dayMap[day].total++;
    if (a.fact_ok === 1) dayMap[day].alpine++;
  }
  const byDay = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM categorizations
    GROUP BY category
    ORDER BY count DESC
  `).all();

  const topAthletes = db.prepare(`
    SELECT t.tag_value as name, COUNT(DISTINCT t.article_id) as count
    FROM article_tags t
    JOIN articles a ON a.id = t.article_id
    WHERE t.tag_type = 'athlete' AND a.fact_ok = 1 AND a.is_duplicate = 0
    GROUP BY t.tag_value
    ORDER BY count DESC
    LIMIT 12
  `).all();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN fact_ok = 1 THEN 1 ELSE 0 END) as alpine,
      SUM(CASE WHEN fact_ok = 0 THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN fact_ok IS NULL THEN 1 ELSE 0 END) as pending
    FROM articles WHERE is_duplicate = 0
  `).get();

  return { bySource, byDay, byCategory, topAthletes, totals };
}

export function getAthletes() {
  return getDb().prepare(`
    SELECT t.tag_value as name, COUNT(DISTINCT t.article_id) as count,
      (SELECT n.tag_value FROM article_tags n
        WHERE n.tag_type = 'athlete_nation' AND n.article_id IN (SELECT article_id FROM article_tags WHERE tag_type='athlete' AND tag_value = t.tag_value)
        GROUP BY n.tag_value ORDER BY COUNT(*) DESC LIMIT 1) as nation
    FROM article_tags t
    JOIN articles a ON a.id = t.article_id
    WHERE t.tag_type = 'athlete'
      AND a.fact_ok = 1
      AND a.is_duplicate = 0
    GROUP BY t.tag_value
    ORDER BY count DESC, t.tag_value ASC
  `).all();
}

// Land som har minst én godkjent sak med utøver derfra
export function getNations() {
  return getDb().prepare(`
    SELECT t.tag_value AS code, COUNT(DISTINCT t.article_id) AS count
    FROM article_tags t JOIN articles a ON a.id = t.article_id
    WHERE t.tag_type = 'athlete_nation' AND a.fact_ok = 1 AND a.is_duplicate = 0
    GROUP BY t.tag_value ORDER BY count DESC, code ASC
  `).all();
}

export function getUntagged(limit = 300) {
  return getDb().prepare(`
    SELECT id, title_orig, title_no, summary_no, body_text FROM articles
    WHERE fact_ok = 1 AND is_duplicate = 0 AND ai_tagged = 0
    ORDER BY COALESCE(pub_date, fetched_at) DESC LIMIT ?
  `).all(limit);
}

// Utøvere vi kjenner fra før (for konsekvent stavemåte): sporede utøvere + de som er tagget, mest brukte først
export function getKnownAthletes(limit = 250) {
  const known = new Map(TRACKED_ATHLETES.filter(a => a.nation).map(a => [a.name, a.nation]));
  const rows = getDb().prepare(`
    SELECT tag_value AS name FROM article_tags WHERE tag_type='athlete'
    GROUP BY tag_value ORDER BY COUNT(*) DESC LIMIT ?
  `).all(limit);
  for (const r of rows) {
    if (known.size >= limit) break;
    const nation = athleteNation(r.name);
    if (nation && !known.has(r.name)) known.set(r.name, nation);
  }
  return [...known].map(([name, nation]) => ({ name, nation }));
}

const ATHLETE_NATION = new Map(); // cache: utøver → land
export function athleteNation(name) {
  if (ATHLETE_NATION.has(name)) return ATHLETE_NATION.get(name);
  const row = getDb().prepare(`
    SELECT n.tag_value AS nation FROM article_tags n
    WHERE n.tag_type='athlete_nation'
      AND n.article_id IN (SELECT article_id FROM article_tags WHERE tag_type='athlete' AND tag_value=?)
    GROUP BY n.tag_value ORDER BY COUNT(*) DESC LIMIT 1`).get(name);
  const nation = row?.nation || null;
  if (nation) ATHLETE_NATION.set(name, nation);
  return nation;
}

// Erstatter utøver- og nasjonstags for én sak med resultatet fra Claude og markerer saken som tagget
export function replaceAthleteTags(articleId, athletes) {
  const db = getDb();
  db.transaction(() => {
    db.prepare(`DELETE FROM article_tags WHERE article_id=? AND tag_type IN ('athlete','athlete_nation')`).run(articleId);
    const ins = db.prepare(`INSERT OR IGNORE INTO article_tags (article_id, tag_type, tag_value) VALUES (?,?,?)`);
    for (const a of athletes) {
      ins.run(articleId, 'athlete', a.name);
      ins.run(articleId, 'athlete_nation', a.nation);
      ATHLETE_NATION.set(a.name, a.nation);
    }
    db.prepare(`UPDATE articles SET ai_tagged=1 WHERE id=?`).run(articleId);
  })();
}

export function getRecentForDedup(hours = 48) {
  return getDb().prepare(`
    SELECT id, title_orig, title_no, source_id, fetched_at
    FROM articles
    WHERE fetched_at >= datetime('now', ?)
      AND is_duplicate = 0
    ORDER BY fetched_at ASC
  `).all(`-${hours} hours`);
}

export function getCategorized() {
  return getDb().prepare(`
    SELECT a.*, c.category
    FROM categorizations c
    JOIN articles a ON a.id = c.article_id
    ORDER BY c.created_at DESC
  `).all();
}
