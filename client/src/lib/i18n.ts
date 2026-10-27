import type { SoChangeField } from '../types';

export type SoLang = 'zh' | 'en' | 'vi';

export type SoFieldTone = 'azure' | 'orchid' | 'cyan' | 'amber' | 'clay' | 'slate';

export interface SoFieldMeta {
  label: string;
  full: string;
  upWord: string;
  downWord: string;
  upSym: string;
  downSym: string;
  tone: SoFieldTone;
}

export interface SoStageMeta {
  n: number;
  label: string;
}

export interface SoCopyBase {
  title: string;
  changeDate: string;
  reset: string;
  search: string;
  searchPlaceholder: string;
  buyer: string;
  all: string;
  clearFilters: string;
  summaryTitle: string;
  totalChangesWord: string;
  summaryNote: string;
  detailTitle: string;
  filterClear: string;
  detailNote: string;
  poDate: string;
  crdMeta: string;
  countryMeta: string;
  seasonMeta: string;
  styleMeta: string;
  poNoMeta: string;
  ordNoLabel: string;
  ordIdLabel: string;
  stepShort: string;
  stepFull: string;
  changeCount: string;
  pagerRange: string;
  pagerPrev: string;
  pagerNext: string;
  updated: string;
  changedAt: string;
  close: string;
  emptyTitle: string;
  emptyBody: string;
  showAllDates: string;
  loading: string;
  loadError: string;
  retry: string;
  buyerFilter: string;
  soNoMeta: string;
}

export interface SoCopy extends SoCopyBase {
  lang: SoLang;
  fields: Record<SoChangeField, SoFieldMeta>;
  stages: SoStageMeta[];
  fill: (template: string, vars: Record<string, string | number>) => string;
  fmtFull: (value: string) => string;
  fmtShort: (value: string) => string;
  trValue: (value: string) => string;
}

export const FIELD_TONES: Record<SoChangeField, SoFieldTone> = {
  crd: 'azure',
  country: 'orchid',
  price: 'cyan',
  qty: 'amber',
  packing: 'clay',
  bom: 'slate',
};

