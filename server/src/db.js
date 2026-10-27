const sql = require('mssql');

const config = require('./config');

/* Column contract with your SQL Server database. The server refuses to start
   when any of these columns is missing, so a schema drift fails loud. */
const REQUIRED_COLUMNS = {
  change_so: [
    'ord_no',
    'ord_id',
    'change_dae',
    'new_qty',
    'old_qty',
    'new_country',
    'old_country',
    'new_pri',
    'old_pri',
    'new_crd',
    'old_crd',
    'new_pac',
    'old_pac',
  ],
  stage: ['ord_no', 'ord_id', 'stage_date', 'stage'],
  so_inf: ['ord_no', 'ord_id', 'style', 'po_no', 'season', 'country', 'buyer'],
};

let poolPromise = null;

const getPool = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      server: config.db.server,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      options: {
        encrypt: config.db.encrypt,
        trustServerCertificate: config.db.trustServerCertificate,
      },
      connectionTimeout: config.db.connectionTimeout,
      requestTimeout: config.db.requestTimeout,
    }).connect();
    poolPromise.catch(() => {
      poolPromise = null;
    });
  }
  return poolPromise;
};

const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dayString = (value) => {
  const date = toDate(value);
  return date ? dayOfLocal(date) : null;
};

const dayOfLocal = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const assertSchema = async (pool) => {
  const tables = Object.keys(REQUIRED_COLUMNS);
  const result = await pool
    .request()
    .query(
      `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME IN (${tables.map((t) => `'${t}'`).join(', ')})`,
    );

  const present = new Set(
    result.recordset.map((row) => `${row.tableName}.${row.columnName}`),
  );
  const missingTables = tables.filter(
    (table) => !result.recordset.some((row) => row.tableName === table),
  );
  const missing = [];
  for (const table of tables) {
    for (const column of REQUIRED_COLUMNS[table]) {
      if (!present.has(`${table}.${column}`)) missing.push(`${table}.${column}`);
    }
  }
  if (missingTables.length > 0 || missing.length > 0) {
    const actualByTable = new Map();
    for (const row of result.recordset) {
      if (!actualByTable.has(row.tableName)) {
        actualByTable.set(row.tableName, []);
      }
      actualByTable.get(row.tableName).push(row.columnName);
    }
    const affectedTables = [
      ...new Set(missing.map((entry) => entry.split('.')[0])),
    ];
    const actualLines = affectedTables
      .map(
        (table) =>
          `  actual columns found in ${table}: ${actualByTable.get(table).join(', ')}`,
      )
      .join('\n');
    throw new Error(
      `SQL Server schema mismatch. Missing tables: ${missingTables.join(', ') || 'none'}; missing columns: ${missing.join(', ')}.\n${actualLines}\nSee standalone/README.md for the expected schema.`,
    );
  }
};

const fetchChangeRows = async (pool, window) => {
  const request = pool.request();
  let where = '';
  if (window) {
    /* Inclusive day window on change_dae: [from 00:00, to + 1 day 00:00). */
    const fromStart = new Date(`${window.from}T00:00:00`);
    const toExclusive = new Date(`${window.to}T00:00:00`);
    toExclusive.setDate(toExclusive.getDate() + 1);
    request.input('fromStart', sql.DateTime, fromStart);
    request.input('toExclusive', sql.DateTime, toExclusive);
    where = ' WHERE change_dae >= @fromStart AND change_dae < @toExclusive';
  }
  const result = await request.query(
    `SELECT ord_no, ord_id, change_dae AS change_date,
            new_qty, old_qty, new_country, old_country,
            new_pri, old_pri,
            new_crd AS new_del_date, old_crd AS old_del_date,
            new_pac, old_pac
      FROM change_so${where}
      ORDER BY change_date`,
  );
  return result.recordset.map((row, idx) => ({
    ordNo: String(row.ord_no),
    ordId: row.ord_id === null ? null : String(row.ord_id),
    idx,
    changeDate: toDate(row.change_date),
    newQty: row.new_qty === null ? null : String(row.new_qty),
    oldQty: row.old_qty === null ? null : String(row.old_qty),
    newCountry: row.new_country === null ? null : String(row.new_country),
    oldCountry: row.old_country === null ? null : String(row.old_country),
    newPri: row.new_pri === null ? null : String(row.new_pri),
    oldPri: row.old_pri === null ? null : String(row.old_pri),
    newDelDate: dayString(row.new_del_date),
    oldDelDate: dayString(row.old_del_date),
    newPac: row.new_pac === null ? null : String(row.new_pac),
    oldPac: row.old_pac === null ? null : String(row.old_pac),
  }));
};

const fetchStageRows = async (pool) => {
  const result = await pool.request().query(
    `SELECT ord_no, ord_id, stage_date, stage
      FROM stage
      ORDER BY stage_date`,
  );
  return mapStageRows(result.recordset);
};

const mapStageRows = (recordset) =>
  recordset.map((row, idx) => ({
    ordNo: String(row.ord_no),
    ordId: row.ord_id === null ? null : String(row.ord_id),
    idx,
    stageDate: toDate(row.stage_date),
    stage: Number(row.stage),
  }));

/* Adds one parameter per ord_no and returns the "@ord0, @ord1, ..." list. */
const addOrdNoParams = (request, ordNos) =>
  ordNos
    .map((ordNo, index) => {
      const name = `ord${index}`;
      request.input(name, sql.NVarChar(100), ordNo);
      return `@${name}`;
    })
    .join(', ');

const fetchStageRowsFor = async (pool, ordNos) => {
  const request = pool.request();
  const list = addOrdNoParams(request, ordNos);
  const result = await request.query(
    `SELECT ord_no, ord_id, stage_date, stage
      FROM stage
      WHERE ord_no IN (${list})
      ORDER BY stage_date`,
  );
  return mapStageRows(result.recordset);
};

const fetchInfLines = async (pool) => {
  const result = await pool
    .request()
    .query('SELECT ord_no, ord_id, style, po_no, season, country, buyer FROM so_inf');
  return mapInfLines(result.recordset);
};

const mapInfLines = (recordset) =>
  recordset.map((row) => ({
    ordNo: row.ord_no === null ? null : String(row.ord_no),
    ordId: row.ord_id === null ? null : String(row.ord_id),
    style: row.style === null ? null : String(row.style),
    poNo: String(row.po_no),
    season: row.season === null ? null : String(row.season),
    country: row.country === null ? null : String(row.country),
    buyer: row.buyer === null ? null : String(row.buyer),
  }));

const fetchInfLinesFor = async (pool, ordNos) => {
  const request = pool.request();
  const list = addOrdNoParams(request, ordNos);
  const result = await request.query(
    `SELECT ord_no, ord_id, style, po_no, season, country, buyer FROM so_inf WHERE ord_no IN (${list})`,
  );
  return mapInfLines(result.recordset);
};

module.exports = {
  REQUIRED_COLUMNS,
  getPool,
  assertSchema,
  fetchChangeRows,
  fetchStageRows,
  fetchStageRowsFor,
  fetchInfLines,
  fetchInfLinesFor,
};
