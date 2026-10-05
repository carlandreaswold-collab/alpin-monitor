import Database from 'better-sqlite3';
import path from 'path';
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
}

// ── QUERIES ──

export function insertArticle(a) {
  const db = getDb();
  return db.prepare(`
    INSERT OR IGNORE INTO articles
      (source_id, source_name, country, lang_orig, title_orig, url, pub_date, hash)
    VALUES
      (@source_id, @source_name, @country, @lang_orig, @title_orig, @url, @pub_date, @hash)
  `).run(a);
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
      GROUP_CONCAT(CASE WHEN t.tag_type='athlete' THEN t.tag_value END) as athletes,
      GROUP_CONCAT(CASE WHEN t.tag_type='nation'  THEN t.tag_value END) as nations
    FROM articles a
    LEFT JOIN categorizations c ON c.article_id = a.id
    LEFT JOIN article_tags t    ON t.article_id  = a.id
  `;
  const where = [];
  const params = [];
  if (country) { where.push("a.country = ?"); params.push(country); }
  if (athlete) {
    sql += ` JOIN article_tags ta ON ta.article_id=a.id AND ta.tag_type='athlete' AND ta.tag_value=? `;
    params.push(athlete);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ` GROUP BY a.id ORDER BY a.fetched_at DESC LIMIT ?`;
  params.push(limit);
  return db.prepare(sql).all(...params);
}

export function getCategorized() {
  return getDb().prepare(`
    SELECT a.*, c.category
    FROM categorizations c
    JOIN articles a ON a.id = c.article_id
    ORDER BY c.created_at DESC
  `).all();
}
