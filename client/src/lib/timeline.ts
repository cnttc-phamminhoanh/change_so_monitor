import type {
  SoChange,
  SoChangeDir,
  SoChangeField,
  SoOrder,
  SoStageEvent,
} from '../types';

import type { SoCopy } from './i18n';

export type ChangeTone = 'good' | 'bad' | 'neutral';

export const PAGE_SIZE = 10;

/* Fields surfaced by the report; BOM changes are ingested but not reported. */
export type ReportField = Exclude<SoChangeField, 'bom'>;

export const FIELD_ORDER: ReportField[] = ['crd', 'country', 'price', 'qty', 'packing'];

export const STAGE_WEIGHTS: number[] = [0.066, 0.143, 0.154, 0.088, 0.242, 0.198, 0.11];

export interface StageWindow {
  from: string;
  to: string;
}

export type StageWindows = Record<number, StageWindow>;

export interface FieldStats {
  affected: number;
  up: number;
  down: number;
  swap: number;
}

export type PagerItem = number | string;

/* CRD / price up = good, down = bad; BOM / qty always bad; country / packing neutral. */
export const changeTone = (field: SoChangeField, dir: SoChangeDir): ChangeTone => {
  if (field === 'crd' || field === 'price') return dir === 'up' ? 'good' : 'bad';
  if (field === 'bom' || field === 'qty') return 'bad';
  return 'neutral';
};

export const showsArrow = (field: SoChangeField): boolean =>
  field === 'crd' || field === 'bom' || field === 'price' || field === 'qty';

export const changeValue = (change: SoChange, value: string | null, copy: SoCopy): string => {
  if (!value) return '';
  if (change.field === 'crd') return copy.fmtFull(value);
  return copy.trValue(value);
};

const dayStamp = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

/* Stage grid derived from the PO date -> CRD window using fixed planning weights. */
export const stageWindows = (order: SoOrder): StageWindows => {
  if (!order.poDate || !order.crd) return {};
  const start = new Date(`${order.poDate}T00:00:00`);
  const end = new Date(`${order.crd}T00:00:00`);
  const total = Math.max(
    STAGE_WEIGHTS.length,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );
  const windows: StageWindows = {};
  let cursor = new Date(start);

  STAGE_WEIGHTS.forEach((weight: number, index: number) => {
    const span = Math.max(1, Math.round(total * weight));
    const from = new Date(cursor);
    const to = new Date(cursor);
    to.setDate(to.getDate() + span - 1);
    if (to.getTime() > end.getTime()) to.setTime(end.getTime());
    windows[index + 1] = { from: dayStamp(from), to: dayStamp(to) };
    cursor = new Date(to);
    cursor.setDate(cursor.getDate() + 1);
  });

  windows[STAGE_WEIGHTS.length].to = dayStamp(end);
  return windows;
};

/* Real stage dates recorded by the ERP feed; latest event per stage wins. */
export const stageDates = (order: SoOrder): Record<number, string | null> => {
  const dates: Record<number, string | null> = {};
  STAGE_WEIGHTS.forEach((_weight: number, index: number) => {
    dates[index + 1] = null;
  });
  order.stageEvents.forEach((event: SoStageEvent) => {
    const current: string | null = dates[event.stage];
    if (!current || event.at > current) dates[event.stage] = event.at;
  });
  return dates;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const todayIso = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

export const shiftMonths = (iso: string, months: number): string => {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== day) date.setDate(0);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const statsFor = (
  orders: SoOrder[],
  field: SoChangeField,
  range?: StageWindow,
): FieldStats => {
  let affected = 0;
  let up = 0;
  let down = 0;
  let swap = 0;

  orders.forEach((order: SoOrder) => {
    const matches = order.changes.filter(
      (change: SoChange) =>
        change.field === field &&
        (!range || (change.at >= range.from && change.at <= range.to)),
    );
    if (matches.length) affected += 1;
    matches.forEach((change: SoChange) => {
      if (change.dir === 'up') up += 1;
      else if (change.dir === 'down') down += 1;
      else swap += 1;
    });
  });

  return { affected, up, down, swap };
};

export const pageWindow = (page: number, pageCount: number): PagerItem[] => {
  const nums: number[] = [];
  const push = (n: number): void => {
    if (n >= 1 && n <= pageCount && nums.indexOf(n) === -1) nums.push(n);
  };
  push(1);
  push(page - 1);
  push(page);
  push(page + 1);
  push(pageCount);
  nums.sort((a: number, b: number) => a - b);

  const out: PagerItem[] = [];
  nums.forEach((n: number, index: number) => {
    if (index > 0 && n - nums[index - 1] > 1) out.push(`gap${n}`);
    out.push(n);
  });
  return out;
};
