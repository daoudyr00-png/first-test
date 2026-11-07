# Product Opportunity Finder

A research workspace for digital product entrepreneurs (especially Etsy sellers) to discover, document, evaluate
and prioritise product opportunities — based only on evidence you collect yourself.

- **No fabricated data.** Every number in the app is either something you entered or a transparent calculation over it.
- **No fake AI.** There are no simulated "AI insights". The architecture leaves a clear slot for a real Anthropic API integration later.

## Modules

| Module | What it does |
| --- | --- |
| **Dashboard** | Totals, best opportunities, recent research, problem matrix (pain × willingness to pay), criterion averages, idea pipeline |
| **Niche Explorer** | Niches with status, sub-niches, target audiences, and dated market observations with source links |
| **Problem Discovery** | Problems with audience, description, pain / frequency / willingness-to-pay (1–5), evidence and source URLs |
| **Competitor Research** | Competitor products with price, type, strengths, weaknesses, differentiation opportunities, evidence URL; price summary |
| **Keyword Research** | Keywords with search intent, your competition assessment, source and evidence notes; duplicate detection |
| **Opportunity Scoring** | 0–100 weighted score from your 0–5 ratings and written reasoning, with a live breakdown and full audit table |
| **Product Ideas** | Product concepts linked to problems and scores; table and validation board views |
| **Data & Backup** | Full JSON backup, restore (with validation and confirmation), clear all data |

Every module supports create / edit / delete, search, filters, sortable columns, CSV and JSON export of the filtered
records, and data persists across refreshes. Cross-module links: *Score this problem* → prefilled scoring form;
*Create product idea* from an opportunity → prefilled idea; dashboard items deep-link to the record.

## Scoring method

| Criterion | Weight |
| --- | --- |
| Demand evidence | 25% |
| Customer pain intensity | 20% |
| Competition opportunity | 20% |
| Willingness to pay | 20% |
| Product feasibility | 15% |

You rate each criterion **0–5** against a written rubric (see `src/lib/scoring.ts`) and record your reasoning.
`points = rating ÷ 5 × 100 × weight`, and the total is the sum of points. Unrated criteria count as 0 and the score is
marked *partial*. While rating, the form lists relevant facts from your own records (e.g. number of keywords in the
niche, the linked problem's pain rating, the range of competitor prices you logged) for reference — they never set a
rating automatically. Bands: **Strong** ≥ 70, **Moderate** 45–69, **Weak** < 45.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | TypeScript type-check |
| `npm test` | Unit tests (scoring maths, CSV escaping, backup parsing) |
| `npm run test:e2e` | Browser tests for every module (needs a running server; set `BASE_URL`, default `http://localhost:3000`) |

## Architecture

```
src/
  app/                 Routes (App Router): /, /niches, /problems, /competitors, /keywords, /scoring, /ideas, /data
  components/
    layout/            AppShell (sidebar + mobile drawer), PageHeader, nav config
    ui/                Reusable kit: Button, Card, Badge, Modal, ConfirmDialog, DetailModal, DataTable,
                       Toolbar (search / filter / export), SortSelect, fields (text, select, rating, list), Score
    charts/            Hand-built SVG charts (ProblemMatrix, StackedBar)
    <module>/          Module-specific forms and views
  hooks/               useDatabase / useCollection, useCrudState, useQueryParam
  lib/
    types.ts           Data models (one interface per future table)
    data/              DataAdapter interface + localStorage implementation
    store.ts           In-memory store, mutations, cascade un-linking, backup parsing
    scoring.ts         Rubric, weights, score calculation, research context
    export.ts          CSV / JSON export
    labels.ts          Display metadata for enums
```

**Data flow:** components → `useCollection()` → `store.ts` (immutable in-memory snapshot via `useSyncExternalStore`) →
`DataAdapter` → storage. When a record is deleted, records that reference it are kept and their link is set to `null`.

### Moving to Supabase

`src/lib/data/adapter.ts` defines an async `DataAdapter` (`loadAll`, `upsert`, `upsertMany`, `remove`, `replaceAll`).
To add Supabase: create one table per collection matching `src/lib/types.ts` (array fields as `jsonb` or `text[]`,
foreign keys `on delete set null`), implement the interface with `supabase-js`, and switch the export in
`src/lib/data/index.ts`. No UI changes are needed.

### Adding the Anthropic API

AI features should live in a server-side layer (e.g. `src/app/api/ai/*` route handlers calling the Anthropic SDK with
the key held in server env vars), returning suggestions that the user reviews and explicitly accepts into a record.
Good candidates: summarising pasted review text into a problem draft, or critiquing written score reasoning. Keep the
rule that scores come from user-confirmed ratings.
