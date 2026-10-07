import Parser from 'rss-parser';
import crypto from 'crypto';
import { SOURCES, TRACKED_ATHLETES, NATIONS } from '../config/sources.js';
import { insertArticle, insertTag, getDb } from '../db/index.js';
import { translatePending } from '../translate/index.js';
import { factCheckPending } from '../factcheck/index.js';
import { dedupPending } from '../dedup/index.js';
import { generateSpiks } from '../spik/index.js';

const parser = new Parser({ timeout: 10000, headers: { 'User-Agent': 'NRK-AlpinMonitor/1.0' } });

function makeHash(url, title) {
  return crypto.createHash('sha256').update(url + title).digest('hex').slice(0, 16);
}

function tagAthletes(text, articleId) {
  for (const name of TRACKED_ATHLETES) {
    if (text.includes(name)) insertTag(articleId, 'athlete', name);
    // Fornavn alene (f.eks. «Shiffrin», «Odermatt»)
    const lastName = name.split(' ').pop();
    if (lastName.length > 4 && text.includes(lastName)) insertTag(articleId, 'athlete', name);
  }
}

function tagNations(text, articleId) {
  for (const [code, variants] of Object.entries(NATIONS)) {
    if (variants.some(v => text.includes(v))) insertTag(articleId, 'nation', code);
  }
}

async function fetchSource(source) {
  try {
    const feed = await parser.parseURL(source.url);
    let newCount = 0;

    for (const item of feed.items.slice(0, 20)) {
      const title = (item.title || '').trim();
      const url   = (item.link  || '').trim();
      if (!title || !url) continue;

      const hash = makeHash(url, title);
      const result = insertArticle({
        source_id:   source.id,
        source_name: source.name,
        country:     source.country,
        lang_orig:   source.lang,
        title_orig:  title,
        url,
        pub_date:    item.pubDate || item.isoDate || null,
        hash,
      });

      if (result.changes > 0) {
        newCount++;
        const text = [title, item.contentSnippet || '', item.content || ''].join(' ');
        tagAthletes(text, result.lastInsertRowid);
        tagNations(text,  result.lastInsertRowid);
      }
    }

    console.log(`[${source.id}] ${newCount} nye saker`);
    return newCount;
  } catch (err) {
    console.error(`[${source.id}] Feil: ${err.message}`);
    return 0;
  }
}

export async function fetchAll(emitter) {
  console.log(`\n⛷  Henter fra ${SOURCES.length} kilder — ${new Date().toLocaleTimeString('no')}`);
  let total = 0;
  for (const source of SOURCES) {
    const n = await fetchSource(source);
    total += n;
    if (n > 0 && emitter) emitter.emit('new_articles', { source: source.name, count: n });
  }
  console.log(`✓ Ferdig — ${total} nye saker totalt\n`);
  if (total > 0) {
    await translatePending();
    await factCheckPending();
    dedupPending();
    await generateSpiks();
  }
  return total;
}

// Kan kjøres direkte: node src/fetcher/index.js
if (process.argv[1].includes('fetcher')) {
  import('dotenv').then(m => m.default.config());
  getDb(); // init DB
  fetchAll().catch(console.error);
}
