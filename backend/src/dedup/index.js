import { getRecentForDedup, markDuplicate } from '../db/index.js';

const JACCARD_THRESHOLD = 0.55;
const WINDOW_HOURS = 48;

// Korte ord som ikke er meningsbærende i titler
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

export function dedupPending() {
  const articles = getRecentForDedup(WINDOW_HOURS);
  if (articles.length < 2) return 0;

  // Forhåndsberegn normaliserte titler
  const normalized = articles.map(a => ({
    ...a,
    words: normalize(a.title_no || a.title_orig),
  }));

  const duplicates = new Set();
  let marked = 0;

  for (let i = 0; i < normalized.length; i++) {
    if (duplicates.has(normalized[i].id)) continue;

    for (let j = i + 1; j < normalized.length; j++) {
      if (duplicates.has(normalized[j].id)) continue;

      const score = jaccard(normalized[i].words, normalized[j].words);
      if (score >= JACCARD_THRESHOLD) {
        // Behold den eldste (lavest id / tidligst fetched_at), marker den nyeste
        duplicates.add(normalized[j].id);
        markDuplicate(normalized[j].id);
        marked++;
        console.log(
          `  ↳ Duplikat (${score.toFixed(2)}): "${normalized[j].title_orig?.slice(0, 50)}"` +
          ` = "${normalized[i].title_orig?.slice(0, 50)}"`
        );
      }
    }
  }

  if (marked > 0) console.log(`✓ Dedup: ${marked} duplikater merket\n`);
  return marked;
}
