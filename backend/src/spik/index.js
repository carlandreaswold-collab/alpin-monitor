import OpenAI from 'openai';
import { getWithoutSpik, updateSpik } from '../db/index.js';

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
const BATCH_SIZE = 10;

const SYSTEM_PROMPT = `Du er tekstforfatter for NRK Sport radio.
Du skriver korte spiker — introduksjonstekster som kommentatorer leser høyt på lufta.

Regler for NRK-radiospik:
- 2–3 setninger, maks 60 ord totalt
- Skriv som man snakker, ikke som man skriver i avis
- Ingen parenteser, ingen tankestrek midt i setning
- Aktiv form, gjerne presens eller preteritum — ikke fremtid ("vil", "kommer til å")
- Start med det viktigste, ikke med navn på kilde
- Ingen klisjeer som "nå er det klart at", "det er bekreftet at"
- Ingen overskriftsform — skriv hele setninger
- Mål: kommentator skal kunne lese dette rett inn i mikrofonen
- Bruk KUN informasjon fra tittel og sammendrag — ikke legg til tall, datoer eller detaljer som ikke står der
- Har du lite å jobbe med, skriv en kortere spik (1–2 setninger) som holder seg til det som faktisk er oppgitt`;

async function generateBatch(articles) {
  const items = articles.map(a => ({
    id: a.id,
    tittel: a.title_no,
    sammendrag: a.summary_no || '',
    kilde: a.source_name,
  }));

  const prompt = `Skriv en NRK-radiospik for hver av disse alpinsakene.
Returner KUN et JSON-array — ingen markdown, ingen forklaring.

For hver sak, returner:
- id: samme som input
- spik: radiospiken (2–3 setninger, maks 60 ord, klar til å leses på lufta)

Input:
${JSON.stringify(items, null, 2)}`;

  const res = await client.chat.completions.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  const text = res.choices[0].message.content.trim();
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(json);
}

export async function generateSpiks() {
  const pending = getWithoutSpik();
  if (pending.length === 0) return 0;

  console.log(`\n📻 Genererer spiker for ${pending.length} alpinsaker...`);
  let total = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    try {
      const results = await generateBatch(batch);
      for (const r of results) {
        updateSpik(r.id, r.spik);
        total++;
      }
      console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} spiker generert`);
    } catch (err) {
      console.error(`  ✗ Spik-feil: ${err.message}`);
    }
  }

  console.log(`✓ Spikgenerering ferdig — ${total} saker\n`);
  return total;
}
