import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SoChange, SoOrder } from './types';

import Kpi from './components/Kpi';
import OrderCard from './components/OrderCard';
import Pager from './components/Pager';
import Toolbar from './components/Toolbar';
import { CloseIcon } from './components/icons';
import {
  TweaksPanel,
  TweakRadio,
  TweakSection,
  TweakToggle,
} from './components/TweaksPanel';
import {
  TWEAK_DEFAULTS,
  readStoredTweaksOpen,
  useTweaks,
  type SoCanvas,
  type SoDensity,
  type SoRadius,
} from './lib/tweaks';
import { useSoMonitorData } from './hooks/useSoMonitorData';
import { buildCopy, type SoLang } from './lib/i18n';
import {
  FIELD_ORDER,
  PAGE_SIZE,
  shiftMonths,
  statsFor,
  todayIso,
  type FieldStats,
  type ReportField,
} from './lib/timeline';

import './so-monitor.css';

const TODAY = todayIso();
const RANGE_START = shiftMonths(TODAY, -1);
const RANGE_END = TODAY;
/* Wide bounds used when no date window is committed ("show all dates"). */
const NO_WINDOW = { lo: '0000-01-01', hi: '9999-12-31' };

const readInitialLang = (): SoLang => {
  try {
    const stored = window.localStorage.getItem('so-lang');
    return stored === 'en' || stored === 'vi' ? stored : 'zh';
  } catch {
    return 'zh';
  }
};

