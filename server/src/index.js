const fs = require('fs');
const path = require('path');

const express = require('express');

const config = require('./config');
const db = require('./db');
const ipAllowlist = require('./ip-allowlist');
const service = require('./so-monitor-service');

const app = express();

if (config.trustProxy) {
  app.set('trust proxy', true);
}
app.use(ipAllowlist.buildMiddleware(config.allowedCidrs));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

app.get('/api/so-monitor/dashboard', async (req, res, next) => {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      res.status(400).json({ error: { message: 'from/to must be YYYY-MM-DD' } });
      return;
    }
    /* The window only takes effect when both ends are present; the client
       always sends them together (Search button) or neither (all dates). */
    const window =
      from && to
        ? from <= to
          ? { from, to }
          : { from: to, to: from }
        : null;
    res.json(await service.getDashboard(window));
  } catch (error) {
    next(error);
  }
});

const indexHtml = path.join(config.clientDist, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(config.clientDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(503)
      .send('Client not built yet. Run "npm run build" inside standalone/client first.');
  });
}

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  console.error(error);
  res.status(status).json({ error: { message: error.message } });
});

const main = async () => {
  if (!config.db.database || !config.db.user) {
    throw new Error(
      'DB_DATABASE and DB_USER must be set (copy .env.example to .env first).',
    );
  }
  const pool = await db.getPool();
  await db.assertSchema(pool);
  app.listen(config.port, () => {
    console.log(`SO change monitor API listening on :${config.port}`);
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
