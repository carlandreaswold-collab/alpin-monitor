import OpenAI from 'openai';
import { getWithoutSpik, updateSpik } from '../db/index.js';

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});
const BATCH_SIZE = 10;

const SYSTEM_PROMPT = `Du er journalist og bakgrunnsekspert for NRK Sport alpint.
Du skriver bakgrunnsnotater — lengre sammendrag som gir kommentatoren kontekst og bakgrunn om saken.

Regler:
- 3–4 setninger, ca. 60–90 ord totalt
- Start med selve nyheten fra tittel/sammendrag
- Legg deretter til relevant bakgrunn og kontekst du vet om utøveren, laget eller situasjonen
- Bruk gjerne tall, karrierefakta og historisk kontekst der det er relevant og korrekt
- Skriv i vanlig norsk bokmål — ikke overskriftsform, ikke klisjeer
- Teksten skal tydelig være noe annet og mer utfyllende enn den korte oversettelsen over
- Har du lite å jobbe med, skriv 2–3 setninger med det du faktisk vet`;

async function generateBatch(articles) {
  const items = articles.map(a => ({
    id: a.id,
    tittel: a.title_no,
    sammendrag: a.summary_no || '',
    artikkeltekst: a.body_text ? a.body_text.slice(0, 1500) : '',
    kilde: a.source_name,
  }));

  const prompt = `Skriv et bakgrunnsnotat for hver av disse alpinsakene.
Returner KUN et JSON-array — ingen markdown, ingen forklaring.

For hver sak, returner:
- id: samme som input
- spik: bakgrunnsnotatet (3–4 setninger, 60–90 ord, starter med nyheten og gir kontekst)

Bruk artikkelteksten (hvis tilgjengelig) for å hente konkrete detaljer, sitater og fakta.
Suppler med din bakgrunnskunnskap om utøvere og alpinsporten.

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
