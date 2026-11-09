import OpenAI from 'openai';
import { getUntranslated, updateTranslation } from '../db/index.js';

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
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

  const msg = await client.chat.completions.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.choices[0].message.content.trim();
  // Strip potential markdown code fence
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

export async function translatePending() {
  let total = 0;
  let first = true;

  // Gjenta til køen er tom. Stopp hvis en runde ikke fikk oversatt noe
  // (f.eks. gateway-feil), ellers ville vi gått i evig løkke.
  while (true) {
    const untranslated = getUntranslated();
    if (untranslated.length === 0) break;

    if (first) {
      const n = untranslated.length;
      console.log(`\n🌐 Oversetter artikler (${n}${n === 100 ? '+' : ''} i første runde)...`);
      first = false;
    }
    let pass = 0;

    // Norwegian articles need no translation — copy title directly
    const norwegian = untranslated.filter(a => a.lang_orig === 'no');
    for (const a of norwegian) {
      updateTranslation(a.id, a.title_orig, '');
      pass++;
    }

    // All other languages go to Claude in batches
    const foreign = untranslated.filter(a => a.lang_orig !== 'no');
    for (let i = 0; i < foreign.length; i += BATCH_SIZE) {
      const batch = foreign.slice(i, i + BATCH_SIZE);
      try {
        const results = await translateBatch(batch);
        const ids = new Set(batch.map(a => a.id));
        let ok = 0;
        for (const r of results) {
          if (!ids.has(r.id)) continue;
          updateTranslation(r.id, r.title_no, r.summary_no);
          ok++;
        }
        pass += ok;
        console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${ok} artikler oversatt`);
      } catch (err) {
        console.error(`  ✗ Batch feil: ${err.message}`);
      }
    }

    total += pass;
    if (pass === 0) {
      console.error('  ✗ Ingen artikler oversatt i denne runden — avbryter, prøver igjen ved neste henting');
      break;
    }
  }

  if (total > 0) console.log(`✓ Oversettelse ferdig — ${total} artikler\n`);
  return total;
}

// Kjøres direkte: node src/translate/index.js
if (process.argv[1].includes('translate')) {
  import('dotenv').then(m => m.default.config());
  import('../db/index.js').then(({ getDb }) => { getDb(); translatePending().catch(console.error); });
}
