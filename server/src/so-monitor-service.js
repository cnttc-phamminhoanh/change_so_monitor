/* Read paths of the dashboard, ported 1:1 from the cloud app
   (server/modules/so-monitor/so-monitor.service.ts). Keep both in sync. */

const db = require('./db');
const { deriveActivity } = require('./derive');

/** PO date is encoded in the SO number tail: SO<brand><YYMMDD><seq>. */
const poDateFromSoNo = (soNo) => {
  const match = /(\d{9})$/.exec(soNo);
  if (!match) return null;
  const year = 2000 + Number(match[1].slice(0, 2));
  const month = Number(match[1].slice(2, 4));
  const day = Number(match[1].slice(4, 6));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime()) ? null : iso;
};

const buildHeaders = (changeRows, stageRows) => {
  const headers = new Map();

  const ensure = (ordNo) => {
    const existing = headers.get(ordNo);
    if (existing) return existing;
    const created = {
      soNo: ordNo,
      ordId: null,
      poDate: poDateFromSoNo(ordNo),
      crd: null,
      changeCountry: null,
      infCountry: null,
      season: null,
      buyer: null,
      styles: [],
      poNos: [],
      stage: 1,
    };
    headers.set(ordNo, created);
    return created;
  };

  for (const row of changeRows) {
    const header = ensure(row.ordNo);
    if (header.ordId === null && row.ordId) header.ordId = row.ordId;
    if (row.newDelDate) header.crd = row.newDelDate;
    if (row.newCountry) {
      header.changeCountry = row.newCountry;
    } else if (header.changeCountry === null && row.oldCountry) {
      header.changeCountry = row.oldCountry;
    }
  }

  for (const row of stageRows) {
    const header = ensure(row.ordNo);
    if (header.ordId === null && row.ordId) header.ordId = row.ordId;
    if (row.stage > header.stage) header.stage = row.stage;
  }

  return headers;
};

/* SQL Server allows at most 2100 parameters per request; keep the per-order
   IN-list comfortably under that. Above this, fall back to the full reads. */
const MAX_SCOPED_ORDERS = 1500;

const loadOrders = async (pool, window) => {
  let changeRows;
  let stageRows;
  let infLines;

  if (!window) {
    [changeRows, stageRows, infLines] = await Promise.all([
      db.fetchChangeRows(pool),
      db.fetchStageRows(pool),
      db.fetchInfLines(pool),
    ]);
  } else {
    changeRows = await db.fetchChangeRows(pool, window);
    const ordNos = [...new Set(changeRows.map((row) => row.ordNo))];
    if (ordNos.length === 0) {
      return { orders: [] };
    }
    if (ordNos.length <= MAX_SCOPED_ORDERS) {
      [stageRows, infLines] = await Promise.all([
        db.fetchStageRowsFor(pool, ordNos),
        db.fetchInfLinesFor(pool, ordNos),
      ]);
    } else {
      [stageRows, infLines] = await Promise.all([
        db.fetchStageRows(pool),
        db.fetchInfLines(pool),
      ]);
    }
  }

  const activity = deriveActivity(changeRows, stageRows);
  const headers = buildHeaders(changeRows, stageRows);

  for (const line of infLines) {
    if (!line.ordNo) continue;
    const header = headers.get(line.ordNo);
    if (!header) continue;
    if (line.style && !header.styles.includes(line.style)) {
      header.styles.push(line.style);
    }
    if (!header.poNos.includes(line.poNo)) header.poNos.push(line.poNo);
    if (header.infCountry === null && line.country) header.infCountry = line.country;
    if (header.season === null && line.season) header.season = line.season;
    if (header.buyer === null && line.buyer) header.buyer = line.buyer;
  }

  const orders = [...headers.values()]
    .sort((a, b) => a.soNo.localeCompare(b.soNo))
    .map((header) => ({
      id: header.soNo,
      soNo: header.soNo,
      ordId: header.ordId,
      poDate: header.poDate,
      crd: header.crd,
      country: header.infCountry ?? header.changeCountry,
      season: header.season,
      buyer: header.buyer,
      styles: header.styles,
      poNos: header.poNos,
      stage: header.stage || 1,
      stageEvents: activity.eventsByOrder.get(header.soNo) || [],
      changes: activity.changesByOrder.get(header.soNo) || [],
    }));

  return { orders, activity };
};

/* window is optional: { from, to } inclusive YYYY-MM-DD days. When omitted,
   every change row is read (the "show all change dates" case). */
const getDashboard = async (window) => {
  const pool = await db.getPool();
  const { orders } = await loadOrders(pool, window || null);
  return { orders };
};

module.exports = { getDashboard, poDateFromSoNo };
