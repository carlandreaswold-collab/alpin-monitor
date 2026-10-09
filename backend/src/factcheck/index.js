import OpenAI from 'openai';
import { getUnchecked, updateFactCheck } from '../db/index.js';

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
const BATCH_SIZE = 20;

async function checkBatch(articles) {
  const items = articles.map(a => ({
    id: a.id,
    title: a.title_no || a.title_orig,
    summary: a.summary_no || '',
    source: a.source_name,
  }));

  const prompt = `You are a STRICT relevance filter for an alpine skiing (alpint) newsroom tool used by Norwegian radio commentators.

ACCEPT (alpine: true) ONLY articles where alpine ski racing is the PRIMARY subject:
- Race results, startlists, previews, or analysis for: downhill (utfor), slalom, giant slalom (storslalåm), super-G, super combined, parallel events
- Training, injury, or team news about named alpine ski RACERS (e.g. Marco Odermatt, Mikaela Shiffrin, Henrik Kristoffersen)
- Alpine skiing equipment, ski preparation, or race technique
- FIS Alpine World Cup, Alpine World Championships, Alpine Olympic events

REJECT (alpine: false) everything else, including:
- Other ski disciplines: cross-country (langrenn), biathlon, ski jumping (hopp), freestyle, Nordic combined, ski touring
- Football (fotball), handball (håndball), ice hockey (ishockey), swimming (svømming), athletics, tennis, cycling, or ANY other sport
- General multi-sport Olympics coverage not specifically about alpine skiing
- General sports news that merely mentions an alpine athlete in passing
- Celebrity, lifestyle, travel, or winter tourism articles
- Weather reports or resort conditions unless directly tied to a specific alpine race

When in doubt, REJECT. It is better to miss a borderline article than to include non-alpine content.

Return ONLY a JSON array, no markdown, no text outside the array.

For each article return:
- id: same as input
- alpine: true or false
- reason: one short Norwegian sentence if false (empty string if true)

Input:
${JSON.stringify(items, null, 2)}`;

  const res = await client.chat.completions.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.choices[0].message.content.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

export async function factCheckPending() {
  const unchecked = getUnchecked();
  if (unchecked.length === 0) return 0;

  console.log(`\n🔍 Faktasjekker ${unchecked.length} artikler...`);
  let total = 0;

  for (let i = 0; i < unchecked.length; i += BATCH_SIZE) {
    const batch = unchecked.slice(i, i + BATCH_SIZE);
    try {
      const results = await checkBatch(batch);
      for (const r of results) {
        updateFactCheck(r.id, r.alpine ? 1 : 0, r.reason || null);
        total++;
      }
      const alpine = results.filter(r => r.alpine).length;
      console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${alpine}/${results.length} er alpint`);
    } catch (err) {
      console.error(`  ✗ Faktasjekk-feil: ${err.message}`);
    }
  }

  console.log(`✓ Faktasjekk ferdig — ${total} artikler\n`);
  return total;
}