const SoMonitorPage: React.FC = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState<SoLang>(readInitialLang);
  const [query, setQuery] = useState('');
  const [buyer, setBuyer] = useState('all');
  const [page, setPage] = useState(1);
  /* Committed range: what the database was last queried with. Only changes
     via the Search button, reset or show-all-dates — never while typing. */
  const [fromDate, setFromDate] = useState(RANGE_START);
  const [toDate, setToDate] = useState(RANGE_END);
  /* Draft range: what the two date inputs show right now. */
  const [fromDraft, setFromDraft] = useState(RANGE_START);
  const [toDraft, setToDraft] = useState(RANGE_END);
  const [fieldFilter, setFieldFilter] = useState<ReportField | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState<boolean>(readStoredTweaksOpen);

  const listRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { orders, loading, error, refetch } = useSoMonitorData(fromDate, toDate);

  const copy = useMemo(() => buildCopy(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang =
      lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi' : 'en';
    try {
      window.localStorage.setItem('so-lang', lang);
    } catch {
      /* storage may be unavailable */
    }
  }, [lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem('so-tweaks-open', tweaksOpen ? '1' : '0');
    } catch {
      /* storage may be unavailable */
    }
  }, [tweaksOpen]);

  useEffect(() => {
    const node = stickyRef.current;
    const sentinel = sentinelRef.current;
    if (!node || !sentinel) return undefined;
    node.dataset.stuck = 'false';
    /* The sentinel sits just above the sticky block: once it scrolls out of
       view the block is stuck. Toggling data-stuck directly on the DOM keeps
       scrolling free of React re-renders (the old scroll-listener setState
       re-rendered the whole page every frame and caused jank). */
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (!entry) return;
        node.dataset.stuck = entry.isIntersecting ? 'false' : 'true';
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const allOrders = useMemo<SoOrder[]>(() => orders ?? [], [orders]);

  const buyers = useMemo(
    () =>
      Array.from(
        new Set(
          allOrders
            .map((order: SoOrder) => order.buyer)
            .filter((value: string | null): value is string => Boolean(value)),
        ),
      ).sort((a: string, b: string) => a.localeCompare(b)),
    [allOrders],
  );

  const windowed = fromDate !== '' && toDate !== '';

  const range = useMemo(() => {
    if (!windowed) return NO_WINDOW;
    const a = fromDate <= toDate ? fromDate : toDate;
    const b = fromDate <= toDate ? toDate : fromDate;
    return { lo: a || RANGE_START, hi: b || RANGE_END };
  }, [windowed, fromDate, toDate]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOrders.filter((order: SoOrder) => {
      const matchesBuyer = buyer === 'all' || order.buyer === buyer;
      const matchesQuery =
        !q ||
        order.soNo.toLowerCase().includes(q) ||
        (order.buyer ?? '').toLowerCase().includes(q) ||
        (order.crd ?? '').includes(q);
      const matchesDate = order.changes.some(
        (change: SoChange) => change.at >= range.lo && change.at <= range.hi,
      );
      return matchesBuyer && matchesQuery && matchesDate;
    });
  }, [allOrders, query, buyer, range]);

  const listed = useMemo(() => {
    if (!fieldFilter) return visible;
    return visible.filter((order: SoOrder) =>
      order.changes.some(
        (change: SoChange) =>
          change.field === fieldFilter && change.at >= range.lo && change.at <= range.hi,
      ),
    );
  }, [visible, fieldFilter, range]);

  const kpis = useMemo(
    (): Record<ReportField, FieldStats> => ({
      crd: statsFor(visible, 'crd', { from: range.lo, to: range.hi }),
      country: statsFor(visible, 'country', { from: range.lo, to: range.hi }),
      price: statsFor(visible, 'price', { from: range.lo, to: range.hi }),
      qty: statsFor(visible, 'qty', { from: range.lo, to: range.hi }),
      packing: statsFor(visible, 'packing', { from: range.lo, to: range.hi }),
    }),
    [visible, range.lo, range.hi],
  );

  const summaryTotal = useMemo(
    () =>
      FIELD_ORDER.reduce(
        (sum: number, key: ReportField) => sum + kpis[key].affected,
        0,
      ),
    [kpis],
  );

  const dateFiltered = windowed && (fromDate !== RANGE_START || toDate !== RANGE_END);
  const filtersActive = query.trim() !== '' || buyer !== 'all' || dateFiltered || Boolean(fieldFilter);

  const pageCount = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = listed.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, buyer, fieldFilter, range.lo, range.hi]);

  /* The only place where typing becomes a database query: normalize the draft
     inputs and commit them. Identical ranges are not re-queried. */
  const applySearch = (): void => {
    let lo = fromDraft || RANGE_START;
    let hi = toDraft || RANGE_END;
    if (lo > hi) {
      const swap = lo;
      lo = hi;
      hi = swap;
    }
    setFromDraft(lo);
    setToDraft(hi);
    if (lo === fromDate && hi === toDate) return;
    setFromDate(lo);
    setToDate(hi);
  };

  const goPage = (next: number): void => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    const el = listRef.current;
    if (!el) return;
    const pinned = stickyRef.current ? stickyRef.current.getBoundingClientRect().height : 80;
    const top = el.getBoundingClientRect().top + window.scrollY - (pinned + 18);
    window.scrollTo({ top: Math.max(top, 0), behavior: tweaks.motion ? 'smooth' : 'auto' });
  };

  const resetFilters = (): void => {
    setQuery('');
    setBuyer('all');
    setFromDraft(RANGE_START);
    setToDraft(RANGE_END);
    setFromDate(RANGE_START);
    setToDate(RANGE_END);
    setFieldFilter(null);
  };

  const showAllDates = (): void => {
    setQuery('');
    setBuyer('all');
    setFieldFilter(null);
    setFromDraft('');
    setToDraft('');
    setFromDate('');
    setToDate('');
  };

  const closeTweaks = useCallback(() => setTweaksOpen(false), []);
  const openTweaks = useCallback(() => setTweaksOpen(true), []);

  const rootClass = [
    'app',
    `canvas-${tweaks.canvas}`,
    `radius-${tweaks.radius}`,
    `density-${tweaks.density}`,
    tweaks.motion ? '' : 'no-motion',
  ]
    .filter(Boolean)
    .join(' ');

  const hasError = error !== null;
  const showLoading = loading && orders === undefined;
  const showError = hasError && orders === undefined;

  return (
    <div className={rootClass}>
      <div className="shell">
        <section className="hero">
          <h1>{copy.title}</h1>
          <div className="hero-right">
            <div className="lang-switch" role="group" aria-label="Language">
              <button type="button" aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>
                中文
              </button>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                EN
              </button>
              <button type="button" aria-pressed={lang === 'vi'} onClick={() => setLang('vi')}>
                VI
              </button>
            </div>
          </div>
        </section>

        <div className="sticky-sentinel" ref={sentinelRef} aria-hidden="true" />

        <div className="sticky-top" ref={stickyRef}>
          <Toolbar
            query={query}
            buyer={buyer}
            buyers={buyers}
            fromDate={fromDraft}
            toDate={toDraft}
            dateFiltered={dateFiltered}
            filtersActive={filtersActive}
            copy={copy}
            onQueryChange={setQuery}
            onBuyerChange={setBuyer}
            onFromChange={setFromDraft}
            onToChange={setToDraft}
            onSearch={applySearch}
            onReset={resetFilters}
          />

          <div className="section-head">
            <div className="section-title">
              <h2>{copy.summaryTitle}</h2>
              <span className="summary-counts">
                {copy.totalChangesWord} <b>{summaryTotal}</b>
              </span>
            </div>
            <div className="section-note">{copy.summaryNote}</div>
          </div>

          <div className="kpi-grid">
            {FIELD_ORDER.map((key: ReportField) => (
              <Kpi
                key={key}
                fieldKey={key}
                stats={kpis[key]}
                active={fieldFilter === key}
                copy={copy}
                onClick={() => setFieldFilter(fieldFilter === key ? null : key)}
              />
            ))}
          </div>

          <div className="section-head detail-head">
            <div className="section-title">
              <h2>{copy.detailTitle}</h2>
              {fieldFilter ? (
                <button
                  type="button"
                  className="ff-btn is-on"
                  title={copy.filterClear}
                  aria-label={copy.filterClear}
                  onClick={() => setFieldFilter(null)}
                >
                  <span>{copy.fields[fieldFilter].label}</span>
                  <b className="ff-count">{kpis[fieldFilter].affected}</b>
                  <span className="ff-caret">
                    <CloseIcon />
                  </span>
                </button>
              ) : null}
            </div>
            <div className="section-note">{copy.detailNote}</div>
          </div>
        </div>

        {showLoading ? (
          <div className="empty" aria-busy="true">
            <h3>{copy.loading}</h3>
          </div>
        ) : null}

        {showError ? (
          <div className="empty" role="alert">
            <h3>{copy.loadError}</h3>
            <p>{error ? error : copy.loadError}</p>
            <div className="empty-actions">
              <button type="button" className="empty-primary" onClick={refetch}>
                {copy.retry}
              </button>
            </div>
          </div>
        ) : null}

        {!showLoading && !showError && listed.length > 0 ? (
          <React.Fragment>
            <div className="list" ref={listRef} data-loading={loading ? 'true' : 'false'}>
              {pageRows.map((order: SoOrder, index: number) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  activeField={fieldFilter}
                  copy={copy}
                />
              ))}
            </div>
            <Pager
              page={current}
              pageCount={pageCount}
              total={listed.length}
              copy={copy}
              onPage={goPage}
            />
          </React.Fragment>
        ) : null}

        {!showLoading && !showError && listed.length === 0 ? (
          <div className="empty">
            <h3>{copy.emptyTitle}</h3>
            <p>{copy.emptyBody}</p>
            <div className="empty-actions">
              <button type="button" className="empty-primary" onClick={showAllDates}>
                {copy.showAllDates}
              </button>
              <button type="button" className="empty-ghost" onClick={resetFilters}>
                {copy.clearFilters}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <TweaksPanel
        title={copy.tweakTitle}
        toggleLabel={copy.tweakTitle}
        open={tweaksOpen}
        onOpen={openTweaks}
        onClose={closeTweaks}
      >
        <TweakSection label={copy.tweakDisplay} />
        <TweakRadio
          label={copy.tweakDensity}
          value={tweaks.density}
          options={[
            { value: 'comfy', label: copy.densityComfy },
            { value: 'compact', label: copy.densityCompact },
          ]}
          onChange={(value: SoDensity) => setTweak({ density: value })}
        />
        <TweakRadio
          label={copy.tweakRadius}
          value={tweaks.radius}
          options={[
            { value: 'soft', label: copy.radiusSoft },
            { value: 'round', label: copy.radiusRound },
            { value: 'crisp', label: copy.radiusCrisp },
          ]}
          onChange={(value: SoRadius) => setTweak({ radius: value })}
        />
        <TweakRadio
          label={copy.tweakCanvas}
          value={tweaks.canvas}
          options={[
            { value: 'light', label: copy.canvasLight },
            { value: 'sage', label: copy.canvasSage },
            { value: 'mist', label: copy.canvasMist },
          ]}
          onChange={(value: SoCanvas) => setTweak({ canvas: value })}
        />
        <TweakSection label={copy.tweakMotionSection} />
        <TweakToggle
          label={copy.tweakMotion}
          value={tweaks.motion}
          onChange={(value: boolean) => setTweak({ motion: value })}
        />
      </TweaksPanel>
    </div>
  );
};

export default SoMonitorPage;
