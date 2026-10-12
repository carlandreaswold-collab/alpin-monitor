import { getRecentForDedup, markDuplicate, getUnlinkedDuplicates, getDedupCandidates } from '../db/index.js';

// Pass 1: multi-kilde, samme nyhet (tett vindu)
const SHORT_HOURS     = 48;
const SHORT_THRESHOLD = 0.55;
// Pass 2: gjenbruk/resirkulert innhold (lengre vindu, strengere terskel)
const LONG_HOURS      = 7 * 24;
const LONG_THRESHOLD  = 0.72;

const STOP_WORDS = new Set([
  'og', 'av', 'med', 'for', 'til', 'fra', 'ikke', 'er', 'det', 'den', 'de',
  'en', 'ett', 'et', 'the', 'and', 'for', 'in', 'of', 'to', 'a', 'an', 'is',
  'at', 'on', 'by', 'as', 'with', 'from', 'its', 'die', 'der', 'das', 'und',
  'in', 'im', 'bei', 'von', 'mit', 'les', 'des', 'la', 'le', 'un', 'une',
]);

function normalize(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .sort();
}

function jaccard(wordsA, wordsB) {
  const sa = new Set(wordsA);
  const sb = new Set(wordsB);
  const intersection = wordsA.filter(w => sb.has(w)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

function runPass(articles, threshold, duplicates) {
  const normalized = articles.map(a => ({
    ...a,
    words: normalize(a.title_no || a.title_orig),
  }));

  let marked = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (duplicates.has(normalized[i].id)) continue;
    for (let j = i + 1; j < normalized.length; j++) {
      if (duplicates.has(normalized[j].id)) continue;
      const score = jaccard(normalized[i].words, normalized[j].words);
      if (score >= threshold) {
        duplicates.add(normalized[j].id);
        markDuplicate(normalized[j].id, normalized[i].id);
        marked++;
        console.log(
          `  ↳ Duplikat (${score.toFixed(2)}): "${normalized[j].title_orig?.slice(0, 50)}"` +
          ` = "${normalized[i].title_orig?.slice(0, 50)}"`
        );
      }
    }
  }
  return marked;
}

// Gamle duplikater uten kobling: finn originalen. 0 = ingen treff (ikke prøv igjen).
function linkOrphanDuplicates() {
  const orphans = getUnlinkedDuplicates();
  for (const d of orphans) {
    const t = new Date(d.fetched_at.replace(' ', 'T') + 'Z').getTime();
    const iso = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
    const words = normalize(d.title_no || d.title_orig);
    let best = null;
    for (const c of getDedupCandidates(iso(t - LONG_HOURS * 3600e3), iso(t + LONG_HOURS * 3600e3))) {
      const hours = Math.abs(new Date(c.fetched_at.replace(' ', 'T') + 'Z').getTime() - t) / 3600e3;
      const need = hours <= SHORT_HOURS ? SHORT_THRESHOLD : LONG_THRESHOLD;
      const score = jaccard(words, normalize(c.title_no || c.title_orig));
      if (score >= need && (!best || score > best.score)) best = { id: c.id, score };
    }
    markDuplicate(d.id, best ? best.id : 0);
  }
  return orphans.length;
}

export function dedupPending() {
  const duplicates = new Set();
  let total = 0;

  linkOrphanDuplicates();

  // Pass 1: tett vindu, lav terskel
  const short = getRecentForDedup(SHORT_HOURS);
  if (short.length >= 2) total += runPass(short, SHORT_THRESHOLD, duplicates);

  // Pass 2: bredt vindu, høy terskel — fanger gjenbruk over dager/uker
  const long = getRecentForDedup(LONG_HOURS);
  if (long.length >= 2) total += runPass(long, LONG_THRESHOLD, duplicates);

  if (total > 0) console.log(`✓ Dedup: ${total} duplikater merket\n`);
  return total;
}
