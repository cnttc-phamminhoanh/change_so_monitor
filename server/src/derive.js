/* Pure derivation rules, ported 1:1 from the cloud app
   (server/modules/so-monitor/so-derive.ts). Keep both in sync. */

const dayOf = (value) => {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return '';
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : value;
};

const dirFor = (kind, from, to) => {
  if (kind === 'swap') return 'swap';
  if (kind === 'date') return to > from ? 'up' : 'down';
  const left = Number.parseFloat(from);
  const right = Number.parseFloat(to);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 'swap';
  if (right > left) return 'up';
  if (right < left) return 'down';
  return 'swap';
};

/**
 * Derives per-order change lists and stage events from raw sheet rows.
 * @param {Array<Object>} changeRows
 * @param {Array<Object>} stageRows
 */
const deriveActivity = (changeRows, stageRows) => {
  const stagesByOrder = new Map();
  for (const row of stageRows) {
    const bucket = stagesByOrder.get(row.ordNo);
    if (bucket) {
      bucket.push(row);
    } else {
      stagesByOrder.set(row.ordNo, [row]);
    }
  }
  for (const bucket of stagesByOrder.values()) {
    bucket.sort(
      (a, b) => a.stageDate.getTime() - b.stageDate.getTime() || a.idx - b.idx,
    );
  }

  const eventsByOrder = new Map();
  for (const [ordNo, bucket] of stagesByOrder) {
    const seen = new Set();
    const events = [];
    for (const row of bucket) {
      const key = `${row.stage}|${dayOf(row.stageDate)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({ stage: row.stage, at: dayOf(row.stageDate) });
    }
    eventsByOrder.set(ordNo, events);
  }

  const stageAt = (ordNo, at) => {
    const bucket = stagesByOrder.get(ordNo) || [];
    let current = null;
    for (const row of bucket) {
      if (row.stageDate.getTime() > at.getTime()) break;
      if (current === null || row.stage > current) current = row.stage;
    }
    return current === null ? 1 : current;
  };

  const changesByOrder = new Map();
  let changeTotal = 0;
  const byOrder = new Map();
  for (const row of changeRows) {
    const bucket = byOrder.get(row.ordNo);
    if (bucket) {
      bucket.push(row);
    } else {
      byOrder.set(row.ordNo, [row]);
    }
  }

  for (const [ordNo, bucket] of byOrder) {
    bucket.sort((a, b) => a.idx - b.idx);
    const seen = new Set();
    const changes = [];
    for (const row of bucket) {
      if (!row.changeDate) continue;
      const at = dayOf(row.changeDate);
      const stage = stageAt(ordNo, row.changeDate);
      const pairs = [
        ['qty', row.oldQty, row.newQty, 'num'],
        ['country', row.oldCountry, row.newCountry, 'swap'],
        ['price', formatPrice(row.oldPri), formatPrice(row.newPri), 'num'],
        ['crd', row.oldDelDate || '', row.newDelDate || '', 'date'],
        ['packing', row.oldPac || '', row.newPac || '', 'swap'],
      ];
      for (const [field, oldRaw, newRaw, kind] of pairs) {
        const from = oldRaw === null || oldRaw === undefined ? '' : oldRaw;
        const to = newRaw === null || newRaw === undefined ? '' : newRaw;
        if (from === to) continue;
        const dir = dirFor(kind, from, to);
        const key = `${field}|${from}|${to}|${dir}|${stage}|${at}`;
        if (seen.has(key)) continue;
        seen.add(key);
        changes.push({
          field,
          from: oldRaw === null || oldRaw === '' ? null : from,
          to,
          dir,
          stage,
          at,
        });
      }
    }
    changes.sort((a, b) => a.at.localeCompare(b.at));
    if (changes.length > 0) {
      changesByOrder.set(ordNo, changes);
      changeTotal += changes.length;
    }
  }

  return { changesByOrder, eventsByOrder, changeTotal };
};

module.exports = { deriveActivity, dayOf, formatPrice, dirFor };
