# AI_CONTEXT — Germton SO Change Monitor (standalone edition)

Read this whole file before changing anything in `standalone/`. It describes what
this project is, how every part works, and the rules that must not be broken.

## 1. What this is

A single-page dashboard that monitors **sales-order (SO) changes** for Germton
Group: a KPI summary of changes by field (CRD / country / price / qty / packing)
plus a paginated list of order cards, each with a 7-stage production timeline.

Two editions of the same product exist:

- **Cloud edition** (the Miaoda app that produced this folder): NestJS + Drizzle +
  Postgres; data is loaded from a workbook via a sync endpoint.
- **This standalone edition**: Express + `mssql` reading **your own SQL Server
  directly**. There is no sync, no workbook, no ingestion — SQL Server is the
  single source of truth and this server only ever **reads** three tables.

The two editions intentionally duplicate the derive logic (see §6). UI design is
identical; the standalone client is a copy of the cloud page with the platform
SDK removed (plain `fetch`, local `types.ts`).

## 2. Layout

```
standalone/
├── server/            # Express + mssql, plain JavaScript (no TypeScript)
│   ├── .env.example   # copy to .env and fill in SQL Server credentials
│   └── src/
│       ├── index.js               # HTTP: /api routes + serves ../client/dist
│       ├── config.js              # env vars
│       ├── db.js                  # pool, schema self-check, the SQL reads
│       ├── derive.js              # pure functions: change + stage derivation
│       ├── so-monitor-service.js  # order-header building + dashboard assembly
│       └── ip-allowlist.js        # CIDR access middleware
└── client/            # Vite + React 19 + TypeScript
    └── src/
        ├── SoMonitorPage.tsx      # the single page (all state lives here)
        ├── api.ts                 # fetch wrapper: GET /api/so-monitor/dashboard
        ├── types.ts               # response contract (local copy)
        ├── hooks/useSoMonitorData.ts  # the ONLY place that triggers DB queries
        ├── components/            # Toolbar, Kpi, OrderCard, Pager, icons
        ├── lib/i18n.ts            # all zh/en copy; localStorage key `so-lang`
        ├── lib/timeline.ts        # stage windows, KPI stats, date helpers
        └── so-monitor.css         # all styling; design tokens are CSS variables
```

`client/dist/` is the committed production build that Express serves. After any
client change, rebuild it (`npm run build` in `standalone/client`) so the folder
stays deployable as-is.

## 3. Database contract (SQL Server)

`server/src/db.js` → `REQUIRED_COLUMNS` is the contract. On boot the server
checks every table/column exists and **refuses to start** with the exact list of
missing columns. Never weaken this check.

| Table | Key columns | Notes |
| --- | --- | --- |
| `change_so` | `ord_no`, `ord_id`, `change_dae` (change date), `new_qty`/`old_qty`, `new_country`/`old_country`, `new_pri`/`old_pri`, `new_crd`/`old_crd` (CRD), `new_pac`/`old_pac` | one row per raw change event; `change_dae` may be NULL (such rows are skipped by derivation); column names differ from the cloud (`change_date`, `new_del_date`/`old_del_date`) — the SELECT aliases map them |
| `stage` | `ord_no`, `ord_id`, `stage_date`, `stage` (1..7) | production stage events |
| `so_inf` | `ord_no`, `ord_id`, `style`, `po_no`, `season`, `country`, `buyer` | PO lines; `style`/`po_no`/`season`/`country`/`buyer` surface on the card header (`country` takes precedence over the `change_so`-derived value; `buyer` is also the client-side filter next to Search); other columns (`po_date`, `crd`) exist in the sheet but are unused |

There is **no** order-header table and **no** sync-log table in the standalone
database. Order headers are derived at query time (below).

## 4. Server behavior

### `GET /api/so-monitor/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`

The only data endpoint. `from`/`to` are optional but always sent together; the
window takes effect only when both are present and valid (else 400). It is an
**inclusive day range** on `change_dae` (`>= from 00:00`, `< to+1day 00:00`).

Flow in `so-monitor-service.js` → `loadOrders(pool, window)`:

1. Read `change_so` rows — with the window WHERE clause when a window is given.
2. Collect the distinct `ord_no` set from those rows. If empty → return
   `{ orders: [] }` without further queries.