const COPY: Record<SoLang, SoCopyBase> = {
  zh: {
    title: '销售订单 (SO) 变更监控',
    changeDate: '变更日期',
    reset: '重置',
    search: '搜索',
    searchPlaceholder: '按订单号、国家或 CRD 搜索…',
    buyer: '买家',
    all: '全部',
    clearFilters: '清除筛选',
    summaryTitle: '变更汇总',
    totalChangesWord: '变更合计',
    summaryNote: '点击卡片可筛选下方明细，再次点击取消',
    detailTitle: '变更明细',
    filterClear: '清除筛选',
    detailNote: '灰色：已过或未到 · 红色：当前阶段 · 橙色：下一阶段',
    poDate: 'PO 日期',
    crdMeta: 'CRD',
    countryMeta: '国家',
    seasonMeta: '季节',
    styleMeta: '款式',
    poNoMeta: 'PO 号',
    ordNoLabel: '订单号',
    ordIdLabel: '订单ID',
    stepShort: '第 {n} 步',
    stepFull: '第 {n} 步 · {stage}',
    changeCount: '{n} 项变更',
    pagerRange: '{from}–{to} / {total}',
    pagerPrev: '上一页',
    pagerNext: '下一页',
    updated: '更新于',
    changedAt: '变更时间',
    close: '关闭',
    emptyTitle: '没有符合条件的订单',
    emptyBody: '当前月份没有变更记录。可查看全部变更日期，或调整关键词、买家与变更类型。',
    showAllDates: '查看全部变更日期',
    loading: '正在加载变更数据…',
    loadError: '变更数据加载失败',
    retry: '重试',
    buyerFilter: '买家',
    soNoMeta: '订单号',
  },
  en: {
    title: 'Sales order (SO) change monitor',
    changeDate: 'Change date',
    reset: 'Reset',
    search: 'Search',
    searchPlaceholder: 'Search SO no, country or CRD…',
    buyer: 'Buyer',
    all: 'All',
    clearFilters: 'Clear filters',
    summaryTitle: 'Change summary',
    totalChangesWord: 'Total changes',
    summaryNote: 'Select a card to filter the details below; select it again to clear',
    detailTitle: 'Change details',
    filterClear: 'Clear filter',
    detailNote: 'Grey: passed or upcoming · Red: current stage · Orange: next stage',
    poDate: 'PO date',
    crdMeta: 'CRD',
    countryMeta: 'Country',
    seasonMeta: 'Season',
    styleMeta: 'Style',
    poNoMeta: 'PO no',
    ordNoLabel: 'SO no',
    ordIdLabel: 'SO ID',
    stepShort: 'Step {n}',
    stepFull: 'Step {n} · {stage}',
    changeCount: '{n} change(s)',
    pagerRange: '{from}–{to} of {total}',
    pagerPrev: 'Previous page',
    pagerNext: 'Next page',
    updated: 'updated',
    changedAt: 'changed at',
    close: 'Close',
    emptyTitle: 'No matching orders',
    emptyBody: 'There are no change records in this window. Show all change dates, or adjust the keyword, buyer and change type.',
    showAllDates: 'Show all change dates',
    loading: 'Loading change data…',
    loadError: 'Could not load change data',
    retry: 'Retry',
    buyerFilter: 'Buyer',
    soNoMeta: 'SO no',
  },
  vi: {
    title: 'Theo dõi thay đổi đơn hàng (SO)',
    changeDate: 'Ngày thay đổi',
    reset: 'Đặt lại',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm theo số SO, quốc gia hoặc CRD…',
    buyer: 'Người mua',
    all: 'Tất cả',
    clearFilters: 'Xóa bộ lọc',
    summaryTitle: 'Tổng hợp thay đổi',
    totalChangesWord: 'Tổng thay đổi',
    summaryNote: 'Chọn một thẻ để lọc danh sách bên dưới; chọn lại để bỏ lọc',
    detailTitle: 'Chi tiết thay đổi',
    filterClear: 'Xóa bộ lọc',
    detailNote: 'Xám: đã qua hoặc chưa tới · Đỏ: giai đoạn hiện tại · Cam: giai đoạn kế tiếp',
    poDate: 'Ngày PO',
    crdMeta: 'CRD',
    countryMeta: 'Quốc gia',
    seasonMeta: 'Season',
    styleMeta: 'Style',
    poNoMeta: 'Số PO',
    ordNoLabel: 'Số SO',
    ordIdLabel: 'Mã SO',
    stepShort: 'Bước {n}',
    stepFull: 'Bước {n} · {stage}',
    changeCount: '{n} thay đổi',
    pagerRange: '{from}–{to} / {total}',
    pagerPrev: 'Trang trước',
    pagerNext: 'Trang sau',
    updated: 'cập nhật lúc',
    changedAt: 'thay đổi lúc',
    close: 'Đóng',
    emptyTitle: 'Không có đơn hàng phù hợp',
    emptyBody: 'Không có bản ghi thay đổi trong khoảng thời gian này. Hãy xem tất cả các ngày thay đổi, hoặc điều chỉnh từ khóa, người mua và loại thay đổi.',
    showAllDates: 'Xem tất cả các ngày thay đổi',
    loading: 'Đang tải dữ liệu thay đổi…',
    loadError: 'Không tải được dữ liệu thay đổi',
    retry: 'Thử lại',
    buyerFilter: 'Người mua',
    soNoMeta: 'Số SO',
  },
};

const STAGE_LABELS: Record<SoLang, string[]> = {
  zh: ['销售订单', '采购', '原料入库', '领料', '生产', '成品入库', '出货'],
  en: [
    'Sale order',
    'Purchasing',
    'Raw material receipt',
    'Material issuance',
    'WIP',
    'Finished goods receipt',
    'Export',
  ],
  vi: [
    'Đơn bán hàng',
    'Mua nguyên liệu',
    'Nhập kho nguyên liệu',
    'Xuất nguyên liệu',
    'Sản xuất',
    'Nhập kho thành phẩm',
    'Xuất hàng',
  ],
};

interface FieldLabelSet {
  label: string;
  full: string;
  upWord: string;
  downWord: string;
  upSym: string;
  downSym: string;
}

