# Watchlist Module

Company watchlist with SEC filing data exploration.

## Features

- **Watchlist Table**: Add and manage companies to track, with search-based entity resolution
- **Company Profile**: Displays company name, ticker symbol, and CIK from the Elemental knowledge graph
- **Filing Activity**: Counts Edgar filings by matching company CIK across filing entities
- **Stub Feature Boxes**: Placeholder boxes for Risk Summary, Leadership, Solvency Analysis, Governance Analysis, Financial Facts, and Risk Drivers

## Architecture

- Entity search uses `POST /entities/search` for name-to-NEID resolution
- Property lookup uses `POST /elemental/entities/properties` (form-urlencoded) for ticker/CIK
- Edgar filing count uses `POST /elemental/find` (form-urlencoded) with a compound expression
- Schema is fetched once from `GET /elemental/metadata/schema` and cached in-memory
- Watchlist state persists to localStorage

## API Endpoints Used

| Endpoint                              | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `POST /entities/search`               | Resolve company names to NEIDs |
| `GET /elemental/metadata/schema`      | Look up PIDs and FIDs          |
| `POST /elemental/entities/properties` | Get ticker, CIK values         |
| `POST /elemental/find`                | Count Edgar filings by CIK     |
