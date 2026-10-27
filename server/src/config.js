const path = require('path');

require('dotenv').config();

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
};

module.exports = {
  port: asNumber(process.env.PORT, 4000),
  allowedCidrs: (process.env.ALLOWED_CIDRS || '172.18.0.0/16,127.0.0.1/32,::1/128')
    .split(',')
    .map((cidr) => cidr.trim())
    .filter(Boolean),
  trustProxy: asBool(process.env.TRUST_PROXY, false),
  clientDist:
    process.env.CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist'),
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: asNumber(process.env.DB_PORT, 1433),
    database: process.env.DB_DATABASE || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    encrypt: asBool(process.env.DB_ENCRYPT, false),
    trustServerCertificate: asBool(process.env.DB_TRUST_SERVER_CERT, true),
    connectionTimeout: asNumber(process.env.DB_TIMEOUT, 15000),
    requestTimeout: asNumber(process.env.DB_TIMEOUT, 15000) * 2,
  },
};