const FIELD_LABELS: Record<SoLang, Record<SoChangeField, FieldLabelSet>> = {
  zh: {
    crd: { label: 'CRD', full: '交期变更', upWord: '延后', downWord: '提前', upSym: '↑', downSym: '↓' },
    country: { label: '国家', full: '目的国家', upWord: '变更', downWord: '', upSym: '⇄', downSym: '' },
    price: { label: '单价', full: '单价', upWord: '上调', downWord: '下调', upSym: '↑', downSym: '↓' },
    qty: { label: '数量', full: '订单数量', upWord: '增加', downWord: '减少', upSym: '↑', downSym: '↓' },
    packing: { label: '包装方式', full: '包装方式', upWord: '变更', downWord: '', upSym: '⇄', downSym: '' },
    bom: { label: 'BOM', full: 'BOM 定额', upWord: '增加', downWord: '', upSym: '↑', downSym: '' },
  },
  en: {
    crd: { label: 'CRD', full: 'Delivery date', upWord: 'delayed', downWord: 'earlier', upSym: '↑', downSym: '↓' },
    country: { label: 'Country', full: 'Destination country', upWord: 'changed', downWord: '', upSym: '⇄', downSym: '' },
    price: { label: 'Unit price', full: 'Unit price', upWord: 'up', downWord: 'down', upSym: '↑', downSym: '↓' },
    qty: { label: 'Qty', full: 'Order quantity', upWord: 'up', downWord: 'down', upSym: '↑', downSym: '↓' },
    packing: { label: 'Packing method', full: 'Packing method', upWord: 'changed', downWord: '', upSym: '⇄', downSym: '' },
    bom: { label: 'BOM', full: 'BOM standard', upWord: 'increased', downWord: '', upSym: '↑', downSym: '' },
  },
  vi: {
    crd: { label: 'CRD', full: 'Ngày giao hàng', upWord: 'trễ hơn', downWord: 'sớm hơn', upSym: '↑', downSym: '↓' },
    country: { label: 'Quốc gia', full: 'Quốc gia đích', upWord: 'đổi', downWord: '', upSym: '⇄', downSym: '' },
    price: { label: 'Đơn giá', full: 'Đơn giá', upWord: 'tăng', downWord: 'giảm', upSym: '↑', downSym: '↓' },
    qty: { label: 'Số lượng', full: 'Số lượng đơn hàng', upWord: 'tăng', downWord: 'giảm', upSym: '↑', downSym: '↓' },
    packing: { label: 'Đóng gói', full: 'Cách đóng gói', upWord: 'đổi', downWord: '', upSym: '⇄', downSym: '' },
    bom: { label: 'BOM', full: 'Định mức BOM', upWord: 'tăng', downWord: '', upSym: '↑', downSym: '' },
  },
};

const VALUE_TRANSLATIONS: Record<SoLang, Record<string, string>> = {
  zh: {
    'Standard BOM': '标准 BOM',
    'BOM increase': 'BOM 增加',
    Carton: '纸箱',
    Pallet: '托盘',
    'Wooden crate': '木箱',
  },
  en: {},
  vi: {
    'Standard BOM': 'BOM tiêu chuẩn',
    'BOM increase': 'Tăng BOM',
    Carton: 'Thùng carton',
    Pallet: 'Pallet',
    'Wooden crate': 'Thùng gỗ',
  },
};

const formatDate = (value: string, short: boolean): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split('-');
  return short ? `${parts[1]}-${parts[2]}` : value;
};

export const fillTemplate = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    vars[key] === undefined ? match : String(vars[key]),
  );

export const buildCopy = (lang: SoLang): SoCopy => {
  const code: SoLang = lang === 'en' || lang === 'vi' ? lang : 'zh';
  const labels = FIELD_LABELS[code];

  const fields: Record<SoChangeField, SoFieldMeta> = {
    crd: { ...labels.crd, tone: FIELD_TONES.crd },
    country: { ...labels.country, tone: FIELD_TONES.country },
    price: { ...labels.price, tone: FIELD_TONES.price },
    qty: { ...labels.qty, tone: FIELD_TONES.qty },
    packing: { ...labels.packing, tone: FIELD_TONES.packing },
    bom: { ...labels.bom, tone: FIELD_TONES.bom },
  };

  return {
    ...COPY[code],
    lang: code,
    fields,
    stages: STAGE_LABELS[code].map((label: string, index: number) => ({ n: index + 1, label })),
    fill: fillTemplate,
    fmtFull: (value: string) => formatDate(value, false),
    fmtShort: (value: string) => formatDate(value, true),
    trValue: (value: string) => VALUE_TRANSLATIONS[code][value] || value,
  };
};
