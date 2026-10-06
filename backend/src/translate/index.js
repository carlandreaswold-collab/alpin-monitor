import Anthropic from '@anthropic-ai/sdk';
import { getUntranslated, updateTranslation } from '../db/index.js';

const client = new Anthropic();
const BATCH_SIZE = 20;

const LANG_NAMES = {
  en: 'English', de: 'German', fr: 'French', it: 'Italian',
  es: 'Spanish', sl: 'Slovenian', sv: 'Swedish', fi: 'Finnish',
};

async function translateBatch(articles) {
  const items = articles.map(a => ({
    id: a.id,
    lang: LANG_NAMES[a.lang_orig] || a.lang_orig,
    title: a.title_orig,
    snippet: a.snippet || '',
  }));

  const prompt = `Translate these alpine skiing news articles to Norwegian (bokmål).
Return ONLY a JSON array — no markdown, no explanation.

For each article, return:
- id: same as input
- title_no: Norwegian headline (concise, journalistic)
- summary_no: 1–2 sentence Norwegian summary (max 40 words). If no snippet, base it on the title only.

Input:
${JSON.stringify(items, null, 2)}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text.trim();
  // Strip potential markdown code fence
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

export async function translatePending() {
  const untranslated = getUntranslated();
  if (untranslated.length === 0) return 0;

  console.log(`\n🌐 Oversetter ${untranslated.length} artikler med Haiku...`);
  let total = 0;

  // Norwegian articles need no translation — copy title directly
  const norwegian = untranslated.filter(a => a.lang_orig === 'no');
  for (const a of norwegian) {
    updateTranslation(a.id, a.title_orig, '');
    total++;
  }

  // All other languages go to Claude Haiku in batches
  const foreign = untranslated.filter(a => a.lang_orig !== 'no');
  for (let i = 0; i < foreign.length; i += BATCH_SIZE) {
    const batch = foreign.slice(i, i + BATCH_SIZE);
    try {
      const results = await translateBatch(batch);
      for (const r of results) {
        updateTranslation(r.id, r.title_no, r.summary_no);
        total++;
      }
      console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} artikler oversatt`);
    } catch (err) {
      console.error(`  ✗ Batch feil: ${err.message}`);
    }
  }

  console.log(`✓ Oversettelse ferdig — ${total} artikler\n`);
  return total;
}

// Kjøres direkte: node src/translate/index.js
if (process.argv[1].includes('translate')) {
  import('dotenv').then(m => m.default.config());
  import('../db/index.js').then(({ getDb }) => { getDb(); translatePending().catch(console.error); });
}
