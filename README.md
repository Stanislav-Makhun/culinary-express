# Cülinary Expréss · Key Flow Prototype

A clickable, front-end-only prototype of the Cülinary Expréss key flow, based on the UI/UX MVP Blueprint v1.0.
It is an alignment artifact for the client and the managers. It is not production code.

**Deliverable:** `dist/culinary-express-prototype.html`. It is one self-contained file: React loads from cdnjs, and everything else is inlined (CSS, JS, the traced logo and the "before" screenshot).

## Demo flow

Landing → Role benefits → Sign-up stub → Client Dashboard → Create Dispatch → Dispatch Builder → Review & Quote → Mock checkout → Dispatch Ticket → Share → Vendor suggests a change → Client accepts → Staff mobile view.

The full click path and the list of assumptions are in the prototype's **About** panel. Open it from the floating **Demo** pill.

## Build

```sh
npm install
npm run build        # writes dist/culinary-express-prototype.html and dist/local-preview.html
```

`dist/local-preview.html` is a full HTML document that loads React from `node_modules`. Use it for local testing.

## Checks

These use the Playwright and Chromium preinstalled in the build environment.

```sh
node scripts/flow.mjs <outDir> 1280    # clicks the whole demo flow, screenshots every step, reports errors and overflow
node scripts/flow.mjs <outDir> 768
node scripts/flow.mjs <outDir> 390
node scripts/check-types.mjs           # step visibility per Dispatch type, Save draft, Reset demo
```

## Source map

| File | Contents |
|---|---|
| `src/data.js` | Domain tables, field labels, seed data, pricing, timeline and checklist generators |
| `src/store.js` | Global state persisted to localStorage (guarded), toasts |
| `src/actions.js` | State transitions; every change writes to Activity |
| `src/ui.jsx` | Reusable components: Button, Input, Select, Segmented, Counter, Card, Tabs, Dialog, Drawer, Avatar stack, Status pill, Lifecycle tracker, Photo placeholder |
| `src/facts.jsx` | Labelled field renderers shared by Review & Quote and the Ticket, plus inline suggestions |
| `src/builder.jsx` | Dispatch Builder steps, live summary, per-section edit and suggest mode |
| `src/ticket.jsx` | Dispatch Ticket: header, tabs, rail, quick edits, messages |
| `src/share.jsx` | Share dialog |
| `src/staff.jsx` | Staff mobile view |
| `src/landing.jsx` | Landing page and sign-up stub |
| `src/dashboard.jsx` | App header, client, vendor and staff dashboards, office placeholder |
| `src/checkout.jsx` | Mock Square checkout and confirmation |
| `src/extras.jsx` | Staff Instruction Sheet, Compare, About panel, demo toolbar |
| `scripts/trace-logo.py` | Traces the logo into `assets/logo.svg` |
