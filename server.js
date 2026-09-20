const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Serve the static frontend (index.html, and any assets alongside it)
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// Health check — Render (and you) can hit this to confirm the service is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-memory store for bot session logs, keyed by a client-supplied session id.
// NOTE: this resets on every deploy/restart — it's a placeholder for future
// persistence (e.g. swap for a Postgres/Key-Value instance) if trade history
// needs to survive restarts.
const botSessions = new Map();

app.post('/api/bot-log', (req, res) => {
  const { sessionId, entry } = req.body || {};
  if (!sessionId || !entry) {
    return res.status(400).json({ error: 'sessionId and entry are required' });
  }
  if (!botSessions.has(sessionId)) botSessions.set(sessionId, []);
  const log = botSessions.get(sessionId);
  log.push({ ...entry, receivedAt: new Date().toISOString() });
  if (log.length > 500) log.shift(); // cap memory use per session
  res.json({ ok: true, count: log.length });
});

app.get('/api/bot-log/:sessionId', (req, res) => {
  const log = botSessions.get(req.params.sessionId) || [];
  res.json({ sessionId: req.params.sessionId, entries: log });
});

// Fallback: any unmatched route serves the app itself (single-page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Deriv OAuth Terminal backend listening on port ${PORT}`);
});
