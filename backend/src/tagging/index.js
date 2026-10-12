import OpenAI from 'openai';
import { getUntagged, replaceAthleteTags, getKnownAthletes } from '../db/index.js';
import { normalizeNation } from '../config/nations.js';

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
const BATCH_SIZE = 15;
const MAX_ATHLETES_PER_ARTICLE = 6;

async function tagBatch(articles, known) {
  const items = articles.map(a => ({
    id: a.id,
    title: a.title_no || a.title_orig,
    original_title: a.title_orig,
    summary: a.summary_no || '',
    text: (a.body_text || '').slice(0, 600),
  }));

  const knownList = known.map(k => `${k.name} (${k.nation})`).join('; ');

  const prompt = `You extract alpine ski racers from news articles for a Norwegian newsroom tool.

For each article, list the alpine ski racers (athletes, current or retired) that the article is ABOUT or that are explicitly named as significant participants (winners, injured, returning, quoted, selected for a team).
Do NOT list: coaches, officials, team staff, sponsors, or people who are only mentioned in passing, as a comparison, or in a list of unrelated names. Max ${MAX_ATHLETES_PER_ARTICLE} per article. If no racer is clearly involved, return an empty list.

For each racer return:
- name: full name in Latin spelling with the usual diacritics (e.g. "Petra Vlhová", "Lena Dürr")
- nation: IOC 3-letter country code of the nation the racer competes for (e.g. NOR, SWE, AUT, SUI, ITA, FRA, GER, USA, CAN, SLO, SVK, CRO, GBR, JPN)

Already known racers — if the person is one of these, use EXACTLY this spelling and nation:
${knownList || '(none yet)'}

If you are not sure which nation an unknown racer represents, omit that racer rather than guessing.

Return ONLY a JSON array, no markdown, no text outside the array:
[{"id": <same as input>, "athletes": [{"name": "...", "nation": "XXX"}]}]

Input:
${JSON.stringify(items, null, 2)}`;

  const res = await client.chat.completions.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.choices[0].message.content.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

function cleanAthletes(list) {
  const seen = new Set();
  const out = [];
  for (const a of Array.isArray(list) ? list : []) {
    const name = String(a?.name || '').trim().replace(/\s+/g, ' ');
    const nation = normalizeNation(a?.nation);
    if (name.length < 3 || name.length > 60 || !nation || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, nation });
    if (out.length >= MAX_ATHLETES_PER_ARTICLE) break;
  }
  return out;
}

export async function tagPending(limit = 300) {
  const untagged = getUntagged(limit);
  if (untagged.length === 0) return 0;

  console.log(`\n👤 Tagger utøvere i ${untagged.length} saker...`);
  let total = 0;

  for (let i = 0; i < untagged.length; i += BATCH_SIZE) {
    const batch = untagged.slice(i, i + BATCH_SIZE);
    try {
      const results = await tagBatch(batch, getKnownAthletes());
      const byId = new Map(results.map(r => [Number(r.id), r]));
      let n = 0;
      for (const a of batch) {
        const r = byId.get(a.id);
        if (!r) continue; // ikke merk som tagget — prøves på nytt neste runde
        replaceAthleteTags(a.id, cleanAthletes(r.athletes));
        n++;
      }
      total += n;
      console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${n}/${batch.length} saker tagget`);
    } catch (err) {
      console.error(`  ✗ Tagging-feil: ${err.message}`);
    }
  }

  console.log(`✓ Utøver-tagging ferdig — ${total} saker\n`);
  return total;
}
