'use strict';

const parseIpv4 = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/u.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8n) | BigInt(octet);
  }
  return { value, width: 32 };
};

const parseIpv6 = (ip) => {
  if (ip.includes('.')) return null;
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  let groups;
  if (halves.length === 2) {
    const head = halves[0] === '' ? [] : halves[0].split(':');
    const tail = halves[1] === '' ? [] : halves[1].split(':');
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null;
    groups = [...head, ...Array(missing).fill('0'), ...tail];
  } else {
    groups = ip.split(':');
  }
  if (groups.length !== 8) return null;
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/u.test(group)) return null;
    value = (value << 16n) | BigInt(parseInt(group, 16));
  }
  return { value, width: 128 };
};

const normalizeIp = (raw) => {
  if (typeof raw !== 'string' || raw === '') return null;
  const ip = raw.trim();
  const mapped = ip.startsWith('::ffff:') ? ip.slice(7) : null;
  if (mapped && mapped.includes('.')) return parseIpv4(mapped);
  if (ip.includes('.')) return parseIpv4(ip);
  return parseIpv6(ip);
};

const parseCidr = (cidr) => {
  const trimmed = cidr.trim();
  const slashIndex = trimmed.indexOf('/');
  const addressPart = slashIndex === -1 ? trimmed : trimmed.slice(0, slashIndex);
  const parsed = normalizeIp(addressPart);
  if (!parsed) throw new Error(`Invalid CIDR address: "${cidr}"`);
  const prefixText = slashIndex === -1 ? undefined : trimmed.slice(slashIndex + 1);
  const prefix = prefixText === undefined ? parsed.width : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > parsed.width) {
    throw new Error(`Invalid CIDR prefix: "${cidr}"`);
  }
  return {
    network: parsed.value >> BigInt(parsed.width - prefix),
    prefix,
    width: parsed.width,
  };
};

const isIpAllowed = (rawIp, ranges) => {
  const parsed = normalizeIp(rawIp);
  if (!parsed) return false;
  return ranges.some(
    (range) =>
      parsed.width === range.width &&
      parsed.value >> BigInt(parsed.width - range.prefix) === range.network,
  );
};

const buildMiddleware = (cidrList) => {
  const ranges = cidrList.map(parseCidr);
  return (req, res, next) => {
    if (isIpAllowed(req.ip, ranges)) {
      next();
      return;
    }
    res.status(403).json({
      error: {
        message:
          'Truy cập bị từ chối: địa chỉ IP không nằm trong dải cho phép ' +
          '(Access denied: IP address not in allowed ranges)',
      },
    });
  };
};

module.exports = { buildMiddleware, isIpAllowed, parseCidr, normalizeIp };