3. Read `stage` and `so_inf` **scoped to that ord_no list** (parameterized
   `IN (@ord0, @ord1, ...)`), or unscoped when no window / when the list exceeds
   `MAX_SCOPED_ORDERS` (1500 — SQL Server's 2100-parameter cap).
4. `deriveActivity(changeRows, stageRows)` (in `derive.js`) produces per-order
   `changes` and `stageEvents`.
5. `buildHeaders` derives the order header per `ord_no`:
   - `soNo` = `ord_no`; `ordId` = first recorded `ord_id`
   - `poDate` decoded from the SO number tail `SO<brand><YYMMDD><seq>`
   - `crd` = latest `new_crd` value
   - `country` = first `so_inf.country` line value, else latest `new_country`
     (fallback: earliest `old_country`); `season` = first `so_inf.season` line
     value; `buyer` = first `so_inf.buyer` line value
   - `stage` = highest stage in `stage`; `styles`/`poNos` = distinct values from
     matching `so_inf` lines

Response: `{ orders: SoOrder[] }` — shape in `client/src/types.ts`.

There is **no** `/status` endpoint and **no write endpoints**. Do not add any:
this server must stay read-only.

## 5. Client behavior (SoMonitorPage.tsx)

### Data fetching — explicit-search rule (CRITICAL)

- The two date inputs edit **draft** state (`fromDraft`/`toDraft`) only.
  Changing them must never call the API.
- The **Search button** (`applySearch`) normalizes the drafts (fills defaults,
  swaps if reversed), then commits them to `fromDate`/`toDate`. Only committed
  values reach `useSoMonitorData(from, to)`, whose effect
  `[from, to, reloadToken]` is the only DB-query trigger. Identical ranges are
  not re-queried.
- Other query triggers: initial mount (default = last month → today),
  `resetFilters` (back to defaults), `showAllDates` (commits empty strings →
  request without params → full read), and the error-state Retry button.
- Text search and the buyer select filter **client-side only** (the dataset is
  small); they must stay instant and must never reach the API.
- KPI tiles compute from the same filtered set as the list; clicking a tile sets
  `fieldFilter`, which scopes the list to orders having that change in range
  while each card still renders all of its own changes.

### Sticky summary — performance rule (CRITICAL)

The toolbar + summary + detail heading live in `.sticky-top`
(`position: sticky`). "Stuck" state is detected by an `IntersectionObserver` on
`.sticky-sentinel` (a 1px marker placed directly above `.sticky-top`) and
applied by setting `data-stuck` **directly on the DOM node**.
Never reintroduce `setState` inside a scroll/resize handler here — the previous
scroll-listener version re-rendered the whole page on every frame and caused
visible jank. The `[data-stuck="true"]` CSS is **visual-only** (background +
shadow): it must never change the block's height — a height change shifts the
document height, clamps the scroll position and flaps the observer at the top
of a short (KPI-filtered) page. No `backdrop-filter` on the stuck header
either (it re-blurs the scrolling content every frame).

### Other client facts

- Language: zh/en via `buildCopy(lang)` in `lib/i18n.ts`; persisted in
  localStorage `so-lang`; default zh. All UI text lives in `i18n.ts` — never
  hardcode strings in components.
- Pagination is client-side, `PAGE_SIZE` in `lib/timeline.ts`.
- Dates display as `YYYY-MM-DD`; in-card dates always use the full form.

## 6. Derive rules — duplicated on purpose

Change derivation (old/new pair comparison, direction up/down/swap, price to 2
decimals, duplicate collapsing, skipping NULL change dates, assigning each change
the highest stage reached at-or-before its timestamp) exists in two places:

- cloud: `server/modules/so-monitor/so-derive.ts` + `so-monitor.service.ts`
- here: `standalone/server/src/derive.js` + `so-monitor-service.js`

If any rule changes, update **both** editions.

## 7. Run / build / deploy

```bash
# client (after any client change — dist is committed and served by Express)
cd standalone/client && npm install && npm run build

# server
cd standalone/server && cp .env.example .env  # fill DB_* values
npm install && npm start                       # http://localhost:4000
```

Access is restricted to `ALLOWED_CIDRS` (default `172.18.0.0/16,127.0.0.1/32,::1/128`);
set `TRUST_PROXY=true` only behind a reverse proxy. Details: `README.md`.

## 8. Do / don't checklist for future changes

Do:

- keep all SQL parameterized (no string-concatenated values);
- keep date-window queries behind the explicit Search action;
- keep `derive.js` in sync with the cloud edition;
- rebuild `client/dist` after client changes;
- add new UI text to both `zh` and `en` in `lib/i18n.ts`;
- style via the CSS variables in `so-monitor.css` (`--coral`, `--ink`, …).

Don't:

- don't add writes/migrations/sync to the server — it is read-only by design;
- don't re-introduce the sync/status chip or `/status` endpoint (removed on
  purpose: SQL Server is the live source, there is nothing to sync);
- don't query the API while the user is typing in the date inputs;
- don't use React state for scroll-position effects;
- don't rename SQL columns in the queries without updating `REQUIRED_COLUMNS`;
- don't touch `dist/` by hand — it is build output.
