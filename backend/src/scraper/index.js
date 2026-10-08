import { getUnscraped, updateBodyText } from '../db/index.js';

const TIMEOUT_MS = 8000;
const MAX_CHARS = 3000;
const CONCURRENCY = 4;

function extractText(html) {
  return html
    // fjern script, style, nav, header, footer og innholdet deres
    .replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    // fjern kommentarer
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // fjern alle gjenværende tagger
    .replace(/<[^>]+>/g, ' ')
    // dekod vanlige HTML-entiteter
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    // normaliser whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NRK-AlpinMonitor/1.0' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = extractText(html);
    return text.slice(0, MAX_CHARS) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeBodyTexts() {
  const pending = getUnscraped(60);
  if (pending.length === 0) return 0;

  console.log(`\n🔍 Scraper artikkeltekst for ${pending.length} saker...`);
  let done = 0;

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (a) => {
      const text = await scrapeUrl(a.url);
      updateBodyText(a.id, text ?? '');
      done++;
    }));
  }

  console.log(`✓ Scraping ferdig — ${done} saker\n`);
  return done;
}
