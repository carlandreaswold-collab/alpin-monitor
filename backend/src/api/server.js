import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRecentArticles, getCategorized, categorize, uncategorize, getAthletes, getDb } from '../db/index.js';
import { fetchAll } from '../fetcher/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ── REST API ──

// Hent siste saker (ufiltret eller filtrert)
app.get('/api/articles', (req, res) => {
  const { country, athlete, limit } = req.query;
  const articles = getRecentArticles({
    country:  country  || undefined,
    athlete:  athlete  || undefined,
    limit:    limit ? parseInt(limit) : 80,
  });
  res.json(articles);
});

// Hent kategoriserte saker
app.get('/api/categorized', (req, res) => {
  res.json(getCategorized());
});

// Kategoriser en sak
app.post('/api/categorize', (req, res) => {
  const { article_id, category } = req.body;
  const VALID = ['sportslig','nyheter','viktig','goy','nerding','kjendis'];
  if (!article_id || !VALID.includes(category)) {
    return res.status(400).json({ error: 'Ugyldig article_id eller category' });
  }
  categorize(article_id, category);
  io.emit('categorized', { article_id, category });
  res.json({ ok: true });
});

// Fjern kategorisering
app.delete('/api/categorize/:id', (req, res) => {
  uncategorize(parseInt(req.params.id));
  io.emit('uncategorized', { article_id: parseInt(req.params.id) });
  res.json({ ok: true });
});

// Manuell henting (for testing / knapp i UI)
app.post('/api/fetch', async (req, res) => {
  res.json({ ok: true, message: 'Henting startet' });
  const total = await fetchAll(io);
  io.emit('fetch_done', { total, timestamp: new Date().toISOString() });
});

// Utøvere med saksantall
app.get('/api/athletes', (req, res) => {
  res.json(getAthletes());
});

// Helsesjekk
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── WEBSOCKET ──
io.on('connection', (socket) => {
  console.log(`WS tilkoblet: ${socket.id}`);
  socket.on('disconnect', () => console.log(`WS frakoblet: ${socket.id}`));
});

// ── CRON: hent hvert N minutt ──
const INTERVAL = parseInt(process.env.FETCH_INTERVAL_MINUTES || '15');
cron.schedule(`*/${INTERVAL} * * * *`, async () => {
  const total = await fetchAll(io);
  io.emit('fetch_done', { total, timestamp: new Date().toISOString() });
});

// ── FRONTEND (statiske filer) ──
const frontendDist = path.join(__dirname, '../../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── START ──
const PORT = process.env.PORT || 3001;
getDb(); // init + migrasjon
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎿 Alpin Monitor backend kjører på http://localhost:${PORT}`);
  console.log(`   RSS-henting hvert ${INTERVAL} minutt`);
  console.log(`   Første henting om ${INTERVAL} min — eller POST /api/fetch for å kjøre nå\n`);
});
