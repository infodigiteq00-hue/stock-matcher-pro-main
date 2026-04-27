# Stock Matcher Pro

The app now uses a CSV-backed API as its only data source.

## Run

```bash
npm install
npm run dev
```

`npm run dev` starts:
- Vite frontend
- CSV backend API (`server/index.js`)

All frontend tables (stock, leftovers, BOQ, match results, custom shapes, and stock ledger) are persisted into a single CSV table at `data/inventory.csv`.
